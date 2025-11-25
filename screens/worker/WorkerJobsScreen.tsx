import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job } from '@/types';
import { getOpenJobs, getUserById, getBidsByWorker } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, getRelativeTime, getLevelLabel } from '@/utils/format';

export default function WorkerJobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myBidJobIds, setMyBidJobIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const openJobs = await getOpenJobs(user.level || 1);
      const myBids = await getBidsByWorker(user.id);
      const bidJobIds = new Set(myBids.filter((b) => b.status === 'pending').map((b) => b.jobId));
      setMyBidJobIds(bidJobIds);
      setJobs(openJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  const renderJobItem = ({ item }: { item: Job }) => {
    const serviceType = getServiceTypeById(item.serviceTypeId);
    const hasBid = myBidJobIds.has(item.id);

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
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather
              name={serviceType?.icon as any || 'briefcase'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.jobInfo}>
            <ThemedText type="h4">{serviceType?.name || 'Serviço'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {formatQuantityWithUnit(item.quantity, serviceType?.unit || '')}
            </ThemedText>
          </View>
          {serviceType && serviceType.minLevel > 1 && (
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: LevelColors[`N${serviceType.minLevel}` as keyof typeof LevelColors] },
              ]}
            >
              <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {getLevelLabel(serviceType.minLevel)}+
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {item.locationText}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="dollar-sign" size={14} color={colors.accent} />
            <ThemedText type="body" style={{ color: colors.accent, fontWeight: '600' }}>
              {formatCurrency(item.offer)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {getRelativeTime(item.createdAt)}
          </ThemedText>
          {hasBid && (
            <View style={[styles.bidBadge, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check" size={12} color={colors.success} />
              <ThemedText type="caption" style={{ color: colors.success, fontWeight: '600' }}>
                Proposta enviada
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={64} color={colors.textSecondary} />
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        Nenhum trabalho disponível
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyText, { color: colors.textSecondary }]}>
        Novos trabalhos aparecerão aqui quando produtores publicarem demandas
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerContent}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View>
            <ThemedText type="h3">CacauServ</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Olá, {user?.name?.split(' ')[0]}
            </ThemedText>
          </View>
        </View>
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: LevelColors[`N${user?.level || 1}` as keyof typeof LevelColors] },
          ]}
        >
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {getLevelLabel(user?.level || 1)}
          </ThemedText>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
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
  bidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
