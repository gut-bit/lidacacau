import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PixCharge, PaymentSummary, PixPaymentStatus, PixChargeType, PLATFORM_FEE_PERCENTAGE } from '@/types';
import {
  getPixChargesByUser,
  getPaymentSummary,
  getStatusLabel,
  getStatusColor,
  checkExpiredCharges,
} from '@/utils/payment';
import { formatCurrency } from '@/utils/format';

type PaymentHistoryScreenProps = NativeStackScreenProps<any, 'PaymentHistory'>;

const statusFilters: { key: PixPaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'paid', label: 'Pagos' },
  { key: 'expired', label: 'Expirados' },
];

export default function PaymentHistoryScreen({ navigation }: PaymentHistoryScreenProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [charges, setCharges] = useState<PixCharge[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<PixPaymentStatus | 'all'>('all');

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      await checkExpiredCharges();
      const [userCharges, userSummary] = await Promise.all([
        getPixChargesByUser(user.id),
        getPaymentSummary(user.id),
      ]);
      setCharges(userCharges.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setSummary(userSummary);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredCharges = selectedFilter === 'all'
    ? charges
    : charges.filter((c) => c.status === selectedFilter);

  const isReceiving = (charge: PixCharge) => charge.receiverId === user?.id;

  const renderHeader = () => (
    <View style={styles.header}>
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Feather name="arrow-down-circle" size={24} color={colors.success} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                Recebido
              </ThemedText>
              <ThemedText type="h4" style={{ color: colors.success }}>
                {formatCurrency(summary.totalReceived / 100)}
              </ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Feather name="arrow-up-circle" size={24} color={colors.error} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                Pago
              </ThemedText>
              <ThemedText type="h4" style={{ color: colors.error }}>
                {formatCurrency(summary.totalPaid / 100)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <ThemedText type="h3">{summary.completedPayments}</ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Concluidos
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h3" style={{ color: colors.warning }}>
                {summary.pendingPayments}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Pendentes
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        {statusFilters.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === filter.key ? colors.primary : colors.backgroundSecondary,
              },
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <ThemedText
              type="small"
              style={{ color: selectedFilter === filter.key ? '#FFFFFF' : colors.text }}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {filteredCharges.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={colors.textSecondary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Nenhum pagamento encontrado
          </ThemedText>
        </View>
      )}
    </View>
  );

  const getChargeTypeLabel = (chargeType?: PixChargeType): string => {
    if (chargeType === 'worker_payout') return 'Pagamento ao Trabalhador (90%)';
    if (chargeType === 'platform_fee') return 'Taxa da Plataforma (10%)';
    return 'Pagamento';
  };

  const getChargeTypeIcon = (chargeType?: PixChargeType, receiving?: boolean): string => {
    if (chargeType === 'platform_fee') return 'percent';
    return receiving ? 'arrow-down-left' : 'arrow-up-right';
  };

  const renderChargeItem = ({ item }: { item: PixCharge }) => {
    const receiving = isReceiving(item);
    const otherParty = receiving ? item.payerName : item.receiverName;
    const isPlatformCharge = item.chargeType === 'platform_fee';
    const isWorkerCharge = item.chargeType === 'worker_payout';
    
    const iconColor = isPlatformCharge 
      ? colors.accent 
      : (receiving ? colors.success : colors.error);
    const bgColor = isPlatformCharge 
      ? colors.accent + '20' 
      : (receiving ? colors.success + '20' : colors.error + '20');

    return (
      <Pressable
        style={[styles.chargeCard, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => {
          Alert.alert(
            receiving ? 'Recebimento' : 'Pagamento',
            `${item.description}\n\nValor: ${formatCurrency(item.value / 100)}\nStatus: ${getStatusLabel(item.status)}\nData: ${new Date(item.createdAt).toLocaleDateString('pt-BR')}`,
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.chargeHeader}>
          <View style={[styles.typeIcon, { backgroundColor: bgColor }]}>
            <Feather
              name={getChargeTypeIcon(item.chargeType, receiving) as any}
              size={20}
              color={iconColor}
            />
          </View>
          <View style={styles.chargeInfo}>
            <ThemedText type="body" numberOfLines={1}>
              {item.chargeType ? getChargeTypeLabel(item.chargeType) : (receiving ? 'Recebimento' : 'Pagamento')}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {otherParty}
            </ThemedText>
          </View>
          <View style={styles.chargeAmount}>
            <ThemedText type="h4" style={{ color: isPlatformCharge ? colors.accent : (receiving ? colors.success : colors.text) }}>
              {receiving ? '+' : '-'}{formatCurrency(item.value / 100)}
            </ThemedText>
          </View>
        </View>

        {(isWorkerCharge || isPlatformCharge) && (
          <View style={[styles.breakdownRow, { borderTopColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
              {isPlatformCharge 
                ? `Taxa de ${Math.round(PLATFORM_FEE_PERCENTAGE * 100)}% sobre o servico` 
                : `Voce recebe ${Math.round((1 - PLATFORM_FEE_PERCENTAGE) * 100)}% do valor total`}
            </ThemedText>
          </View>
        )}

        <View style={styles.chargeDetails}>
          <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
            {item.description}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <ThemedText type="small" style={{ color: getStatusColor(item.status) }}>
              {getStatusLabel(item.status)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.chargeFooter}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
          {item.status === 'paid' && item.paidAt && (
            <ThemedText type="small" style={{ color: colors.success }}>
              Pago em {new Date(item.paidAt).toLocaleDateString('pt-BR')}
            </ThemedText>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenFlatList
        data={filteredCharges}
        renderItem={renderChargeItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  chargeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  chargeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chargeAmount: {
    alignItems: 'flex-end',
  },
  chargeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  chargeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
  },
});
