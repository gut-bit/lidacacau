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
import { getJobsByProducer, getBidsByJob } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, getStatusColor, getRelativeTime, getLevelLabel } from '@/utils/format';
import { SAMPLE_ACTIVITY, ActivityItem, getActivityItems, getMapActivities } from '@/data/sampleData';

export default function ProducerHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [mapActivities, setMapActivities] = useState<MapActivity[]>([]);
  const [searchRadius, setSearchRadius] = useState(user?.searchRadius || 50);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const userJobs = await getJobsByProducer(user.id);
      const activeJobs = userJobs.filter((j) => j.status !== 'closed');
      setJobs(activeJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      const counts: Record<string, number> = {};
      for (const job of activeJobs) {
        const bids = await getBidsByJob(job.id);
        counts[job.id] = bids.filter((b) => b.status === 'pending').length;
      }
      setBidCounts(counts);
      setActivityFeed(getActivityItems());
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'job_posted': return colors.primary;
      case 'job_started': return colors.accent;
      case 'job_completed': return colors.success;
      case 'review_received': return '#FFB800';
      default: return colors.textSecondary;
    }
  };

  const getStatusBadgeInfo = (status?: string) => {
    switch (status) {
      case 'open': return { text: 'Aberto', color: colors.primary };
      case 'in_progress': return { text: 'Em andamento', color: colors.accent };
      case 'closed': return { text: 'Concluido', color: colors.success };
      default: return null;
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    const statusBadge = getStatusBadgeInfo(item.status);
    const levelColor = item.level ? LevelColors[`N${item.level}` as keyof typeof LevelColors] : null;

    return (
      <View style={[styles.activityCard, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.activityHeader}>
          <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(item.type) + '20' }]}>
            <Feather
              name={item.serviceIcon as any}
              size={24}
              color={getActivityColor(item.type)}
            />
          </View>
          <View style={styles.activityInfo}>
            <View style={styles.activityTitleRow}>
              <ThemedText type="h4" style={{ flex: 1 }}>{item.serviceType}</ThemedText>
              {statusBadge ? (
                <View style={[styles.statusPill, { backgroundColor: statusBadge.color + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
                  <ThemedText type="small" style={{ color: statusBadge.color, fontWeight: '600' }}>
                    {statusBadge.text}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              {item.description}
            </ThemedText>
          </View>
        </View>

        <View style={styles.activityDetails}>
          <View style={styles.activityRow}>
            <Feather name="user" size={16} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {item.producerName}
            </ThemedText>
          </View>
          {item.workerName ? (
            <View style={styles.activityRow}>
              <Feather name="tool" size={16} color={levelColor || colors.textSecondary} />
              <ThemedText type="small" style={{ color: levelColor || colors.textSecondary, fontWeight: '600' }}>
                {item.workerName}
              </ThemedText>
              {item.level && levelColor ? (
                <View style={[styles.levelPill, { backgroundColor: levelColor }]}>
                  <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 10 }}>
                    {getLevelLabel(item.level)}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.activityRow}>
            <Feather name="map-pin" size={16} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {item.location}
            </ThemedText>
          </View>
        </View>

        <View style={styles.activityFooter}>
          <View style={styles.priceTag}>
            <Feather name="dollar-sign" size={18} color={colors.accent} />
            <ThemedText type="h4" style={{ color: colors.accent }}>
              {formatCurrency(item.price)}
            </ThemedText>
          </View>
          {item.rating ? (
            <View style={styles.ratingTag}>
              <Feather name="star" size={16} color="#FFB800" />
              <ThemedText type="body" style={{ color: '#FFB800', fontWeight: '600' }}>
                {item.rating.toFixed(1)}
              </ThemedText>
            </View>
          ) : null}
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {getRelativeTime(item.timestamp)}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderMyJobItem = ({ item }: { item: Job }) => {
    const serviceType = getServiceTypeById(item.serviceTypeId);
    const bidCount = bidCounts[item.id] || 0;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.myJobCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
          Shadows.card,
        ]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <View style={[styles.myJobIcon, { backgroundColor: colors.primary + '20' }]}>
          <Feather
            name={serviceType?.icon as any || 'briefcase'}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.myJobInfo}>
          <ThemedText type="body" style={{ fontWeight: '600' }} numberOfLines={1}>
            {serviceType?.name || 'Servico'}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {formatCurrency(item.offer)}
          </ThemedText>
        </View>
        {item.status === 'open' && bidCount > 0 ? (
          <View style={[styles.bidCountBadge, { backgroundColor: colors.error }]}>
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {bidCount}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status, colors) }]} />
        )}
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.feedContent}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerContent}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={{ flex: 1 }}>
            <ThemedText type="h3">Empleitapp</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Ola, {user?.name?.split(' ')[0]}!
            </ThemedText>
          </View>
          <RoleSwitcher compact />
        </View>
      </View>

      <View style={styles.mapSection}>
        <MapHub
          activities={mapActivities}
          searchRadius={searchRadius}
          onRadiusChange={handleRadiusChange}
          onActivityPress={handleMapActivityPress}
          height={220}
        />
      </View>

      {jobs.length > 0 ? (
        <View style={styles.myJobsSection}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={20} color={colors.primary} />
            <ThemedText type="h4" style={{ color: colors.primary }}>
              Minhas Demandas
            </ThemedText>
          </View>
          <FlatList
            data={jobs.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={renderMyJobItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.myJobsList}
          />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Feather name="activity" size={20} color={colors.secondary} />
        <ThemedText type="h4" style={{ color: colors.secondary }}>
          Atividade na Regiao
        </ThemedText>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
        <Feather name="map" size={60} color={colors.primary} />
      </View>
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.text }]}>
        Bem-vindo ao Empleitapp
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyText, { color: colors.textSecondary }]}>
        Aqui voce vai ver o que esta acontecendo na regiao. Crie sua primeira demanda para comecar!
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={activityFeed}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing['2xl'] },
        ]}
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
  feedContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
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
  mapSection: {
    marginBottom: Spacing.lg,
  },
  myJobsSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  myJobsList: {
    gap: Spacing.md,
  },
  myJobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: 180,
    gap: Spacing.sm,
  },
  myJobIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myJobInfo: {
    flex: 1,
  },
  bidCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listContent: {
    paddingTop: 0,
  },
  activityCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  activityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
