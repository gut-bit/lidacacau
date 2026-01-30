import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, FlatList, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { AnimatedButton } from '@/components/AnimatedButton';
import { SocialLinksDisplay } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { shareCard, copyCardLink } from '@/utils/sharing';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job, Bid, User, WorkOrder, WorkOrderWithDetails } from '@/types';
import { serviceFactory } from '@/services/ServiceFactory';

import { getServiceTypeById } from '@/data/serviceTypes';
import {
  formatCurrency,
  formatQuantityWithUnit,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getLevelLabel,
} from '@/utils/format';
import { generateAndShareContract } from '@/utils/contractGenerator';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

interface BidWithWorker extends Bid {
  worker: User;
}

export default function JobDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { jobId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<BidWithWorker[]>([]);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [producer, setProducer] = useState<User | null>(null);
  const [worker, setWorker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [myBid, setMyBid] = useState<Bid | null>(null);

  const isProducer = user?.role === 'producer';
  const isWorker = user?.role === 'worker';

  const loadJobDetails = useCallback(async () => {
    try {
      const jobService = serviceFactory.getJobService();

      // 1. Get Job Details
      const jobResult = await jobService.getJob(jobId);
      if (!jobResult.success || !jobResult.data) {
        setJob(null);
        return;
      }
      const jobData = jobResult.data;
      setJob(jobData);

      // 2. Get Producer Details (Service)
      if (jobData) {
        const authService = serviceFactory.getAuthService();
        const producerData = await authService.getUserById(jobData.producerId);
        setProducer(producerData);

        // 3. Get Bids (Service - includes Worker)
        const bidsResult = await jobService.getBidsForJob(jobId);
        if (bidsResult.success && bidsResult.data) {
          setBids(bidsResult.data.sort((a, b) => a.price - b.price));
        }

        if (isWorker && user) {
          // Check if I have a bid
          const myBidFound = (bidsResult.success && bidsResult.data)
            ? bidsResult.data.find((b) => b.workerId === user.id)
            : null;

          if (myBidFound) {
            setMyBid(myBidFound);
            setBidPrice(myBidFound.price.toString());
            setBidMessage(myBidFound.message || '');
          }
        }

        // 4. Get Work Order (Service)
        const workOrderService = serviceFactory.getWorkOrderService();
        const woResult = await workOrderService.getWorkOrderByJobId(jobId);
        if (woResult.success && woResult.data) {
          setWorkOrder(woResult.data);
          setWorker(woResult.data.worker);
        }
      }
    } catch (error) {
      console.error('Error loading job details:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId, isWorker, user]);

  useFocusEffect(
    useCallback(() => {
      loadJobDetails();
    }, [loadJobDetails])
  );

  const serviceType = job ? getServiceTypeById(job.serviceTypeId) : null;

  const handleSubmitBid = async () => {
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      Alert.alert('Erro', 'Informe um valor para sua proposta');
      return;
    }

    try {
      setSubmitting(true);
      const jobService = serviceFactory.getJobService();
      const createBidResult = await jobService.createBid({
        jobId,
        workerId: user!.id,
        price: parseFloat(bidPrice),
        message: bidMessage.trim() || undefined,
      });

      if (!createBidResult.success) {
        throw new Error(createBidResult.error || 'Erro ao criar proposta');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Sucesso',
        myBid ? 'Proposta atualizada com sucesso!' : 'Proposta enviada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a proposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!selectedBidId) {
      Alert.alert('Erro', 'Selecione uma proposta para aceitar');
      return;
    }

    const selectedBid = bids.find(b => b.id === selectedBidId);
    if (!selectedBid) {
      Alert.alert('Erro', 'Proposta não encontrada');
      return;
    }

    Alert.alert(
      'Confirmar',
      'Deseja aceitar esta proposta? As outras propostas serão rejeitadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            setSubmitting(true);
            try {
              const jobService = serviceFactory.getJobService();
              const result = await jobService.acceptBid(selectedBidId);

              if (!result.success) throw new Error(result.error || 'Erro ao aceitar proposta');

              const workOrderService = serviceFactory.getWorkOrderService();
              const woResult = await workOrderService.getWorkOrderByJobId(jobId);

              if (!woResult.success || !woResult.data) {
                throw new Error('Ordem de servico nao encontrada apos aceite');
              }
              const newWorkOrder = woResult.data;

              navigation.navigate('NegotiationMatch', {
                workOrderId: newWorkOrder.id,
                worker: selectedBid.worker,
                producer: producer!,
                serviceName: serviceType?.name || 'Serviço',
                price: selectedBid.price,
                isProducer: true,
              });
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível aceitar a proposta');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmCompletion = async () => {
    if (!workOrder) return;

    Alert.alert(
      'Confirmar Conclusão',
      'Confirma que o serviço foi concluído satisfatoriamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSubmitting(true);
            try {
              const workOrderService = serviceFactory.getWorkOrderService();
              const result = await workOrderService.complete(workOrder.id);
              if (!result.success) throw new Error(result.error || 'Erro ao concluir');

              Alert.alert('Sucesso', 'Serviço concluído!', [
                {
                  text: 'Avaliar Trabalhador',
                  onPress: () =>
                    navigation.navigate('Review', {
                      workOrderId: workOrder.id,
                      revieweeId: workOrder.workerId,
                      revieweeName: worker?.name || 'Trabalhador',
                    }),
                },
                { text: 'Depois', style: 'cancel' },
              ]);
              await loadJobDetails();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível confirmar');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async (method: 'whatsapp' | 'system' | 'copy') => {
    if (!job) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (method === 'copy') {
      const success = await copyCardLink('demand', job.id);
      if (success) {
        Alert.alert('Copiado!', 'Link copiado para a area de transferencia');
      } else {
        Alert.alert('Erro', 'Nao foi possivel copiar o link');
      }
      return;
    }

    const success = await shareCard('demand', job, producer?.name, method);
    if (!success && method === 'whatsapp') {
      Alert.alert('Erro', 'Nao foi possivel compartilhar via WhatsApp. Tente pelo botao de compartilhar.');
    }
  };

  const showShareOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'WhatsApp', 'Compartilhar', 'Copiar Link'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleShare('whatsapp');
          else if (buttonIndex === 2) handleShare('system');
          else if (buttonIndex === 3) handleShare('copy');
        }
      );
    } else {
      Alert.alert(
        'Compartilhar',
        'Como deseja compartilhar esta demanda?',
        [
          { text: 'WhatsApp', onPress: () => handleShare('whatsapp') },
          { text: 'Outros', onPress: () => handleShare('system') },
          { text: 'Copiar Link', onPress: () => handleShare('copy') },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const handleDeleteJob = async () => {
    Alert.alert(
      'Excluir Demanda',
      'Tem certeza que deseja excluir esta demanda? Esta acao nao pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const jobService = serviceFactory.getJobService();
              const result = await jobService.deleteJob(jobId);

              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Sucesso', 'Demanda excluida com sucesso!');
                navigation.goBack();
              } else {
                throw new Error(result.error || 'Falha ao excluir');
              }
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erro', 'Nao foi possivel excluir a demanda');
            }
          },
        },
      ]
    );
  };

  const showOwnerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Compartilhar', 'Excluir Demanda'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) showShareOptions();
          else if (buttonIndex === 2) handleDeleteJob();
        }
      );
    } else {
      Alert.alert(
        'Opcoes',
        'O que deseja fazer?',
        [
          { text: 'Compartilhar', onPress: showShareOptions },
          { text: 'Excluir Demanda', style: 'destructive', onPress: handleDeleteJob },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const isOwner = user?.id === job?.producerId;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!job) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Demanda não encontrada</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Feather name={serviceType?.icon as any || 'briefcase'} size={24} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <ThemedText type="h3">{serviceType?.name || 'Serviço'}</ThemedText>
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                {formatQuantityWithUnit(job.quantity, serviceType?.unit || '')}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={[styles.shareButton, { backgroundColor: colors.primary + '20' }]}
                onPress={showShareOptions}
              >
                <Feather name="share-2" size={18} color={colors.primary} />
              </Pressable>
              {isOwner && (
                <Pressable
                  style={[styles.optionsButton, { backgroundColor: colors.error + '20' }]}
                  onPress={showOwnerOptions}
                >
                  <Feather name="more-vertical" size={18} color={colors.error} />
                </Pressable>
              )}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(job.status, colors) + '20' },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: getStatusColor(job.status, colors), fontWeight: '600' }}
                >
                  {getStatusLabel(job.status)}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.text, flex: 1 }}>
                {job.locationText}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <Feather name="dollar-sign" size={16} color={colors.accent} />
              <ThemedText type="h4" style={{ color: colors.accent }}>
                {formatCurrency(job.offer)}
              </ThemedText>
            </View>
            {job.notes && (
              <View style={styles.detailRow}>
                <Feather name="file-text" size={16} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.textSecondary, flex: 1 }}>
                  {job.notes}
                </ThemedText>
              </View>
            )}
            <View style={styles.detailRow}>
              <Feather name="calendar" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Criado em {formatDateTime(job.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>

        {isProducer && job.status === 'open' && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Propostas ({bids.filter((b) => b.status === 'pending').length})
            </ThemedText>
            {bids.filter((b) => b.status === 'pending').length === 0 ? (
              <View style={[styles.emptyBids, { backgroundColor: colors.backgroundSecondary }]}>
                <Feather name="inbox" size={32} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  Nenhuma proposta recebida ainda
                </ThemedText>
              </View>
            ) : (
              bids
                .filter((b) => b.status === 'pending')
                .map((bid) => (
                  <Pressable
                    key={bid.id}
                    style={({ pressed }) => [
                      styles.bidCard,
                      { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
                      selectedBidId === bid.id && { borderColor: colors.primary, borderWidth: 2 },
                      Shadows.card,
                    ]}
                    onPress={() => setSelectedBidId(bid.id)}
                  >
                    <View style={styles.bidHeader}>
                      <Pressable
                        style={styles.bidWorkerInfo}
                        onPress={() => navigation.navigate('OtherUserProfile', { userId: bid.worker.id })}
                      >
                        <ThemedText type="h4" style={{ color: colors.link }}>{bid.worker.name}</ThemedText>
                        <View
                          style={[
                            styles.levelBadge,
                            { backgroundColor: LevelColors[`N${bid.worker.level || 1}` as keyof typeof LevelColors] },
                          ]}
                        >
                          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>
                            {getLevelLabel(bid.worker.level || 1)}
                          </ThemedText>
                        </View>
                        <Feather name="external-link" size={14} color={colors.link} />
                      </Pressable>
                      <ThemedText type="h3" style={{ color: colors.accent }}>
                        {formatCurrency(bid.price)}
                      </ThemedText>
                    </View>
                    {bid.message && (
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        "{bid.message}"
                      </ThemedText>
                    )}
                    {bid.worker.socialLinks && Object.keys(bid.worker.socialLinks).length > 0 && (
                      <View style={styles.socialLinksRow}>
                        <SocialLinksDisplay socialLinks={bid.worker.socialLinks} size="small" />
                      </View>
                    )}
                    {selectedBidId === bid.id && (
                      <View style={styles.selectedIndicator}>
                        <Feather name="check-circle" size={16} color={colors.primary} />
                        <ThemedText type="small" style={{ color: colors.primary }}>
                          Selecionado
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>
                ))
            )}
          </View>
        )}

        {isProducer && workOrder && worker && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Ordem de Serviço
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <Pressable
                style={styles.detailRow}
                onPress={() => navigation.navigate('OtherUserProfile', { userId: worker.id })}
              >
                <Feather name="user" size={16} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.link }}>{worker.name}</ThemedText>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: LevelColors[`N${worker.level || 1}` as keyof typeof LevelColors] },
                  ]}
                >
                  <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>
                    {getLevelLabel(worker.level || 1)}
                  </ThemedText>
                </View>
                <Feather name="external-link" size={14} color={colors.link} />
              </Pressable>
              <View style={styles.detailRow}>
                <Feather name="dollar-sign" size={16} color={colors.accent} />
                <ThemedText type="h4" style={{ color: colors.accent }}>
                  {formatCurrency(workOrder.finalPrice)}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <Feather name="activity" size={16} color={getStatusColor(workOrder.status, colors)} />
                <ThemedText type="body" style={{ color: getStatusColor(workOrder.status, colors) }}>
                  {getStatusLabel(workOrder.status)}
                </ThemedText>
              </View>
              {worker?.socialLinks && Object.keys(worker.socialLinks).length > 0 && (
                <View style={styles.socialLinksSection}>
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
                    Contato do Trabalhador
                  </ThemedText>
                  <SocialLinksDisplay socialLinks={worker.socialLinks} size="small" />
                </View>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.contractButton,
                  { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  if (job && workOrder && producer && worker && serviceType) {
                    generateAndShareContract({
                      job,
                      workOrder,
                      producer,
                      worker,
                      serviceType,
                    });
                  } else {
                    Alert.alert('Erro', 'Dados incompletos para gerar o contrato');
                  }
                }}
              >
                <Feather name="file-text" size={16} color={colors.text} />
                <ThemedText type="small" style={{ fontWeight: '600' }}>
                  Visualizar Contrato
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {isWorker && producer && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Contato do Produtor
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <Pressable
                style={styles.detailRow}
                onPress={() => navigation.navigate('OtherUserProfile', { userId: producer.id })}
              >
                <Feather name="user" size={16} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.link }}>{producer.name}</ThemedText>
                <Feather name="external-link" size={14} color={colors.link} />
              </Pressable>
              {producer.phone && (
                <View style={styles.detailRow}>
                  <Feather name="phone" size={16} color={colors.textSecondary} />
                  <ThemedText type="body" style={{ color: colors.textSecondary }}>
                    {producer.phone}
                  </ThemedText>
                </View>
              )}
              {producer.socialLinks && Object.keys(producer.socialLinks).length > 0 && (
                <View style={styles.socialLinksSection}>
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
                    Redes Sociais
                  </ThemedText>
                  <SocialLinksDisplay socialLinks={producer.socialLinks} size="small" />
                </View>
              )}
            </View>
          </View>
        )}

        {isWorker && job.status === 'open' && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              {myBid ? 'Atualizar Proposta' : 'Enviar Proposta'}
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={styles.label}>
                  Valor (R$)
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
                  ]}
                >
                  <ThemedText type="body" style={{ color: colors.textSecondary }}>
                    R$
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={job.offer.toString()}
                    placeholderTextColor={colors.textSecondary}
                    value={bidPrice}
                    onChangeText={setBidPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <ThemedText type="small" style={styles.label}>
                  Mensagem (opcional)
                </ThemedText>
                <View
                  style={[
                    styles.textAreaWrapper,
                    { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.textArea, { color: colors.text }]}
                    placeholder="Apresente-se ou descreva sua experiência..."
                    placeholderTextColor={colors.textSecondary}
                    value={bidMessage}
                    onChangeText={setBidMessage}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScreenKeyboardAwareScrollView>

      {isProducer && job.status === 'open' && selectedBidId && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <AnimatedButton
            onPress={handleAcceptBid}
            title="Aceitar Proposta"
            icon="check-circle"
            loading={submitting}
            disabled={submitting}
            variant="accent"
            size="large"
            showSuccessAnimation
          />
        </View>
      )}

      {isProducer && workOrder?.status === 'checked_out' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <AnimatedButton
            onPress={handleConfirmCompletion}
            title="Confirmar Conclusao"
            icon="check-circle"
            loading={submitting}
            disabled={submitting}
            variant="success"
            showSuccessAnimation
          />
        </View>
      )}

      {isWorker && job.status === 'open' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <AnimatedButton
            onPress={handleSubmitBid}
            title={myBid ? 'Atualizar Proposta' : 'Enviar Proposta'}
            icon="send"
            loading={submitting}
            disabled={submitting}
            showSuccessAnimation
          />
        </View>
      )}

      {workOrder && workOrder.status === 'assigned' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <AnimatedButton
            onPress={() =>
              navigation.navigate('ContractSigning', {
                workOrderId: workOrder.id,
                isProducer: isProducer,
              })
            }
            title="Assinar Contrato de Empreitada"
            icon="file-text"
            disabled={submitting}
            showSuccessAnimation
          />
        </View>
      )}

      {isProducer && workOrder?.status === 'completed' && worker && producer && workOrder.finalPrice && workOrder.finalPrice > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <Button
            onPress={() => {
              if (!worker.workerProfile?.pixKey) {
                Alert.alert(
                  'PIX nao Configurado',
                  'O trabalhador ainda nao configurou sua chave PIX para receber pagamentos. Solicite que ele configure em seu perfil.',
                  [{ text: 'OK' }]
                );
                return;
              }
              const workOrderWithDetails = {
                ...workOrder,
                worker: worker,
                producer: producer,
                serviceType: serviceType,
              } as WorkOrderWithDetails;
              navigation.navigate('Payment', { workOrder: workOrderWithDetails });
            }}
            disabled={submitting}
          >
            <Feather name="credit-card" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
            Pagar com PIX
          </Button>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  emptyBids: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.md,
  },
  bidCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidWorkerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  socialLinksRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  socialLinksSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaWrapper: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    minHeight: 80,
  },
  textArea: {
    fontSize: 16,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
});
