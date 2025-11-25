import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { WorkOrder, Job } from '@/types';
import { getWorkOrdersByWorker, getJobById, getUserById, getReviewsByWorkOrder } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatDate } from '@/utils/format';

interface HistoryItem {
  workOrder: WorkOrder;
  job: Job;
  producerName: string;
  hasReview: boolean;
}

export default function WorkerHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const workOrders = await getWorkOrdersByWorker(user.id);
      const completedWOs = workOrders.filter((wo) => wo.status === 'completed');
      const historyItems: HistoryItem[] = [];
      for (const wo of completedWOs) {
        const job = await getJobById(wo.jobId);
        const producer = await getUserById(wo.producerId);
        const reviews = await getReviewsByWorkOrder(wo.id);
        const workerReview = reviews.find((r) => r.reviewerId === user.id);
        if (job && producer) {
          historyItems.push({
            workOrder: wo,
            job,
            producerName: producer.name,
            hasReview: !!workerReview,
          });
        }
      }
      setItems(historyItems.sort((a, b) => 
        new Date(b.workOrder.createdAt).getTime() - new Date(a.workOrder.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const serviceType = getServiceTypeById(item.job.serviceTypeId);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="h4">{serviceType?.name || 'Serviço'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {item.producerName}
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: colors.accent, fontWeight: '600' }}>
            {formatCurrency(item.workOrder.finalPrice)}
          </ThemedText>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {item.job.locationText}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {formatDate(item.workOrder.createdAt)}
            </ThemedText>
          </View>
        </View>

        {!item.hasReview && (
          <Pressable
            style={({ pressed }) => [
              styles.reviewButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() =>
              navigation.navigate('Review', {
                workOrderId: item.workOrder.id,
                revieweeId: item.workOrder.producerId,
                revieweeName: item.producerName,
              })
            }
          >
            <Feather name="star" size={16} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Avaliar Produtor
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={64} color={colors.textSecondary} />
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        Nenhum serviço concluído
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyText, { color: colors.textSecondary }]}>
        Seus serviços concluídos aparecerão aqui
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Histórico</ThemedText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.workOrder.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing['2xl'] },
          items.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  emptyList: {
    flex: 1,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
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
