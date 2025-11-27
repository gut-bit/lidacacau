import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Dimensions, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { Job, MapActivity, UserRole } from '@/types';
import { getOpenJobs, getJobsByProducer, getBidsByJob, getBidsByWorker } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, getRelativeTime, getLevelLabel } from '@/utils/format';
import { ActivityItem, getActivityItems, getMapActivities } from '@/data/sampleData';
import { ScreenScrollView } from '@/components/ScreenScrollView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableJobCardProps {
  job: Job;
  onSwipe: (id: string) => void;
  onPress: () => void;
  colors: typeof Colors.dark;
  isWorker: boolean;
  hasBid?: boolean;
}

function SwipeableJobCard({ job, onSwipe, onPress, colors, isWorker, hasBid }: SwipeableJobCardProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const serviceType = getServiceTypeById(job.serviceTypeId);

  const handleSwipeComplete = () => {
    onSwipe(job.id);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { duration: 200 },
          () => {
            opacity.value = 0;
            runOnJS(handleSwipeComplete)();
          }
        );
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, leftIndicatorStyle]}>
        <View style={[styles.indicatorCircle, { backgroundColor: colors.success }]}>
          <Feather name="check" size={24} color="#FFFFFF" />
        </View>
        <ThemedText type="small" style={{ color: colors.success, fontWeight: '700' }}>
          SALVAR
        </ThemedText>
      </Animated.View>
      
      <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, rightIndicatorStyle]}>
        <View style={[styles.indicatorCircle, { backgroundColor: colors.error }]}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </View>
        <ThemedText type="small" style={{ color: colors.error, fontWeight: '700' }}>
          PULAR
        </ThemedText>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.jobCard, { backgroundColor: colors.card }, Shadows.card, cardStyle]}>
          <Pressable onPress={onPress} style={styles.cardContent}>
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
                  {formatQuantityWithUnit(job.quantity, serviceType?.unit || '')}
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
                {formatCurrency(job.offer)}
              </ThemedText>
            </View>

            <View style={styles.jobDetails}>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={20} color={colors.textSecondary} />
                <ThemedText type="body" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                  {job.locationText}
                </ThemedText>
              </View>
              {job.notes ? (
                <View style={styles.detailRow}>
                  <Feather name="file-text" size={20} color={colors.textSecondary} />
                  <ThemedText type="body" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={2}>
                    {job.notes}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.jobFooter}>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {getRelativeTime(job.createdAt)}
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

            <View style={styles.swipeHint}>
              <Feather name="arrow-left" size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Deslize para descartar
              </ThemedText>
              <Feather name="arrow-right" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function UnifiedHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, activeRole, switchRole, canSwitchToRole, enableRole } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [myBidJobIds, setMyBidJobIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());

  const isWorker = activeRole === 'worker';
  const isProducer = activeRole === 'producer';

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      if (isWorker) {
        const openJobs = await getOpenJobs(user.level || 1);
        const myBids = await getBidsByWorker(user.id);
        const bidJobIds = new Set(myBids.filter((b) => b.status === 'pending').map((b) => b.jobId));
        setMyBidJobIds(bidJobIds);
        setJobs(openJobs.filter(j => !dismissedJobs.has(j.id)).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      
      const userJobs = await getJobsByProducer(user.id);
      const activeJobs = userJobs.filter((j) => j.status !== 'closed');
      setMyJobs(activeJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      const counts: Record<string, number> = {};
      for (const job of activeJobs) {
        const bids = await getBidsByJob(job.id);
        counts[job.id] = bids.filter((b) => b.status === 'pending').length;
      }
      setBidCounts(counts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isWorker, dismissedJobs]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setDismissedJobs(new Set());
    await loadData();
    setRefreshing(false);
  };

  const handleDismissJob = (jobId: string) => {
    setDismissedJobs(prev => new Set([...prev, jobId]));
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleRoleSwitch = async (role: UserRole) => {
    if (role === activeRole) return;
    try {
      if (canSwitchToRole(role)) {
        await switchRole(role);
      } else {
        await enableRole(role);
      }
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  const renderRoleSwitcher = () => (
    <View style={styles.roleSwitcher}>
      <Pressable
        style={[
          styles.roleTab,
          isProducer && styles.roleTabActive,
          isProducer && { backgroundColor: colors.primary },
        ]}
        onPress={() => handleRoleSwitch('producer')}
      >
        <Feather 
          name="briefcase" 
          size={18} 
          color={isProducer ? '#FFFFFF' : colors.textSecondary} 
        />
        <ThemedText 
          type="body" 
          style={{ 
            color: isProducer ? '#FFFFFF' : colors.textSecondary,
            fontWeight: isProducer ? '700' : '500',
          }}
        >
          Produtor
        </ThemedText>
      </Pressable>
      <Pressable
        style={[
          styles.roleTab,
          isWorker && styles.roleTabActive,
          isWorker && { backgroundColor: colors.secondary },
        ]}
        onPress={() => handleRoleSwitch('worker')}
      >
        <Feather 
          name="tool" 
          size={18} 
          color={isWorker ? '#FFFFFF' : colors.textSecondary} 
        />
        <ThemedText 
          type="body" 
          style={{ 
            color: isWorker ? '#FFFFFF' : colors.textSecondary,
            fontWeight: isWorker ? '700' : '500',
          }}
        >
          Trabalhador
        </ThemedText>
        {user?.level ? (
          <View style={[styles.levelPill, { backgroundColor: isWorker ? 'rgba(255,255,255,0.3)' : colors.secondary + '30' }]}>
            <ThemedText type="small" style={{ color: isWorker ? '#FFFFFF' : colors.secondary, fontWeight: '700', fontSize: 10 }}>
              {getLevelLabel(user.level)}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {user?.name?.charAt(0) || 'U'}
            </ThemedText>
          </View>
        )}
        {user?.verification?.status === 'approved' ? (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={styles.profileInfo}>
        <ThemedText type="h3">Ola, {user?.name?.split(' ')[0]}!</ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary }}>
          {isProducer ? 'Pronto para contratar?' : 'Procurando trabalho?'}
        </ThemedText>
      </View>
      <Pressable 
        style={[styles.notificationButton, { backgroundColor: colors.card }]}
        onPress={() => {}}
      >
        <Feather name="bell" size={22} color={colors.text} />
        <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
      </Pressable>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
        <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
          <Feather name="briefcase" size={20} color="#FFFFFF" />
        </View>
        <ThemedText type="h3" style={{ color: colors.primary }}>
          {myJobs.length}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          {isProducer ? 'Minhas Demandas' : 'Candidaturas'}
        </ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.accent + '15' }]}>
        <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
          <Feather name="star" size={20} color="#FFFFFF" />
        </View>
        <ThemedText type="h3" style={{ color: colors.accent }}>
          {user?.averageRating?.toFixed(1) || '5.0'}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          Avaliacao
        </ThemedText>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
        <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
          <Feather name="check-circle" size={20} color="#FFFFFF" />
        </View>
        <ThemedText type="h3" style={{ color: colors.success }}>
          {user?.totalReviews || 0}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          Concluidos
        </ThemedText>
      </View>
    </View>
  );

  const renderMyJobsSection = () => {
    if (myJobs.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="folder" size={20} color={colors.primary} />
            <ThemedText type="h4" style={{ color: colors.primary }}>
              {isProducer ? 'Minhas Demandas' : 'Minhas Propostas'}
            </ThemedText>
          </View>
          <Pressable onPress={() => navigation.navigate('ServiceHistory')}>
            <ThemedText type="small" style={{ color: colors.link }}>
              Ver todas
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.myJobsList}>
          {myJobs.slice(0, 3).map((job) => {
            const serviceType = getServiceTypeById(job.serviceTypeId);
            const bidCount = bidCounts[job.id] || 0;
            
            return (
              <Pressable
                key={job.id}
                style={[styles.myJobCard, { backgroundColor: colors.card }, Shadows.card]}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
              >
                <View style={[styles.myJobIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name={serviceType?.icon as any || 'briefcase'} size={22} color={colors.primary} />
                </View>
                <View style={styles.myJobInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{serviceType?.name}</ThemedText>
                  <ThemedText type="small" style={{ color: colors.accent }}>{formatCurrency(job.offer)}</ThemedText>
                </View>
                {bidCount > 0 ? (
                  <View style={[styles.bidCountBadge, { backgroundColor: colors.error }]}>
                    <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>{bidCount}</ThemedText>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAvailableJobs = () => {
    if (!isWorker) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="zap" size={20} color={colors.accent} />
            <ThemedText type="h4" style={{ color: colors.accent }}>
              Trabalhos Disponiveis
            </ThemedText>
            {jobs.length > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>{jobs.length}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        
        {jobs.length > 0 ? (
          <GestureHandlerRootView style={styles.jobsContainer}>
            {jobs.slice(0, 5).map((job) => (
              <SwipeableJobCard
                key={job.id}
                job={job}
                onSwipe={handleDismissJob}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                colors={colors}
                isWorker={isWorker}
                hasBid={myBidJobIds.has(job.id)}
              />
            ))}
          </GestureHandlerRootView>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={48} color={colors.textSecondary} />
            <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
              Nenhum trabalho disponivel no momento.{'\n'}Puxe para atualizar!
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing['2xl'] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <ThemedText type="h2">Empleitapp</ThemedText>
          </View>
          {renderRoleSwitcher()}
        </View>

        {renderProfileHeader()}
        {renderQuickStats()}
        {renderMyJobsSection()}
        {renderAvailableJobs()}
      </ScreenScrollView>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  roleTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  myJobsList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  myJobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  myJobIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myJobInfo: {
    flex: 1,
  },
  bidCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  jobsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    zIndex: -1,
  },
  leftIndicator: {
    left: 0,
  },
  rightIndicator: {
    right: 0,
  },
  indicatorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  cardContent: {
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
    alignItems: 'flex-start',
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
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.sm,
  },
  emptyState: {
    marginHorizontal: Spacing.xl,
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});
