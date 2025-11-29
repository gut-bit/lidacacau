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
import { MapHub } from '@/components/MapHub';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job, MapActivity } from '@/types';
import { getOpenJobs, getBidsByWorker } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, getRelativeTime, getLevelLabel } from '@/utils/format';
import { ActivityItem, getActivityItems, getInProgressJobs, getMapActivities } from '@/data/sampleData';

export default function WorkerJobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myBidJobIds, setMyBidJobIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [inProgressJobs, setInProgressJobs] = useState<ActivityItem[]>([]);
  const [mapActivities, setMapActivities] = useState<MapActivity[]>([]);
  const [searchRadius, setSearchRadius] = useState(user?.searchRadius || 50);

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
      setMapActivities(getMapActivities(searchRadius));
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, searchRadius]);

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

  const handleRadiusChange = async (radius: number) => {
    setSearchRadius(radius);
    setMapActivities(getMapActivities(radius));
    if (user) {
      try {
        await updateProfile({ searchRadius: radius });
      } catch (error) {
        console.error('Error updating search radius:', error);
      }
    }
  };

  const handleMapActivityPress = (activity: MapActivity) => {
    if (activity.jobId) {
      navigation.navigate('JobDetail', { jobId: activity.jobId });
    }
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
            <ThemedText type="h3">LidaCacau</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Ola, {user?.name?.split(' ')[0]}!
            </ThemedText>
          </View>
          <RoleSwitcher compact />
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: LevelColors[`N${user?.level || 1}` as keyof typeof LevelColors], marginLeft: 8 },
            ]}
          >
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              {getLevelLabel(user?.level || 1)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.mapSection}>
        <MapHub
          activities={mapActivities}
          searchRadius={searchRadius}
          onRadiusChange={handleRadiusChange}
          onActivityPress={handleMapActivityPress}
          height={200}
        />
      </View>

      {inProgressJobs.length > 0 ? (
        <View style={styles.inProgressSection}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 0 }]}>
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
        <View style={[styles.sectionHeader, { paddingHorizontal: 0 }]}>
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
    flex: 1,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  mapSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
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
    paddingHorizontal: Spacing.xl,
  },
  recentList: {
    gap: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    minWidth: 200,
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
  listContent: {
    paddingTop: 0,
    gap: Spacing.lg,
  },
  jobCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    backgroundColor: '#FFB80015',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  jobDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  bidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    gap: Spacing.xs,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing['5xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
