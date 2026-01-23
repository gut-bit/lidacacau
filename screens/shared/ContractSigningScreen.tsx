import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AnimatedButton } from '@/components/AnimatedButton';
import { ContractCompletedModal } from '@/components/ContractCompletedModal';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job, ServiceType, User, PaymentTerms, WorkOrder, SignedContract } from '@/types';
import { getJobById, getUserById, getWorkOrderById, updateWorkOrder, saveContractToHistory } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { createSignedContract, ContractData } from '@/utils/contractGenerator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  workOrderId: string;
  isProducer: boolean;
}

export default function ContractSigningScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = theme;

  const { workOrderId, isProducer } = route.params;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [producer, setProducer] = useState<User | null>(null);
  const [worker, setWorker] = useState<User | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [contract, setContract] = useState<SignedContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      const wo = await getWorkOrderById(workOrderId);
      if (!wo) {
        Alert.alert('Erro', 'Ordem de serviço não encontrada');
        navigation.goBack();
        return;
      }

      setWorkOrder(wo);

      const jobData = await getJobById(wo.jobId);
      const producerData = await getUserById(wo.producerId);
      const workerData = await getUserById(wo.workerId);

      if (!jobData || !producerData || !workerData) {
        Alert.alert('Erro', 'Dados incompletos para gerar contrato');
        return;
      }

      setJob(jobData);
      setProducer(producerData);
      setWorker(workerData);

      const svc = getServiceTypeById(jobData.serviceTypeId);
      if (svc) {
        setServiceType(svc);
      }

      // Generate contract if not already exists
      if (!wo.signedContract) {
        const contractData: ContractData = {
          producer: producerData,
          worker: workerData,
          job: jobData,
          workOrder: wo,
          serviceType: svc || { id: '', name: 'Serviço', unit: '', basePrice: 0, minLevel: 1, icon: '' },
          paymentTerms: wo.paymentTerms || { type: 'full_after' },
          totalValue: wo.finalPrice,
        };

        const newContract = createSignedContract(contractData);
        setContract(newContract);
      } else {
        setContract(wo.signedContract);
      }
    } catch (error) {
      console.error('Error loading contract data:', error);
      Alert.alert('Erro', 'Não foi possível carregar o contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!hasAccepted) {
      Alert.alert(
        'Confirmacao',
        'Voce precisa confirmar que leu e aceita os termos do contrato antes de assina-lo.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSigning(true);

    try {
      if (!contract || !workOrder || !job || !producer || !worker) {
        throw new Error('Dados do contrato incompletos');
      }

      const updatedContract: SignedContract = {
        ...contract,
        [isProducer ? 'producerSignedAt' : 'workerSignedAt']: new Date().toISOString(),
      };

      await updateWorkOrder(workOrderId, {
        signedContract: updatedContract,
        negotiationStatus: 'accepted',
      });

      const bothSignedNow = updatedContract.producerSignedAt && updatedContract.workerSignedAt;

      if (bothSignedNow) {
        await saveContractToHistory(
          workOrderId,
          job.id,
          updatedContract,
          producer.id,
          'producer',
          worker.id,
          worker.name,
          serviceType?.name || 'Servico'
        );

        await saveContractToHistory(
          workOrderId,
          job.id,
          updatedContract,
          worker.id,
          'worker',
          producer.id,
          producer.name,
          serviceType?.name || 'Servico'
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setContract(updatedContract);

      if (bothSignedNow) {
        setShowContractModal(true);
      } else {
        Alert.alert(
          'Contrato Assinado',
          `Seu aceite foi registrado com sucesso em ${new Date().toLocaleDateString(
            'pt-BR'
          )}. O trabalho pode comecar quando ambas as partes assinarem.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Nao foi possivel assinar o contrato');
    } finally {
      setSigning(false);
    }
  };

  const handleCloseModal = () => {
    setShowContractModal(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  const bothSigned =
    contract?.producerSignedAt && contract?.workerSignedAt;

  const userSigned = isProducer ? contract?.producerSignedAt : contract?.workerSignedAt;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.header}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Feather name="file-text" size={32} color={colors.primary} />
              </View>
              <ThemedText type="h3" style={styles.title}>
                Contrato de Empreitada
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                {serviceType?.name}
              </ThemedText>
            </View>
          </Animated.View>

          {/* Contract Status */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.statusCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.statusRow}>
                <View style={styles.statusLabel}>
                  <Feather
                    name={contract?.producerSignedAt ? 'check-circle' : 'circle'}
                    size={20}
                    color={contract?.producerSignedAt ? colors.success : colors.textSecondary}
                  />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    Produtor
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {contract?.producerSignedAt
                    ? `Assinado em ${new Date(contract.producerSignedAt).toLocaleDateString('pt-BR')}`
                    : 'Aguardando assinatura'}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statusRow}>
                <View style={styles.statusLabel}>
                  <Feather
                    name={contract?.workerSignedAt ? 'check-circle' : 'circle'}
                    size={20}
                    color={contract?.workerSignedAt ? colors.success : colors.textSecondary}
                  />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    Trabalhador
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {contract?.workerSignedAt
                    ? `Assinado em ${new Date(contract.workerSignedAt).toLocaleDateString('pt-BR')}`
                    : 'Aguardando assinatura'}
                </ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* Contract Text */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.contractBox, { backgroundColor: colors.backgroundSecondary }]}>
              <ScrollView
                style={styles.contractScroll}
                scrollEnabled
                nestedScrollEnabled
              >
                <ThemedText
                  type="small"
                  style={[
                    styles.contractText,
                    { color: colors.text },
                  ]}
                >
                  {contract?.text}
                </ThemedText>
              </ScrollView>
            </View>
          </Animated.View>

          {/* Acceptance Checkbox */}
          {!userSigned && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Pressable
                style={[
                  styles.acceptanceBox,
                  {
                    backgroundColor: hasAccepted
                      ? colors.primary + '15'
                      : colors.backgroundSecondary,
                    borderColor: hasAccepted ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setHasAccepted(!hasAccepted);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: hasAccepted ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {hasAccepted && (
                    <Feather name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.md }}>
                  Confirmo que li e aceito os termos do contrato
                </ThemedText>
              </Pressable>
            </Animated.View>
          )}

          {/* Signed Confirmation */}
          {userSigned && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <View
                style={[
                  styles.signedBox,
                  { backgroundColor: colors.success + '15', borderColor: colors.success },
                ]}
              >
                <Feather name="check-circle" size={24} color={colors.success} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText
                    type="body"
                    style={[{ color: colors.success, fontWeight: '600' }]}
                  >
                    Contrato Assinado
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={[
                      { color: colors.success, marginTop: Spacing.xs },
                    ]}
                  >
                    Sua assinatura foi registrada em{' '}
                    {contract?.[isProducer ? 'producerSignedAt' : 'workerSignedAt']
                      ? new Date(
                        contract[
                        isProducer ? 'producerSignedAt' : 'workerSignedAt'
                        ] as string
                      ).toLocaleDateString('pt-BR')
                      : ''}
                  </ThemedText>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Info Box */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
              <Feather name="info" size={20} color={colors.primary} />
              <ThemedText
                type="small"
                style={[styles.infoText, { color: colors.textSecondary, marginLeft: Spacing.md }]}
              >
                Ambas as partes devem assinar o contrato antes do início do trabalho. Este contrato é
                legalmente vinculante.
              </ThemedText>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Sign Button */}
        {!userSigned && (
          <View style={[styles.buttonBar, { backgroundColor: colors.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}>
            <AnimatedButton
              onPress={handleAcceptContract}
              title="Aceitar e Assinar"
              icon="edit-3"
              loading={signing}
              disabled={signing || !hasAccepted}
              variant={hasAccepted ? 'primary' : 'secondary'}
              showSuccessAnimation
            />
          </View>
        )}

        {/* Waiting for Other Party */}
        {userSigned && !bothSigned && (
          <View style={[styles.buttonBar, { backgroundColor: colors.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}>
            <View
              style={[
                styles.waitingBox,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary },
              ]}
            >
              <Feather name="clock" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Aguardando a outra parte
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  {isProducer ? 'Aguardando assinatura do trabalhador' : 'Aguardando assinatura do produtor'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Both Signed - Ready to Work */}
        {bothSigned && (
          <View style={[styles.buttonBar, { backgroundColor: colors.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}>
            <View
              style={[
                styles.readyBox,
                { backgroundColor: colors.success + '15', borderColor: colors.success },
              ]}
            >
              <Feather name="check-circle" size={20} color={colors.success} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText type="body" style={[{ color: colors.success, fontWeight: '600' }]}>
                  Pronto para Comecar
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[{ color: colors.success, marginTop: Spacing.xs }]}
                >
                  Ambas as partes assinaram. O trabalho pode comecar.
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <ContractCompletedModal
        visible={showContractModal}
        onClose={handleCloseModal}
        producerName={producer?.name || ''}
        workerName={worker?.name || ''}
        serviceType={serviceType?.name || 'Servico'}
        totalValue={contract?.totalValue || 0}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  contractBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    maxHeight: 300,
  },
  contractScroll: {
    maxHeight: 300,
  },
  contractText: {
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  acceptanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  infoText: {
    flex: 1,
  },
  buttonBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
  },
  readyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
  },
});
