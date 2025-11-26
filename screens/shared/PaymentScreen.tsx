import 'core-js/stable';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, Share, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PixCharge, WorkOrderWithDetails, PaymentBreakdown, PLATFORM_FEE_PERCENTAGE } from '@/types';
import {
  getPixChargesByWorkOrder,
  markChargePaid,
  getStatusLabel,
  getStatusColor,
  calculatePaymentBreakdown,
  createSplitPaymentCharges,
  formatCurrency,
  getChargeTypeLabel,
} from '@/utils/payment';

type PaymentScreenProps = NativeStackScreenProps<any, 'Payment'>;

export default function PaymentScreen({ route, navigation }: PaymentScreenProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const workOrder: WorkOrderWithDetails | undefined = route.params?.workOrder;
  const isProducer = user?.activeRole === 'producer';

  const [workerCharge, setWorkerCharge] = useState<PixCharge | null>(null);
  const [platformCharge, setPlatformCharge] = useState<PixCharge | null>(null);
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'worker' | 'platform'>('worker');

  const loadExistingCharges = useCallback(async () => {
    if (!workOrder) return;
    
    setRefreshing(true);
    try {
      const charges = await getPixChargesByWorkOrder(workOrder.id);
      const workerPayout = charges.find((c) => c.chargeType === 'worker_payout' && (c.status === 'pending' || c.status === 'paid'));
      const platformFee = charges.find((c) => c.chargeType === 'platform_fee' && (c.status === 'pending' || c.status === 'paid'));
      
      if (workerPayout) setWorkerCharge(workerPayout);
      if (platformFee) setPlatformCharge(platformFee);
      
      if (workOrder.finalPrice) {
        setBreakdown(calculatePaymentBreakdown(Math.round(workOrder.finalPrice * 100)));
      }
    } catch (error) {
      console.error('Error loading charges:', error);
    } finally {
      setRefreshing(false);
    }
  }, [workOrder]);

  useEffect(() => {
    if (workOrder?.finalPrice) {
      setBreakdown(calculatePaymentBreakdown(Math.round(workOrder.finalPrice * 100)));
    }
    loadExistingCharges();
  }, [workOrder, loadExistingCharges]);

  const handleCreateCharges = async () => {
    if (!workOrder || !user) return;

    const workerPixKey = workOrder.worker?.workerProfile?.pixKey;
    if (!workerPixKey) {
      Alert.alert(
        'Chave PIX Necessaria',
        'O trabalhador precisa cadastrar uma chave PIX no perfil para receber pagamentos.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const result = await createSplitPaymentCharges({
        workOrderId: workOrder.id,
        payerId: workOrder.producerId,
        payerName: workOrder.producer.name,
        worker: workOrder.worker,
        totalValue: Math.round(workOrder.finalPrice * 100),
        serviceName: workOrder.serviceType?.name || 'Trabalho',
      });

      setWorkerCharge(result.workerCharge);
      setPlatformCharge(result.platformCharge);
      setBreakdown(result.breakdown);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error creating charges:', error);
      Alert.alert('Erro', error.message || 'Nao foi possivel gerar as cobrancas PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async (charge: PixCharge) => {
    await Clipboard.setStringAsync(charge.brCode);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Copiado!', 'Codigo PIX copiado para a area de transferencia');
  };

  const handleShareCode = async (charge: PixCharge) => {
    try {
      await Share.share({
        message: `Pagamento PIX - Empleitapp\n\nValor: ${formatCurrency(charge.value)}\nDestinatario: ${charge.receiverName}\nDescricao: ${charge.description}\n\nCodigo PIX:\n${charge.brCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConfirmPayment = async (charge: PixCharge) => {
    Alert.alert(
      'Confirmar Pagamento',
      `Voce confirma que o pagamento de ${formatCurrency(charge.value)} foi realizado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const updatedCharge = await markChargePaid(charge.id);
              if (updatedCharge) {
                if (charge.chargeType === 'worker_payout') {
                  setWorkerCharge(updatedCharge);
                } else {
                  setPlatformCharge(updatedCharge);
                }
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert('Sucesso!', 'Pagamento confirmado com sucesso');
              }
            } catch (error) {
              console.error('Error confirming payment:', error);
              Alert.alert('Erro', 'Nao foi possivel confirmar o pagamento');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderNoWorkOrder = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconCircle, { backgroundColor: colors.error + '20' }]}>
        <Feather name="alert-circle" size={48} color={colors.error} />
      </View>
      <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.xl }}>
        Ordem de Servico Nao Encontrada
      </ThemedText>
      <ThemedText type="body" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.md }}>
        Selecione uma ordem de servico para gerar o pagamento PIX
      </ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary, marginTop: Spacing['2xl'] }]}
        onPress={() => navigation.goBack()}
      >
        <ThemedText type="body" style={{ color: '#FFFFFF' }}>Voltar</ThemedText>
      </Pressable>
    </View>
  );

  const renderBreakdownCard = () => {
    if (!breakdown) return null;

    return (
      <View style={[styles.breakdownCard, { backgroundColor: colors.backgroundSecondary }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Divisao do Pagamento
        </ThemedText>
        
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Feather name="dollar-sign" size={16} color={colors.textSecondary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>Valor Total</ThemedText>
          </View>
          <ThemedText type="h4">{formatCurrency(breakdown.totalValue)}</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Feather name="user" size={16} color={colors.success} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: colors.success }}>
              Trabalhador (90%)
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ color: colors.success }}>
            {formatCurrency(breakdown.workerPayout)}
          </ThemedText>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLabel}>
            <Feather name="briefcase" size={16} color={colors.accent} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: colors.accent }}>
              Taxa Empleitapp (10%)
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ color: colors.accent }}>
            {formatCurrency(breakdown.platformFee)}
          </ThemedText>
        </View>

        <View style={[styles.feeDisclosure, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1, color: colors.primary }}>
            A taxa de {Math.round(PLATFORM_FEE_PERCENTAGE * 100)}% cobre custos operacionais e manutencao da plataforma
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderCreateCharge = () => (
    <View style={styles.centerContent}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="credit-card" size={48} color={colors.primary} />
      </View>
      
      <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.xl }}>
        Pagamento via PIX
      </ThemedText>
      
      <View style={[styles.detailCard, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Servico</ThemedText>
          <ThemedText type="body">{workOrder?.serviceType?.name || 'Trabalho'}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Trabalhador</ThemedText>
          <ThemedText type="body">{workOrder?.worker.name}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Valor Total</ThemedText>
          <ThemedText type="h3" style={{ color: colors.primary }}>
            {formatCurrency(Math.round((workOrder?.finalPrice || 0) * 100))}
          </ThemedText>
        </View>
      </View>

      {renderBreakdownCard()}

      {isProducer ? (
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary, marginTop: Spacing['2xl'] }]}
          onPress={handleCreateCharges}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="zap" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText type="body" style={{ color: '#FFFFFF' }}>Gerar Pagamentos PIX</ThemedText>
            </>
          )}
        </Pressable>
      ) : (
        <View style={[styles.infoCard, { backgroundColor: colors.accent + '20' }]}>
          <Feather name="info" size={20} color={colors.accent} />
          <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Aguardando o produtor gerar as cobrancas PIX para pagamento
          </ThemedText>
        </View>
      )}
    </View>
  );

  const renderChargeQR = (charge: PixCharge) => (
    <View style={styles.chargeQRContent}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(charge.status) + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(charge.status) }]} />
        <ThemedText type="small" style={{ color: getStatusColor(charge.status), fontWeight: '600' }}>
          {getStatusLabel(charge.status)}
        </ThemedText>
      </View>

      <ThemedText type="h2" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
        {formatCurrency(charge.value)}
      </ThemedText>
      
      <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.xs }}>
        {getChargeTypeLabel(charge.chargeType)}
      </ThemedText>

      <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.xs }}>
        Para: {charge.receiverName}
      </ThemedText>

      {charge.status === 'pending' && (
        <>
          <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
            <QRCode
              value={charge.brCode}
              size={180}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.md }}>
            Escaneie o QR Code com seu app de banco
          </ThemedText>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleCopyCode(charge)}
            >
              <Feather name="copy" size={20} color={colors.text} />
              <ThemedText type="small" style={{ marginTop: Spacing.xs }}>Copiar</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleShareCode(charge)}
            >
              <Feather name="share-2" size={20} color={colors.text} />
              <ThemedText type="small" style={{ marginTop: Spacing.xs }}>Enviar</ThemedText>
            </Pressable>
          </View>

          {isProducer && (
            <Pressable
              style={[styles.button, { backgroundColor: colors.success, marginTop: Spacing.xl }]}
              onPress={() => handleConfirmPayment(charge)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="body" style={{ color: '#FFFFFF' }}>Confirmar Pagamento</ThemedText>
                </>
              )}
            </Pressable>
          )}
        </>
      )}

      {charge.status === 'paid' && (
        <View style={styles.paidBadge}>
          <View style={[styles.successCircle, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={48} color={colors.success} />
          </View>
          <ThemedText type="body" style={{ textAlign: 'center', marginTop: Spacing.md, color: colors.success }}>
            Pago em: {charge.paidAt ? new Date(charge.paidAt).toLocaleString('pt-BR') : '-'}
          </ThemedText>
        </View>
      )}
    </View>
  );

  const renderCharges = () => {
    const bothPaid = workerCharge?.status === 'paid' && platformCharge?.status === 'paid';

    return (
      <View style={styles.chargesContent}>
        {renderBreakdownCard()}

        <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'worker' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('worker')}
          >
            <Feather 
              name="user" 
              size={16} 
              color={activeTab === 'worker' ? '#FFFFFF' : colors.textSecondary} 
            />
            <ThemedText 
              type="small" 
              style={{ 
                marginLeft: Spacing.xs,
                color: activeTab === 'worker' ? '#FFFFFF' : colors.textSecondary,
                fontWeight: activeTab === 'worker' ? '600' : '400',
              }}
            >
              Trabalhador
            </ThemedText>
            {workerCharge?.status === 'paid' && (
              <Feather name="check-circle" size={14} color={colors.success} style={{ marginLeft: Spacing.xs }} />
            )}
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'platform' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('platform')}
          >
            <Feather 
              name="briefcase" 
              size={16} 
              color={activeTab === 'platform' ? '#FFFFFF' : colors.textSecondary} 
            />
            <ThemedText 
              type="small" 
              style={{ 
                marginLeft: Spacing.xs,
                color: activeTab === 'platform' ? '#FFFFFF' : colors.textSecondary,
                fontWeight: activeTab === 'platform' ? '600' : '400',
              }}
            >
              Taxa
            </ThemedText>
            {platformCharge?.status === 'paid' && (
              <Feather name="check-circle" size={14} color={colors.success} style={{ marginLeft: Spacing.xs }} />
            )}
          </Pressable>
        </View>

        {activeTab === 'worker' && workerCharge && renderChargeQR(workerCharge)}
        {activeTab === 'platform' && platformCharge && renderChargeQR(platformCharge)}

        <Pressable
          style={[styles.refreshButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={loadExistingCharges}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          )}
          <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: colors.primary }}>
            Atualizar Status
          </ThemedText>
        </Pressable>

        {bothPaid && (
          <View style={[styles.allPaidCard, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={24} color={colors.success} />
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <ThemedText type="h4" style={{ color: colors.success }}>
                Pagamentos Concluidos!
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.success, marginTop: Spacing.xs }}>
                Todos os pagamentos foram realizados com sucesso
              </ThemedText>
            </View>
          </View>
        )}

        <Pressable
          style={[styles.historyButton, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('PaymentHistory')}
        >
          <Feather name="list" size={18} color={colors.primary} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: colors.primary }}>
            Ver Historico de Pagamentos
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  const hasCharges = workerCharge || platformCharge;

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        {!workOrder ? renderNoWorkOrder() : !hasCharges ? renderCreateCharge() : renderCharges()}

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Como funciona?
          </ThemedText>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>1</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              O produtor gera dois QR Codes: um para o trabalhador (90%) e outro para a taxa (10%)
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>2</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              Pague cada QR Code usando seu app de banco preferido
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>3</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              Confirme cada pagamento apos realizar a transferencia
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.success }]}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              Pronto! O trabalhador recebe seu pagamento e o servico e finalizado
            </ThemedText>
          </View>
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  breakdownCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: Spacing.sm,
  },
  feeDisclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing['2xl'],
    width: '100%',
  },
  chargesContent: {
    paddingVertical: Spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginTop: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  chargeQRContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  qrContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    width: 80,
  },
  paidBadge: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    alignSelf: 'center',
  },
  allPaidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
  infoSection: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing['2xl'],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
});
