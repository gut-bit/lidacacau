import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Dimensions, Platform, ScrollView, ImageBackground } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Decorative cacao-themed assets
const cacaoCanopyHeader = require('@/assets/decorative/cacao_tree_canopy_header_decoration.png');
const grassFooter = require('@/assets/decorative/grass_and_dead_leaves_footer.png');
const cornerBranch = require('@/assets/decorative/corner_cacao_branch_decoration.png');
const branchDivider = require('@/assets/decorative/horizontal_branch_divider_element.png');
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
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
import { Job, MapActivity, UserRole, ServiceOffer, CARD_COLORS, CardType, UserPreferences, URUARA_CENTER, User, LIDA_PHRASES } from '@/types';
import { getOpenJobs, getJobsByProducer, getBidsByJob, getBidsByWorker, getPublicServiceOffers, getServiceOffersByWorker, getUserPreferences, getRecentNewUsers } from '@/utils/api';
import { getServiceTypeById, SERVICE_TYPES } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, getRelativeTime, getLevelLabel } from '@/utils/format';
import { ActivityItem, getActivityItems, getMapActivities } from '@/data/sampleData';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { IntroVideoModal } from '@/components/IntroVideoModal';
import { ExpandableMapWidget } from '@/components/ExpandableMapWidget';

interface UserLocation {
  latitude: number;
  longitude: number;
}

const DEFAULT_LOCATION: UserLocation = {
  latitude: URUARA_CENTER.latitude,
  longitude: URUARA_CENTER.longitude,
};

const DISMISSED_JOBS_KEY = '@lidacacau_dismissed_jobs';

const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDistanceToCard = (
  userLocation: UserLocation,
  cardLat?: number,
  cardLon?: number
): number | null => {
  if (cardLat === undefined || cardLon === undefined) {
    return null;
  }
  return calculateHaversineDistance(
    userLocation.latitude,
    userLocation.longitude,
    cardLat,
    cardLon
  );
};

const calculateRelevanceScore = (
  job: Job,
  preferences: UserPreferences | null,
  userLocation: UserLocation
): { score: number; distance: number | null } => {
  let score = 0;
  
  if (preferences?.preferredServiceTypes?.includes(job.serviceTypeId)) {
    score += 100;
  }
  
  const serviceType = getServiceTypeById(job.serviceTypeId);
  if (serviceType) {
    const category = serviceType.id.split('_')[0];
    const hasPreferredCategory = preferences?.preferredServiceTypes?.some(
      (id: string) => id.startsWith(category)
    );
    if (hasPreferredCategory) {
      score += 30;
    }
  }
  
  const createdAt = new Date(job.createdAt).getTime();
  const now = Date.now();
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);
  score += Math.max(0, 50 - hoursOld);
  
  score += Math.min(job.offer / 50, 30);
  
  const distance = getDistanceToCard(userLocation, job.latitude, job.longitude);
  
  if (distance !== null) {
    if (distance <= 10) {
      score += 80;
    } else if (distance <= 25) {
      score += 60;
    } else if (distance <= 50) {
      score += 40;
    } else if (distance <= 100) {
      score += 20;
    }
  }
  
  return { score, distance };
};

const calculateOfferRelevanceScore = (
  offer: ServiceOffer,
  preferences: UserPreferences | null,
  userLocation: UserLocation
): { score: number; distance: number | null } => {
  let score = 0;
  
  if (preferences?.preferredServiceTypes) {
    const matchingServices = offer.serviceTypeIds.filter(
      (id: string) => preferences.preferredServiceTypes?.includes(id)
    );
    score += matchingServices.length * 50;
  }
  
  const createdAt = new Date(offer.createdAt).getTime();
  const now = Date.now();
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);
  score += Math.max(0, 50 - hoursOld);
  
  const price = offer.pricePerDay || offer.pricePerHour || 0;
  score += Math.min(price / 20, 30);
  
  if (offer.extras?.providesFood) score += 10;
  if (offer.extras?.providesAccommodation) score += 10;
  if (offer.extras?.providesTransport) score += 10;
  
  const distance = getDistanceToCard(userLocation, offer.latitude, offer.longitude);
  
  if (distance !== null) {
    if (distance <= 10) {
      score += 80;
    } else if (distance <= 25) {
      score += 60;
    } else if (distance <= 50) {
      score += 40;
    } else if (distance <= 100) {
      score += 20;
    }
  }
  
  return { score, distance };
};

type FeedFilter = 'all' | 'demands' | 'offers';
type RadiusFilter = 10 | 25 | 50 | 100 | 'all';

interface JobWithDistance extends Job {
  calculatedDistance?: number | null;
}

interface OfferWithDistance extends ServiceOffer {
  calculatedDistance?: number | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableJobCardProps {
  job: JobWithDistance;
  onSwipe: (id: string) => void;
  onPress: () => void;
  colors: typeof Colors.dark;
  isWorker: boolean;
  hasBid?: boolean;
}

const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

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
                {job.calculatedDistance !== null && job.calculatedDistance !== undefined ? (
                  <View style={[styles.distanceBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Feather name="navigation" size={12} color={colors.primary} />
                    <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                      {formatDistance(job.calculatedDistance)}
                    </ThemedText>
                  </View>
                ) : null}
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

  const [allJobs, setAllJobs] = useState<JobWithDistance[]>([]);
  const [allOffers, setAllOffers] = useState<OfferWithDistance[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myOffers, setMyOffers] = useState<ServiceOffer[]>([]);
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const [myBidJobIds, setMyBidJobIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>('all');
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [locationLoading, setLocationLoading] = useState(true);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  const isWorker = activeRole === 'worker';
  const isProducer = activeRole === 'producer';

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        if (Platform.OS === 'web') {
          setUserLocation(DEFAULT_LOCATION);
          setUsingDefaultLocation(true);
          setLocationLoading(false);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied, using default location');
          setUserLocation(DEFAULT_LOCATION);
          setUsingDefaultLocation(true);
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUsingDefaultLocation(false);
      } catch (error) {
        console.log('Error fetching location, using default:', error);
        setUserLocation(DEFAULT_LOCATION);
        setUsingDefaultLocation(true);
      } finally {
        setLocationLoading(false);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    const loadDismissedJobs = async () => {
      try {
        const stored = await AsyncStorage.getItem(DISMISSED_JOBS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDismissedJobs(new Set(parsed));
        }
      } catch (error) {
        console.log('Error loading dismissed jobs:', error);
      }
    };
    loadDismissedJobs();
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const preferences = await getUserPreferences(user.id);
      
      if (isWorker) {
        const openJobs = await getOpenJobs(user.level || 1);
        const myBids = await getBidsByWorker(user.id);
        const bidJobIds = new Set(myBids.filter((b) => b.status === 'pending').map((b) => b.jobId));
        setMyBidJobIds(bidJobIds);
        
        const jobsWithScores = openJobs
          .filter(j => !dismissedJobs.has(j.id))
          .map(job => {
            const { score, distance } = calculateRelevanceScore(job, preferences, userLocation);
            return {
              ...job,
              calculatedDistance: distance,
              score,
            };
          })
          .sort((a, b) => b.score - a.score)
          .map(({ score, ...job }) => job as JobWithDistance);
        
        setAllJobs(jobsWithScores);
        
        const workerOffers = await getServiceOffersByWorker(user.id);
        setMyOffers(workerOffers.filter(o => o.status === 'active'));
      }
      
      if (isProducer) {
        const publicOffers = await getPublicServiceOffers();
        
        const offersWithScores = publicOffers
          .filter(o => o.workerId !== user.id)
          .map(offer => {
            const { score, distance } = calculateOfferRelevanceScore(offer, preferences, userLocation);
            return {
              ...offer,
              calculatedDistance: distance,
              score,
            };
          })
          .sort((a, b) => b.score - a.score)
          .map(({ score, ...offer }) => offer as OfferWithDistance);
        
        setAllOffers(offersWithScores);
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
      
      const newUsers = await getRecentNewUsers(6);
      setRecentUsers(newUsers.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isWorker, isProducer, dismissedJobs, userLocation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const jobs = useMemo(() => {
    if (radiusFilter === 'all') return allJobs;
    return allJobs.filter(job => {
      if (job.calculatedDistance === null || job.calculatedDistance === undefined) {
        return true;
      }
      const numericRadius = typeof radiusFilter === 'number' ? radiusFilter : Number(radiusFilter);
      return job.calculatedDistance <= numericRadius;
    });
  }, [allJobs, radiusFilter]);

  const offers = useMemo(() => {
    if (radiusFilter === 'all') return allOffers;
    return allOffers.filter(offer => {
      if (offer.calculatedDistance === null || offer.calculatedDistance === undefined) {
        return true;
      }
      const numericRadius = typeof radiusFilter === 'number' ? radiusFilter : Number(radiusFilter);
      return offer.calculatedDistance <= numericRadius;
    });
  }, [allOffers, radiusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    setDismissedJobs(new Set());
    try {
      await AsyncStorage.removeItem(DISMISSED_JOBS_KEY);
    } catch (error) {
      console.log('Error clearing dismissed jobs:', error);
    }
    await loadData();
    setRefreshing(false);
  };

  const handleDismissJob = async (jobId: string) => {
    const newDismissed = new Set([...dismissedJobs, jobId]);
    setDismissedJobs(newDismissed);
    setAllJobs(prev => prev.filter(j => j.id !== jobId));
    try {
      await AsyncStorage.setItem(DISMISSED_JOBS_KEY, JSON.stringify([...newDismissed]));
    } catch (error) {
      console.log('Error saving dismissed jobs:', error);
    }
  };

  const handleActivateGPS = async () => {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationLoading(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setUsingDefaultLocation(false);
        setLocationLoading(false);
        await loadData();
      } else if (!canAskAgain) {
        try {
          await Linking.openSettings();
        } catch (error) {
          console.log('Could not open settings:', error);
        }
      }
    } catch (error) {
      console.log('Error activating GPS:', error);
    }
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
        <ThemedText type="h3">E ai, {user?.name?.split(' ')[0]}!</ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary }}>
          {isProducer ? 'Bora meter a mao na massa?' : 'Firme na lida?'}
        </ThemedText>
      </View>
      <Pressable 
        style={[styles.notificationButton, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Feather name="bell" size={22} color={colors.text} />
        <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
      </Pressable>
    </View>
  );

  const renderLocationBanner = () => {
    if (!usingDefaultLocation) return null;
    
    const isWeb = Platform.OS === 'web';
    
    return (
      <View style={[styles.locationBanner, { backgroundColor: colors.warning + '20' }]}>
        <View style={[styles.locationBannerIcon, { backgroundColor: colors.warning + '30' }]}>
          <Feather name="map-pin" size={18} color={colors.warning} />
        </View>
        <View style={styles.locationBannerContent}>
          <ThemedText 
            type="body" 
            style={[styles.locationBannerText, { color: colors.text }]}
          >
            {isWeb 
              ? 'Use o app Expo Go no celular para distancias reais' 
              : 'Usando localizacao de Uruara'}
          </ThemedText>
          {!isWeb ? (
            <Pressable
              style={[styles.locationBannerButton, { backgroundColor: colors.warning }]}
              onPress={handleActivateGPS}
            >
              <Feather name="navigation" size={14} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                Ativar GPS
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

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
          {Number(user?.averageRating || 5).toFixed(1)}
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

  const renderGenteDaLida = () => {
    if (recentUsers.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="users" size={20} color={colors.handshake} />
            <ThemedText type="h4" style={{ color: colors.handshake }}>
              Gente da Lida
            </ThemedText>
            <View style={[styles.countBadge, { backgroundColor: colors.handshake }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {recentUsers.length}
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('UserSearch')}>
            <ThemedText type="small" style={{ color: colors.link }}>
              Ver todos
            </ThemedText>
          </Pressable>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genteDaLidaScroll}
        >
          {recentUsers.map((person) => {
            const isNewUser = new Date(person.createdAt!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
            const roleLabel = person.role === 'worker' ? 'Trabalhador' : 'Produtor';
            const roleColor = person.role === 'worker' ? colors.handshake : colors.primary;
            
            return (
              <Pressable
                key={person.id}
                style={[styles.personCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('OtherUserProfile', { userId: person.id })}
              >
                <View style={styles.personAvatarContainer}>
                  {person.avatar ? (
                    <Image source={{ uri: person.avatar }} style={styles.personAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.personAvatarPlaceholder, { backgroundColor: roleColor }]}>
                      <ThemedText type="h4" style={{ color: '#FFFFFF' }}>
                        {person.name?.charAt(0) || '?'}
                      </ThemedText>
                    </View>
                  )}
                  {isNewUser ? (
                    <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
                      <ThemedText type="small" style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '700' }}>
                        NOVO
                      </ThemedText>
                    </View>
                  ) : null}
                  {person.verification?.status === 'approved' ? (
                    <View style={[styles.miniVerifiedBadge, { backgroundColor: colors.success }]}>
                      <Feather name="check" size={8} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
                <ThemedText type="body" style={styles.personName} numberOfLines={1}>
                  {person.name?.split(' ')[0]}
                </ThemedText>
                <View style={[styles.roleTag, { backgroundColor: roleColor + '20' }]}>
                  <ThemedText type="small" style={{ color: roleColor, fontSize: 10, fontWeight: '600' }}>
                    {roleLabel}
                  </ThemedText>
                </View>
                {person.level ? (
                  <View style={[styles.levelTag, { backgroundColor: LevelColors[`N${person.level}` as keyof typeof LevelColors] + '20' }]}>
                    <ThemedText type="small" style={{ color: LevelColors[`N${person.level}` as keyof typeof LevelColors], fontSize: 9, fontWeight: '700' }}>
                      {getLevelLabel(person.level)}
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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

  const renderFeedFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        <Pressable
          style={[
            styles.filterChip,
            feedFilter === 'all' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFeedFilter('all')}
        >
          <Feather name="layers" size={16} color={feedFilter === 'all' ? '#FFFFFF' : colors.textSecondary} />
          <ThemedText type="small" style={{ color: feedFilter === 'all' ? '#FFFFFF' : colors.textSecondary }}>
            Todos
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.filterChip,
            feedFilter === 'demands' && { backgroundColor: CARD_COLORS.demand.primary },
          ]}
          onPress={() => setFeedFilter('demands')}
        >
          <Feather name="search" size={16} color={feedFilter === 'demands' ? '#FFFFFF' : colors.textSecondary} />
          <ThemedText type="small" style={{ color: feedFilter === 'demands' ? '#FFFFFF' : colors.textSecondary }}>
            Demandas
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.filterChip,
            feedFilter === 'offers' && { backgroundColor: CARD_COLORS.offer.primary },
          ]}
          onPress={() => setFeedFilter('offers')}
        >
          <Feather name="briefcase" size={16} color={feedFilter === 'offers' ? '#FFFFFF' : colors.textSecondary} />
          <ThemedText type="small" style={{ color: feedFilter === 'offers' ? '#FFFFFF' : colors.textSecondary }}>
            Ofertas
          </ThemedText>
        </Pressable>
        <View style={styles.filterDivider} />
        {([10, 25, 50, 100, 'all'] as RadiusFilter[]).map((r) => (
          <Pressable
            key={r}
            style={[
              styles.filterChip,
              radiusFilter === r && { backgroundColor: colors.secondary },
            ]}
            onPress={() => setRadiusFilter(r)}
          >
            <Feather name="map-pin" size={14} color={radiusFilter === r ? '#FFFFFF' : colors.textSecondary} />
            <ThemedText type="small" style={{ color: radiusFilter === r ? '#FFFFFF' : colors.textSecondary }}>
              {r === 'all' ? 'Todos' : `${r}km`}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderOfferCard = (offer: OfferWithDistance) => {
    const serviceNames = offer.serviceTypeIds
      .map(id => getServiceTypeById(id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
    const price = offer.pricePerDay || offer.pricePerHour || offer.pricePerUnit || 0;
    const priceLabel = offer.pricePerDay ? '/dia' : offer.pricePerHour ? '/hora' : '/unid';
    
    return (
      <Pressable
        key={offer.id}
        style={[styles.offerCard, { backgroundColor: colors.card, borderLeftColor: CARD_COLORS.offer.primary }, Shadows.card]}
        onPress={() => navigation.navigate('OfferDetail' as any, { offerId: offer.id })}
      >
        <View style={styles.offerHeader}>
          <View style={[styles.offerTypeTag, { backgroundColor: CARD_COLORS.offer.background }]}>
            <Feather name="briefcase" size={14} color={CARD_COLORS.offer.primary} />
            <ThemedText type="small" style={{ color: CARD_COLORS.offer.primary, fontWeight: '600' }}>
              OFERTA
            </ThemedText>
          </View>
          <View style={styles.offerMeta}>
            {offer.calculatedDistance !== null && offer.calculatedDistance !== undefined ? (
              <>
                <Feather name="navigation" size={12} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                  {formatDistance(offer.calculatedDistance)}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary, marginHorizontal: 4 }}>
                  |
                </ThemedText>
              </>
            ) : null}
            <Feather name="map-pin" size={12} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {offer.availableRadius}km
            </ThemedText>
          </View>
        </View>
        <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.sm }}>
          {serviceNames}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }} numberOfLines={2}>
          {offer.description}
        </ThemedText>
        <View style={styles.offerFooter}>
          <ThemedText type="h4" style={{ color: CARD_COLORS.offer.primary }}>
            {formatCurrency(price)}{priceLabel}
          </ThemedText>
          {offer.priceNegotiable ? (
            <View style={[styles.negotiableBadge, { backgroundColor: colors.accent + '20' }]}>
              <ThemedText type="small" style={{ color: colors.accent }}>Negociavel</ThemedText>
            </View>
          ) : null}
        </View>
        {offer.extras && (
          <View style={styles.extrasRow}>
            {offer.extras.providesFood && (
              <View style={[styles.extraBadge, { backgroundColor: colors.success + '20' }]}>
                <Feather name="coffee" size={12} color={colors.success} />
              </View>
            )}
            {offer.extras.providesAccommodation && (
              <View style={[styles.extraBadge, { backgroundColor: colors.success + '20' }]}>
                <Feather name="home" size={12} color={colors.success} />
              </View>
            )}
            {offer.extras.providesTransport && (
              <View style={[styles.extraBadge, { backgroundColor: colors.success + '20' }]}>
                <Feather name="truck" size={12} color={colors.success} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const renderAvailableJobs = () => {
    if (!isWorker) return null;
    
    const filteredJobs = feedFilter === 'offers' ? [] : jobs;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="zap" size={20} color={colors.accent} />
            <ThemedText type="h4" style={{ color: colors.accent }}>
              Trabalhos Disponiveis
            </ThemedText>
            {filteredJobs.length > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>{filteredJobs.length}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        
        {filteredJobs.length > 0 ? (
          <GestureHandlerRootView style={styles.jobsContainer}>
            {filteredJobs.slice(0, 5).map((job) => (
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

  const renderAvailableOffers = () => {
    if (!isProducer || feedFilter === 'demands') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="users" size={20} color={CARD_COLORS.offer.primary} />
            <ThemedText type="h4" style={{ color: CARD_COLORS.offer.primary }}>
              Trabalhadores Disponiveis
            </ThemedText>
            {offers.length > 0 ? (
              <View style={[styles.countBadge, { backgroundColor: CARD_COLORS.offer.primary }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>{offers.length}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        
        {offers.length > 0 ? (
          <View style={styles.offersContainer}>
            {offers.slice(0, 5).map(renderOfferCard)}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Feather name="users" size={48} color={colors.textSecondary} />
            <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
              Nenhuma oferta de trabalhador disponivel.{'\n'}Volte mais tarde!
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  const { width: screenWidth } = Dimensions.get('window');

  return (
    <ThemedView style={styles.container}>
      {/* Intro Video Modal - shows on first visit */}
      <IntroVideoModal />
      
      {/* Decorative cacao canopy header - positioned behind content */}
      <Image
        source={cacaoCanopyHeader}
        style={[styles.canopyDecoration, { width: screenWidth }]}
        contentFit="cover"
        contentPosition="bottom"
      />
      
      {/* Corner branch decorations */}
      <Image
        source={cornerBranch}
        style={styles.cornerBranchLeft}
        contentFit="contain"
      />
      <Image
        source={cornerBranch}
        style={[styles.cornerBranchRight, { transform: [{ scaleX: -1 }] }]}
        contentFit="contain"
      />

      <ScreenScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing['2xl'] + 120 }}
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
            <ThemedText type="h2">LidaCacau</ThemedText>
          </View>
          {renderRoleSwitcher()}
        </View>

        {renderProfileHeader()}
        {renderLocationBanner()}
        {renderQuickStats()}
        
        {/* Interactive Map Widget */}
        <ExpandableMapWidget />
        
        {/* Decorative branch divider */}
        <View style={styles.branchDividerContainer}>
          <Image
            source={branchDivider}
            style={styles.branchDivider}
            contentFit="contain"
          />
        </View>
        
        {renderGenteDaLida()}
        {renderFeedFilters()}
        
        {/* Decorative branch divider before jobs */}
        <View style={styles.branchDividerContainer}>
          <Image
            source={branchDivider}
            style={styles.branchDivider}
            contentFit="contain"
          />
        </View>
        
        {renderMyJobsSection()}
        {renderAvailableJobs()}
        {renderAvailableOffers()}
      </ScreenScrollView>

      {/* Decorative grass and dead leaves footer - positioned at bottom */}
      <Image
        source={grassFooter}
        style={[styles.grassFooter, { width: screenWidth }]}
        contentFit="cover"
        contentPosition="top"
        pointerEvents="none"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Decorative cacao elements
  canopyDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 140,
    zIndex: 0,
    opacity: 0.85,
  },
  cornerBranchLeft: {
    position: 'absolute',
    top: 180,
    left: -20,
    width: 100,
    height: 100,
    zIndex: 0,
    opacity: 0.6,
    transform: [{ rotate: '15deg' }],
  },
  cornerBranchRight: {
    position: 'absolute',
    top: 180,
    right: -20,
    width: 100,
    height: 100,
    zIndex: 0,
    opacity: 0.6,
    transform: [{ rotate: '-15deg' }],
  },
  grassFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 100,
    zIndex: 0,
    opacity: 0.9,
  },
  branchDividerContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
    overflow: 'hidden',
  },
  branchDivider: {
    width: 200,
    height: 30,
    opacity: 0.5,
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
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  locationBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  locationBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
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
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
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
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Spacing.sm,
  },
  offersContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  offerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  negotiableBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  extrasRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  extraBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genteDaLidaScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  personCard: {
    width: 100,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  personAvatarContainer: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  personAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  personAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  roleTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  levelTag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 2,
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
