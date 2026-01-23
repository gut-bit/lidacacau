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
import { Job } from '@/types';
import { getJobsByProducer, getWorkOrderByJobId, getUserById } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, formatDate, getStatusLabel } from '@/utils/format';

interface HistoryItem extends Job {
  workerName?: string;
}

export default function ProducerHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [jobs, setJobs] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const userJobs = await getJobsByProducer(user.id);
      const closedJobs = userJobs.filter((j) => j.status === 'closed');
      const jobsWithWorker: HistoryItem[] = [];
      for (const job of closedJobs) {
        const workOrder = await getWorkOrderByJobId(job.id);
        let workerName: string | undefined;
        if (workOrder) {
          const worker = await getUserById(workOrder.workerId);
          workerName = worker?.name;
        }
        jobsWithWorker.push({ ...job, workerName });
      }
      setJobs(jobsWithWorker.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const renderJobItem = useCallback(({ item }: { item: HistoryItem }) => {
    const serviceType = getServiceTypeById(item.serviceTypeId);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.jobCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
          Shadows.card,
        ]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={styles.jobHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
          </View>
          <View style={styles.jobInfo}>
            <ThemedText type="h4">{serviceType?.name || 'Serviço'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {formatQuantityWithUnit(item.quantity, serviceType?.unit || '')}
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: colors.accent, fontWeight: '600' }}>
            {formatCurrency(item.offer)}
          </ThemedText>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {item.locationText}
            </ThemedText>
          </View>
          {item.workerName && (
            <View style={styles.detailRow}>
              <Feather name="user" size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {item.workerName}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.jobFooter}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {formatDate(item.createdAt)}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <ThemedText type="small" style={{ color: colors.success, fontWeight: '600' }}>
              Concluído
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }, [colors, navigation]);

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
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing['2xl'] },
          jobs.length === 0 && styles.emptyList,
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
  jobCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  jobHeader: {
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
  jobInfo: {
    flex: 1,
  },
  jobDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
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
