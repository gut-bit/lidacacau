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
import { SAMPLE_ACTIVITY, ActivityItem, getActivityItems, getInProgressJobs } from '@/data/sampleData';

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
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [inProgressJobs, setInProgressJobs] = useState<ActivityItem[]>([]);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const openJobs = await getOpenJobs(user.level || 1);
      const myBids = await getBidsByWorker(user.id);
      const bidJobIds = new Set(myBids.filter((b) => b.status === 'pending').map((b) => b.jobId));
      setMyBidJobIds(bidJobIds);
      setJobs(openJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setActivityFeed(getActivityItems());
      setInProgressJobs(getInProgressJobs());
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

  const renderInProgressItem = ({ item }: { item: ActivityItem }) => {
    const levelColor = item.level ? LevelColors[`N${item.level}` as keyof typeof LevelColors] : colors.primary;
    
    return (
      <View style={[styles.inProgressCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
        <View style={styles.inProgressHeader}>
          <View style={[styles.liveIndicator, { backgroundColor: colors.accent }]}>
            <View style={styles.liveDot} />
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              AO VIVO
            </ThemedText>
          </View>
        </View>
        <View style={styles.inProgressContent}>
          <View style={[styles.workerAvatar, { backgroundColor: levelColor }]}>
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {item.workerName?.charAt(0) || 'T'}
            </ThemedText>
          </View>
          <View style={styles.inProgressInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {item.workerName}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {item.serviceType} - {item.location}
            </ThemedText>
          </View>
          <View style={[styles.levelBadgeSmall, { backgroundColor: levelColor }]}>
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 10 }}>
              {getLevelLabel(item.level || 1)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
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
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={styles.jobInfo}>
            <ThemedText type="h3">{serviceType?.name || 'Servico'}</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              {formatQuantityWithUnit(item.quantity, serviceType?.unit || '')}
            </ThemedText>
          </View>
          {serviceType && serviceType.minLevel > 1 ? (
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: LevelColors[`N${serviceType.minLevel}` as keyof typeof LevelColors] },
              ]}
            >
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {getLevelLabel(serviceType.minLevel)}+
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.priceBox}>
          <Feather name="dollar-sign" size={24} color={colors.accent} />
          <ThemedText type="h2" style={{ color: colors.accent }}>
            {formatCurrency(item.offer)}
          </ThemedText>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={20} color={colors.textSecondary} />
            <ThemedText type="body" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {item.locationText}
            </ThemedText>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {getRelativeTime(item.createdAt)}
          </ThemedText>
          {hasBid ? (
            <View style={[styles.bidBadge, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <ThemedText type="body" style={{ color: colors.success, fontWeight: '600' }}>
                Proposta enviada
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.tapHint}>
          <ThemedText type="small" style={{ color: colors.primary }}>
            {hasBid ? 'Toque para acompanhar' : 'Toque para enviar proposta'}
          </ThemedText>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </View>
      </Pressable>
    );
  };

  const renderRecentActivity = ({ item }: { item: ActivityItem }) => {
    const levelColor = item.level ? LevelColors[`N${item.level}` as keyof typeof LevelColors] : colors.textSecondary;
    
    if (item.type !== 'job_completed' && item.type !== 'review_received') return null;
    
    return (
      <View style={[styles.activityItem, { backgroundColor: colors.card }]}>
        <View style={[styles.activityIcon, { backgroundColor: item.type === 'review_received' ? '#FFB80020' : colors.success + '20' }]}>
          <Feather 
            name={item.type === 'review_received' ? 'star' : 'check-circle'} 
            size={18} 
            color={item.type === 'review_received' ? '#FFB800' : colors.success} 
          />
        </View>
        <View style={styles.activityContent}>
          <ThemedText type="small" style={{ fontWeight: '600' }}>
            {item.workerName}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {item.type === 'review_received' ? `Recebeu ${item.rating} estrelas` : `Completou ${item.serviceType.toLowerCase()}`}
          </ThemedText>
        </View>
        {item.level ? (
          <View style={[styles.levelBadgeSmall, { backgroundColor: levelColor }]}>
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 10 }}>
              {getLevelLabel(item.level)}
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerContent}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={{ flex: 1 }}>
            <ThemedText type="h3">Agro work</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Ola, {user?.name?.split(' ')[0]}!
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

      {inProgressJobs.length > 0 ? (
        <View style={styles.inProgressSection}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color={colors.accent} />
            <ThemedText type="h4" style={{ color: colors.accent }}>
              Trabalhando Agora
            </ThemedText>
          </View>
          <FlatList
            data={inProgressJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderInProgressItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inProgressList}
          />
        </View>
      ) : null}

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Feather name="award" size={18} color={colors.success} />
          <ThemedText type="h4" style={{ color: colors.success }}>
            Conquistas Recentes
          </ThemedText>
        </View>
        <FlatList
          data={activityFeed.filter(a => a.type === 'job_completed' || a.type === 'review_received')}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentActivity}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Feather name="briefcase" size={18} color={colors.primary} />
        <ThemedText type="h4" style={{ color: colors.primary }}>
          Trabalhos Disponiveis
        </ThemedText>
        {jobs.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {jobs.length}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent + '15' }]}>
        <Feather name="clock" size={60} color={colors.accent} />
      </View>
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
        Aguarde novas vagas
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyText, { color: colors.textSecondary }]}>
        Quando produtores postarem trabalho, vai aparecer aqui. Enquanto isso, veja o que outros trabalhadores estao fazendo!
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing['2xl'] },
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
  inProgressSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  inProgressList: {
    gap: Spacing.md,
  },
  inProgressCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    minWidth: 220,
  },
  inProgressHeader: {
    marginBottom: Spacing.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  inProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  workerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inProgressInfo: {
    flex: 1,
  },
  recentSection: {
    marginBottom: Spacing.lg,
  },
  recentList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    minWidth: 180,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  listContent: {
    paddingTop: Spacing.md,
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
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
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  levelBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.xs,
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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyContainer: {
    paddingVertical: Spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
});
