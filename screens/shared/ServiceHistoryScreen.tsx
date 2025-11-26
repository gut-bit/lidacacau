import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { WorkOrder, Job, User } from '@/types';
import { getWorkOrdersByProducer, getWorkOrdersByWorker, getJobById, getUserById } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatDate, getLevelLabel } from '@/utils/format';
import { generateServiceReceipt, shareReceipt } from '@/utils/receiptGenerator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'completed' | 'in_progress';

interface EnrichedWorkOrder extends WorkOrder {
  job?: Job;
  otherParty?: User;
  serviceTypeName?: string;
}

export default function ServiceHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;
  
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 80;
  }

  const [workOrders, setWorkOrders] = useState<EnrichedWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const isProducer = user?.activeRole === 'producer' || user?.role === 'producer';

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const orders = isProducer
        ? await getWorkOrdersByProducer(user.id)
        : await getWorkOrdersByWorker(user.id);

      const enrichedOrders: EnrichedWorkOrder[] = await Promise.all(
        orders.map(async (wo) => {
          const job = await getJobById(wo.jobId);
          const otherPartyId = isProducer ? wo.workerId : wo.producerId;
          const otherParty = await getUserById(otherPartyId);
          const serviceType = job ? getServiceTypeById(job.serviceTypeId) : null;
          return {
            ...wo,
            job: job || undefined,
            otherParty: otherParty || undefined,
            serviceTypeName: serviceType?.name || 'Servico',
          };
        })
      );

      enrichedOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setWorkOrders(enrichedOrders);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isProducer]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const filteredOrders = workOrders.filter((wo: EnrichedWorkOrder) => {
    switch (filter) {
      case 'completed':
        return wo.status === 'completed';
      case 'in_progress':
        return wo.status === 'checked_in' || wo.status === 'assigned';
      default:
        return true;
    }
  });

  const stats = {
    total: workOrders.length,
    completed: workOrders.filter((wo) => wo.status === 'completed').length,
    totalValue: workOrders
      .filter((wo) => wo.status === 'completed')
      .reduce((sum, wo) => sum + (wo.finalPrice || 0), 0),
  };

  const handleExportReceipt = async (workOrder: EnrichedWorkOrder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingPdf(workOrder.id);

    try {
      const producer = isProducer ? user : workOrder.otherParty;
      const worker = isProducer ? workOrder.otherParty : user;
      
      if (!producer || !worker || !workOrder.job) {
        Alert.alert('Erro', 'Dados incompletos para gerar comprovante');
        return;
      }

      const serviceType = getServiceTypeById(workOrder.job.serviceTypeId);

      const receiptHtml = generateServiceReceipt({
        workOrder,
        job: workOrder.job,
        producer,
        worker,
        serviceType: serviceType || { id: '', name: 'Servico', unit: '', basePrice: 0, minLevel: 1, icon: '' },
      });

      await shareReceipt(receiptHtml, `comprovante-${workOrder.id}`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel gerar o comprovante');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Concluido', color: colors.success, icon: 'check-circle' };
      case 'checked_in':
        return { label: 'Em Execucao', color: colors.warning, icon: 'clock' };
      case 'assigned':
        return { label: 'Agendado', color: colors.link, icon: 'calendar' };
      case 'checked_out':
        return { label: 'Aguardando', color: colors.secondary, icon: 'loader' };
      default:
        return { label: status, color: colors.textSecondary, icon: 'help-circle' };
    }
  };

  const FilterChip = ({ type, label }: { type: FilterType; label: string }) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        setFilter(type);
      }}
      style={[
        styles.filterChip,
        {
          backgroundColor: filter === type ? colors.primary : colors.backgroundSecondary,
          borderColor: filter === type ? colors.primary : colors.border,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: filter === type ? '#FFFFFF' : colors.textSecondary, fontWeight: '600' }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderWorkOrderCard = (workOrder: EnrichedWorkOrder, index: number) => {
    const statusInfo = getStatusInfo(workOrder.status);
    const otherPartyLevel = workOrder.otherParty?.level || 1;
    const levelColor = LevelColors[`N${otherPartyLevel}` as keyof typeof LevelColors];

    return (
      <Animated.View
        key={workOrder.id}
        entering={FadeInDown.delay(index * 50).springify()}
      >
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.cardHeader}>
            <View style={styles.serviceInfo}>
              <ThemedText type="h4" style={{ color: colors.text }}>
                {workOrder.serviceTypeName}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                <Feather name={statusInfo.icon as any} size={12} color={statusInfo.color} />
                <ThemedText type="small" style={{ color: statusInfo.color, marginLeft: 4 }}>
                  {statusInfo.label}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="h4" style={{ color: colors.primary }}>
              {formatCurrency(workOrder.finalPrice)}
            </ThemedText>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Feather name="user" size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                {isProducer ? 'Trabalhador' : 'Produtor'}: {workOrder.otherParty?.name || 'N/A'}
              </ThemedText>
              {!isProducer && workOrder.otherParty?.level ? (
                <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                  <ThemedText type="small" style={{ color: '#FFF', fontSize: 10 }}>
                    {getLevelLabel(workOrder.otherParty.level)}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.infoRow}>
              <Feather name="map-pin" size={14} color={colors.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: colors.textSecondary, marginLeft: Spacing.xs, flex: 1 }}
                numberOfLines={1}
              >
                {workOrder.job?.locationText || 'Local nao especificado'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                {formatDate(workOrder.createdAt)}
              </ThemedText>
            </View>
          </View>

          {workOrder.status === 'completed' ? (
            <View style={styles.cardFooter}>
              <Pressable
                onPress={() => handleExportReceipt(workOrder)}
                disabled={generatingPdf === workOrder.id}
                style={[styles.exportButton, { backgroundColor: colors.primary }]}
              >
                {generatingPdf === workOrder.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="file-text" size={16} color="#FFFFFF" />
                    <ThemedText type="small" style={{ color: '#FFFFFF', marginLeft: Spacing.xs, fontWeight: '600' }}>
                      Exportar Comprovante
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ marginTop: Spacing.md, color: colors.textSecondary }}>
            Carregando historico...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing['2xl'] },
        ]}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
                  {stats.total}
                </ThemedText>
                <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Total de Servicos
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.statItem}>
                <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
                  {stats.completed}
                </ThemedText>
                <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Concluidos
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.statItem}>
                <ThemedText type="h3" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(stats.totalValue)}
                </ThemedText>
                <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {isProducer ? 'Total Pago' : 'Total Recebido'}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.filterSection}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
            Filtrar por Status
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <FilterChip type="all" label="Todos" />
              <FilterChip type="completed" label="Concluidos" />
              <FilterChip type="in_progress" label="Em Andamento" />
            </View>
          </ScrollView>
        </View>

        <View style={styles.listSection}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Servico' : 'Servicos'}
          </ThemedText>

          {filteredOrders.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Feather name="inbox" size={48} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
                Nenhum servico encontrado
              </ThemedText>
            </View>
          ) : (
            filteredOrders.map((wo, index) => renderWorkOrderCard(wo, index))
          )}
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
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listSection: {
    flex: 1,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  serviceInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  cardBody: {
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  cardFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
  },
});
