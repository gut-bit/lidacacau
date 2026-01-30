import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { WorkOrder, Job } from '@/types';
import { serviceFactory } from '@/services/ServiceFactory';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, getStatusLabel, getStatusColor } from '@/utils/format';

export default function WorkerActiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActiveWorkOrder = useCallback(async () => {
    if (!user) return;
    try {
      const workOrderService = serviceFactory.getWorkOrderService();
      const result = await workOrderService.getWorkOrdersByWorker(user.id);

      if (result.success && result.data) {
        // Find active work order
        const activeWO = result.data.find(wo =>
          ['assigned', 'checked_in', 'checked_out'].includes(wo.status)
        );

        setWorkOrder(activeWO || null);
        setJob(activeWO?.job || null);
      } else {
        setWorkOrder(null);
        setJob(null);
      }
    } catch (error) {
      console.error('Error loading active work order:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadActiveWorkOrder();
    }, [loadActiveWorkOrder])
  );

  const serviceType = job ? getServiceTypeById(job.serviceTypeId) : null;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="coffee" size={64} color={colors.textSecondary} />
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        Nenhum serviço ativo
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyText, { color: colors.textSecondary }]}>
        Quando um produtor aceitar sua proposta, o serviço aparecerá aqui
      </ThemedText>
    </View>
  );

  const renderActiveWorkOrder = () => (
    <View style={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather
              name={serviceType?.icon as any || 'briefcase'}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="h3">{serviceType?.name || 'Serviço'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {job && formatQuantityWithUnit(job.quantity, serviceType?.unit || '')}
            </ThemedText>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(workOrder?.status || 'assigned', colors) + '20' },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: getStatusColor(workOrder?.status || 'assigned', colors),
                fontWeight: '600',
              }}
            >
              {getStatusLabel(workOrder?.status || 'assigned')}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {job && (
            <>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={16} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.textSecondary, flex: 1 }}>
                  {job.locationText}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <Feather name="dollar-sign" size={16} color={colors.accent} />
                <ThemedText type="h4" style={{ color: colors.accent }}>
                  {formatCurrency(workOrder?.finalPrice || job.offer)}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate('ActiveWorkOrder', { workOrderId: workOrder!.id })}
        >
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            Ver Detalhes
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.timelineCard, { backgroundColor: colors.card }, Shadows.card]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Progresso
        </ThemedText>
        <View style={styles.timeline}>
          <TimelineItem
            icon="check-circle"
            label="Atribuído"
            isCompleted={true}
            isActive={workOrder?.status === 'assigned'}
            colors={colors}
          />
          <TimelineItem
            icon="log-in"
            label="Check-in"
            isCompleted={workOrder?.status !== 'assigned'}
            isActive={workOrder?.status === 'checked_in'}
            colors={colors}
          />
          <TimelineItem
            icon="log-out"
            label="Check-out"
            isCompleted={workOrder?.status === 'checked_out' || workOrder?.status === 'completed'}
            isActive={workOrder?.status === 'checked_out'}
            colors={colors}
          />
          <TimelineItem
            icon="award"
            label="Concluído"
            isCompleted={workOrder?.status === 'completed'}
            isActive={workOrder?.status === 'completed'}
            colors={colors}
            isLast
          />
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Serviço Ativo</ThemedText>
      </View>

      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing['2xl'] },
          !workOrder && styles.emptyScroll,
        ]}
      >
        {loading ? null : workOrder && job ? renderActiveWorkOrder() : renderEmptyState()}
      </ScreenScrollView>
    </ThemedView>
  );
}

interface TimelineItemProps {
  icon: string;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
  colors: any;
  isLast?: boolean;
}

function TimelineItem({ icon, label, isCompleted, isActive, colors, isLast }: TimelineItemProps) {
  const circleColor = isCompleted ? colors.success : isActive ? colors.primary : colors.border;
  const textColor = isCompleted || isActive ? colors.text : colors.textSecondary;

  return (
    <View style={timelineStyles.item}>
      <View style={timelineStyles.iconColumn}>
        <View
          style={[
            timelineStyles.circle,
            { backgroundColor: circleColor },
          ]}
        >
          <Feather
            name={isCompleted ? 'check' : (icon as any)}
            size={14}
            color="#FFFFFF"
          />
        </View>
        {!isLast && (
          <View
            style={[
              timelineStyles.line,
              { backgroundColor: isCompleted ? colors.success : colors.border },
            ]}
          />
        )}
      </View>
      <ThemedText type="body" style={{ color: textColor, fontWeight: isActive ? '600' : '400' }}>
        {label}
      </ThemedText>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconColumn: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 2,
    height: 24,
    marginVertical: Spacing.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyScroll: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
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
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  detailsContainer: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  timelineCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  timeline: {
    gap: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
