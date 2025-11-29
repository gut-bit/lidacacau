import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, FlatList, Alert, Platform, Linking } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SocialLinksDisplay } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { User, Review } from '@/types';
import { getUserById, getReviewsByUser } from '@/utils/storage';
import { getLevelLabel } from '@/utils/format';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OtherUserProfile'>;

interface ReviewWithReviewer extends Review {
  reviewerName: string;
  averageRating: number;
}

export default function OtherUserProfileScreen() {
  const route = useRoute<Props['route']>();
  const { userId } = route.params;
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateReviewAverage = (review: Review): number => {
    return (review.quality + review.safety + review.punctuality + review.communication + review.fairness) / 5;
  };

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      
      if (userData) {
        const userReviews = await getReviewsByUser(userId);
        const reviewsWithDetails: ReviewWithReviewer[] = [];
        
        for (const review of userReviews) {
          const reviewer = await getUserById(review.reviewerId);
          reviewsWithDetails.push({
            ...review,
            reviewerName: reviewer?.name || 'Usuario',
            averageRating: calculateReviewAverage(review),
          });
        }
        
        setReviews(reviewsWithDetails);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  if (!user) {
    return (
      <ScreenScrollView>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="h3">Usuario nao encontrado</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const isWorker = user.role === 'worker';
  const avgRating = user.averageRating || 0;

  const handleShareProfile = async () => {
    try {
      const message = `Confira o perfil de ${user.name} no LidaCacau! ${isWorker ? 'Nivel: ' + getLevelLabel(user.level || 1) : ''}`;
      await Clipboard.setStringAsync(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copiado!', 'Link do perfil copiado para a area de transferencia.');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderReviewItem = ({ item }: { item: ReviewWithReviewer }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.card }, Shadows.card]}>
      <View style={styles.reviewHeader}>
        <View>
          <ThemedText type="h4">{item.reviewerName}</ThemedText>
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather
                key={i}
                name="star"
                size={14}
                color={i < Math.round(item.averageRating) ? '#FFB800' : colors.textSecondary}
              />
            ))}
          </View>
        </View>
        <ThemedText type="h3" style={{ color: '#FFB800' }}>
          {item.averageRating.toFixed(1)}
        </ThemedText>
      </View>
      {item.comment ? (
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
          "{item.comment}"
        </ThemedText>
      ) : null}
    </View>
  );

  return (
    <ScreenScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUserData} />}
    >
      <View style={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: colors.card }, Shadows.card]}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
              <Feather name="user" size={48} color={colors.primary} />
            </View>
          )}
          
          <View style={styles.nameContainer}>
            <ThemedText type="h2">{user.name}</ThemedText>
            {isWorker ? (
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: LevelColors[`N${user.level || 1}` as keyof typeof LevelColors] },
                ]}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {getLevelLabel(user.level || 1)}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {user.verification?.status === 'approved' ? (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <ThemedText type="small" style={{ color: colors.success, fontWeight: '600' }}>
                Verificado
              </ThemedText>
            </View>
          ) : null}

          {user.location ? (
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                {user.location}
              </ThemedText>
            </View>
          ) : null}

          <Pressable
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShareProfile}
          >
            <Feather name="share-2" size={16} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Compartilhar Perfil
            </ThemedText>
          </Pressable>
        </View>

        {user.socialLinks && Object.keys(user.socialLinks).length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Contato</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <SocialLinksDisplay socialLinks={user.socialLinks} size="medium" />
            </View>
          </View>
        ) : null}

        {(user.workerProfile?.bio || user.producerProfile?.bio) ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Sobre</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <ThemedText type="body" style={{ color: colors.text }}>
                {user.workerProfile?.bio || user.producerProfile?.bio}
              </ThemedText>
            </View>
          </View>
        ) : null}

        {isWorker ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Estatisticas</ThemedText>
            <View style={[styles.statsContainer, { backgroundColor: colors.card }, Shadows.card]}>
              <View style={styles.statItem}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Avaliacao Media
                </ThemedText>
                <View style={styles.ratingContainer}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Feather
                      key={i}
                      name="star"
                      size={18}
                      color={i < Math.round(avgRating) ? '#FFB800' : colors.textSecondary}
                    />
                  ))}
                </View>
                <ThemedText type="h2" style={{ color: '#FFB800' }}>
                  {avgRating.toFixed(1)}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  ({user.totalReviews || 0} avaliacoes)
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        {reviews.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Avaliacoes ({reviews.length})
            </ThemedText>
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            />
          </View>
        ) : null}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  headerCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statsContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
