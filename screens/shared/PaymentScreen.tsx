import 'core-js/stable';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
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
import { PixCharge, WorkOrderWithDetails } from '@/types';
import {
  createPixCharge,
  getPixChargesByWorkOrder,
  markChargePaid,
  getStatusLabel,
  getStatusColor,
} from '@/utils/payment';
import { formatCurrency } from '@/utils/format';

type PaymentScreenProps = NativeStackScreenProps<any, 'Payment'>;

export default function PaymentScreen({ route, navigation }: PaymentScreenProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const workOrder: WorkOrderWithDetails | undefined = route.params?.workOrder;
  const isProducer = user?.activeRole === 'producer';

  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadExistingCharge = useCallback(async () => {
    if (!workOrder) return;
    
    setRefreshing(true);
    try {
      const charges = await getPixChargesByWorkOrder(workOrder.id);
      const pendingCharge = charges.find((c) => c.status === 'pending' || c.status === 'paid');
      if (pendingCharge) {
        setCharge(pendingCharge);
      }
    } catch (error) {
      console.error('Error loading charge:', error);
    } finally {
      setRefreshing(false);
    }
  }, [workOrder]);

  useEffect(() => {
    loadExistingCharge();
  }, [loadExistingCharge]);

  const handleCreateCharge = async () => {
    if (!workOrder || !user) return;

    setLoading(true);
    try {
      const newCharge = await createPixCharge({
        workOrderId: workOrder.id,
        payerId: workOrder.producerId,
        payerName: workOrder.producer.name,
        receiverId: workOrder.workerId,
        receiverName: workOrder.worker.name,
        value: Math.round(workOrder.finalPrice * 100),
        description: `Servico: ${workOrder.serviceType?.name || 'Trabalho'} - Empleitapp`,
      });

      setCharge(newCharge);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error creating charge:', error);
      Alert.alert('Erro', 'Nao foi possivel gerar a cobranca PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!charge) return;
    
    await Clipboard.setStringAsync(charge.brCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copiado!', 'Codigo PIX copiado para a area de transferencia');
  };

  const handleShareCode = async () => {
    if (!charge) return;

    try {
      await Share.share({
        message: `Pagamento PIX - Empleitapp\n\nValor: ${formatCurrency(charge.value / 100)}\nDescricao: ${charge.description}\n\nCodigo PIX:\n${charge.brCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConfirmPayment = async () => {
    if (!charge) return;

    Alert.alert(
      'Confirmar Pagamento',
      'Voce confirma que o pagamento foi realizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const updatedCharge = await markChargePaid(charge.id);
              if (updatedCharge) {
                setCharge(updatedCharge);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Valor</ThemedText>
          <ThemedText type="h3" style={{ color: colors.primary }}>
            {formatCurrency(workOrder?.finalPrice || 0)}
          </ThemedText>
        </View>
      </View>

      {isProducer ? (
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary, marginTop: Spacing['2xl'] }]}
          onPress={handleCreateCharge}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="zap" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText type="body" style={{ color: '#FFFFFF' }}>Gerar QR Code PIX</ThemedText>
            </>
          )}
        </Pressable>
      ) : (
        <View style={[styles.infoCard, { backgroundColor: colors.accent + '20' }]}>
          <Feather name="info" size={20} color={colors.accent} />
          <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Aguardando o produtor gerar a cobranca PIX para pagamento
          </ThemedText>
        </View>
      )}
    </View>
  );

  const renderCharge = () => (
    <View style={styles.chargeContent}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(charge!.status) + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(charge!.status) }]} />
        <ThemedText type="small" style={{ color: getStatusColor(charge!.status), fontWeight: '600' }}>
          {getStatusLabel(charge!.status)}
        </ThemedText>
      </View>

      <ThemedText type="h2" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
        {formatCurrency(charge!.value / 100)}
      </ThemedText>
      
      <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.xs }}>
        {charge!.description}
      </ThemedText>

      {charge!.status === 'pending' && (
        <>
          <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
            <QRCode
              value={charge!.brCode}
              size={200}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.md }}>
            Escaneie o QR Code com seu app de banco ou copie o codigo PIX
          </ThemedText>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleCopyCode}
            >
              <Feather name="copy" size={20} color={colors.text} />
              <ThemedText type="small" style={{ marginTop: Spacing.xs }}>Copiar</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleShareCode}
            >
              <Feather name="share-2" size={20} color={colors.text} />
              <ThemedText type="small" style={{ marginTop: Spacing.xs }}>Compartilhar</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={loadExistingCharge}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="refresh-cw" size={20} color={colors.text} />
              )}
              <ThemedText type="small" style={{ marginTop: Spacing.xs }}>Atualizar</ThemedText>
            </Pressable>
          </View>

          {!isProducer && (
            <Pressable
              style={[styles.button, { backgroundColor: colors.success, marginTop: Spacing['2xl'] }]}
              onPress={handleConfirmPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                  <ThemedText type="body" style={{ color: '#FFFFFF' }}>Confirmar Recebimento</ThemedText>
                </>
              )}
            </Pressable>
          )}

          <View style={[styles.expiryInfo, { backgroundColor: colors.warning + '20' }]}>
            <Feather name="clock" size={16} color={colors.warning} />
            <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: colors.warning }}>
              Valido ate: {new Date(charge!.expiresAt).toLocaleString('pt-BR')}
            </ThemedText>
          </View>
        </>
      )}

      {charge!.status === 'paid' && (
        <View style={styles.paidContent}>
          <View style={[styles.successCircle, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={64} color={colors.success} />
          </View>
          <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.xl, color: colors.success }}>
            Pagamento Confirmado!
          </ThemedText>
          <ThemedText type="small" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.sm }}>
            Pago em: {charge!.paidAt ? new Date(charge!.paidAt).toLocaleString('pt-BR') : '-'}
          </ThemedText>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary, marginTop: Spacing['2xl'] }]}
            onPress={() => navigation.navigate('PaymentHistory')}
          >
            <Feather name="list" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
            <ThemedText type="body" style={{ color: '#FFFFFF' }}>Ver Historico</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        {!workOrder ? renderNoWorkOrder() : !charge ? renderCreateCharge() : renderCharge()}

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Como funciona o PIX?
          </ThemedText>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>1</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              O produtor gera o QR Code PIX com o valor do servico
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>2</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              O trabalhador escaneia ou copia o codigo no app do banco
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF' }}>3</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              O pagamento e processado instantaneamente (24h por dia)
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: colors.success }]}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              Confirmacao automatica do recebimento
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
  chargeContent: {
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
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  paidContent: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
