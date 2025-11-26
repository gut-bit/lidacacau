import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { SocialLinksDisplay } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job, Bid, User, WorkOrder, WorkOrderWithDetails } from '@/types';
import {
  getJobById,
  getBidsByJob,
  getUserById,
  createBid,
  acceptBid,
  getWorkOrderByJobId,
  updateWorkOrder,
  getBidsByWorker,
} from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import {
  formatCurrency,
  formatQuantityWithUnit,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  getLevelLabel,
} from '@/utils/format';

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
      const jobData = await getJobById(jobId);
      setJob(jobData);

      if (jobData) {
        const producerData = await getUserById(jobData.producerId);
        setProducer(producerData);

        const jobBids = await getBidsByJob(jobId);
        const bidsWithWorkers: BidWithWorker[] = [];
        for (const bid of jobBids) {
          const workerData = await getUserById(bid.workerId);
          if (workerData) {
            bidsWithWorkers.push({ ...bid, worker: workerData });
          }
        }
        setBids(bidsWithWorkers.sort((a, b) => a.price - b.price));

        if (isWorker && user) {
          const workerBid = jobBids.find((b) => b.workerId === user.id);
          if (workerBid) {
            setMyBid(workerBid);
            setBidPrice(workerBid.price.toString());
            setBidMessage(workerBid.message || '');
          }
        }

        const wo = await getWorkOrderByJobId(jobId);
        setWorkOrder(wo);
        if (wo) {
          const workerData = await getUserById(wo.workerId);
          setWorker(workerData);
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

    setSubmitting(true);
    try {
      await createBid({
        jobId,
        workerId: user!.id,
        price: parseFloat(bidPrice),
        message: bidMessage.trim() || undefined,
      });
      Alert.alert('Sucesso', myBid ? 'Proposta atualizada!' : 'Proposta enviada!');
      await loadJobDetails();
    } catch (error: any) {
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
              const newWorkOrder = await acceptBid(selectedBidId);
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
              await updateWorkOrder(workOrder.id, { status: 'completed' });
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
                      <View style={styles.bidWorkerInfo}>
                        <ThemedText type="h4">{bid.worker.name}</ThemedText>
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
                      </View>
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
              <View style={styles.detailRow}>
                <Feather name="user" size={16} color={colors.textSecondary} />
                <ThemedText type="body">{worker.name}</ThemedText>
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
              </View>
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
            </View>
          </View>
        )}

        {isWorker && producer && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Contato do Produtor
            </ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <View style={styles.detailRow}>
                <Feather name="user" size={16} color={colors.textSecondary} />
                <ThemedText type="body">{producer.name}</ThemedText>
              </View>
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
          <Button onPress={handleAcceptBid} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : 'Aceitar Proposta'}
          </Button>
        </View>
      )}

      {isProducer && workOrder?.status === 'checked_out' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <Button onPress={handleConfirmCompletion} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : 'Confirmar Conclusão'}
          </Button>
        </View>
      )}

      {isWorker && job.status === 'open' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <Button onPress={handleSubmitBid} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : myBid ? 'Atualizar Proposta' : 'Enviar Proposta'}
          </Button>
        </View>
      )}

      {workOrder && workOrder.status === 'assigned' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
          <Button
            onPress={() =>
              navigation.navigate('ContractSigning', {
                workOrderId: workOrder.id,
                isProducer: isProducer,
              })
            }
            disabled={submitting}
          >
            <Feather name="file-text" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
            Assinar Contrato de Empreitada
          </Button>
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
});
