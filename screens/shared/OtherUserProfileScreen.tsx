import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, FlatList } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SocialLinksDisplay } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { User, Review } from '@/types';
import { getUserById, getReviewsByUser } from '@/utils/storage';
import { getLevelLabel, formatCurrency } from '@/utils/format';

type Props = NativeStackScreenProps<any, 'OtherUserProfile'>;

export default function OtherUserProfileScreen() {
  const route = useRoute<Props['route']>();
  const { userId } = route.params;
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserById(userId);
      setUser(userData);
      
      if (userData) {
        const userReviews = await getReviewsByUser(userId);
        setReviews(userReviews);
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
        <View style={styles.container}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="h3">Usuário não encontrado</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const isWorker = user.role === 'worker';
  const avgRating = user.averageRating || 0;

  const handleShareProfile = async () => {
    try {
      const message = `Confira o perfil de ${user.name} no Empleitapp! ${isWorker ? 'Nível: ' + getLevelLabel(user.level || 1) : ''}`;
      await Sharing.shareAsync('', {
        mimeType: 'text/plain',
        message,
        dialogTitle: 'Compartilhar Perfil',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
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
                color={i < Math.round(item.rating) ? '#FFB800' : colors.textSecondary}
                fill={i < Math.round(item.rating) ? '#FFB800' : 'transparent'}
              />
            ))}
          </View>
        </View>
        <ThemedText type="h3" style={{ color: '#FFB800' }}>
          {item.rating.toFixed(1)}
        </ThemedText>
      </View>
      {item.comment && (
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
          {item.comment}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ScreenScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUserData} />}
    >
      <View style={styles.container}>
        {/* Avatar and Basic Info */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }, Shadows.card]}>
          {user.avatar && (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
          
          <View style={styles.nameContainer}>
            <ThemedText type="h2">{user.name}</ThemedText>
            {isWorker && (
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
            )}
          </View>

          {user.location && (
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                {user.location}
              </ThemedText>
            </View>
          )}

          {user.phone && (
            <View style={styles.detailRow}>
              <Feather name="phone" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                {user.phone}
              </ThemedText>
            </View>
          )}

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

        {/* Social Links */}
        {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Contato</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
              <SocialLinksDisplay socialLinks={user.socialLinks} size="medium" />
            </View>
          </View>
        )}

        {/* Bio */}
        {(user.workerProfile?.bio || user.producerProfile?.bio) && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Sobre</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              {user.workerProfile?.bio || user.producerProfile?.bio}
            </ThemedText>
          </View>
        )}

        {/* Worker Stats */}
        {isWorker && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Estatísticas</ThemedText>
            <View style={[styles.statsContainer, { backgroundColor: colors.card }, Shadows.card]}>
              <View style={styles.statItem}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Avaliação
                </ThemedText>
                <View style={styles.ratingContainer}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Feather
                      key={i}
                      name="star"
                      size={16}
                      color={i < Math.round(avgRating) ? '#FFB800' : colors.textSecondary}
                      fill={i < Math.round(avgRating) ? '#FFB800' : 'transparent'}
                    />
                  ))}
                </View>
                <ThemedText type="h3" style={{ color: '#FFB800' }}>
                  {avgRating.toFixed(1)} ({user.totalReviews || 0})
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Avaliações ({reviews.length})
            </ThemedText>
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            />
          </View>
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
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
  nameContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
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
