import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SocialLinksDisplay, CommunityWhatsAppButton } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { getWorkOrdersByWorker, getReviewsByUser } from '@/utils/storage';
import { getLevelLabel, getLevelRequirement } from '@/utils/format';
import { RootStackParamList } from '@/navigation/RootNavigator';

export default function WorkerProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const [stats, setStats] = useState({ totalServices: 0, completedServices: 0 });

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const workOrders = await getWorkOrdersByWorker(user.id);
      const completed = workOrders.filter((wo) => wo.status === 'completed').length;
      setStats({ totalServices: workOrders.length, completedServices: completed });
      await refreshUser();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user, refreshUser]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const level = user?.level || 1;
  const levelColor = LevelColors[`N${level}` as keyof typeof LevelColors];
  const nextLevel = level < 5 ? level + 1 : 5;
  const nextLevelColor = LevelColors[`N${nextLevel}` as keyof typeof LevelColors];

  const menuItems = [
    { icon: 'archive', label: 'Historico de Servicos', onPress: () => navigation.navigate('ServiceHistory'), color: colors.primary, highlight: true },
    { icon: 'clipboard', label: 'Modelo de Contrato', onPress: () => navigation.navigate('ContractTemplate', {}), color: colors.secondary },
    { icon: 'book-open', label: 'Capacitacao', onPress: () => navigation.navigate('Education') },
    { icon: 'share-2', label: 'Redes Sociais', onPress: () => navigation.navigate('SocialLinks'), color: '#25D366' },
    { icon: 'edit-3', label: 'Editar Perfil', onPress: () => {} },
    { icon: 'bell', label: 'Notificacoes', onPress: () => {} },
    { icon: 'help-circle', label: 'Ajuda', onPress: () => {} },
    { icon: 'info', label: 'Sobre o App', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing['2xl'] },
        ]}
      >
        <View style={styles.profileHeader}>
          <Image
            source={require('@/assets/avatars/worker.png')}
            style={styles.avatar}
            contentFit="cover"
          />
          <ThemedText type="h2" style={styles.name}>
            {user?.name}
          </ThemedText>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
              {getLevelLabel(level)}
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            {user?.email}
          </ThemedText>

          <View style={styles.socialLinksContainer}>
            <SocialLinksDisplay socialLinks={user?.socialLinks} size="medium" />
          </View>
        </View>

        <View style={styles.communityContainer}>
          <CommunityWhatsAppButton />
        </View>

        {level < 5 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={styles.progressHeader}>
              <ThemedText type="h4">Próximo Nível</ThemedText>
              <View style={[styles.smallBadge, { backgroundColor: nextLevelColor }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {getLevelLabel(nextLevel)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: levelColor,
                    width: `${Math.min(((user?.totalReviews || 0) / (nextLevel * 5)) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {getLevelRequirement(level)}
            </ThemedText>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="briefcase" size={32} color={colors.primary} />
            <ThemedText type="h2">{stats.completedServices}</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Trabalhos
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="star" size={32} color={colors.accent} />
            <ThemedText type="h2">{user?.averageRating?.toFixed(1) || '0.0'}</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Nota
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="award" size={32} color={colors.success} />
            <ThemedText type="h2">{user?.totalReviews || 0}</ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Avaliações
            </ThemedText>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
                Shadows.card,
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Feather name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <ThemedText type="body" style={{ flex: 1 }}>
                {item.label}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: colors.error + '10', opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.error} />
          <ThemedText type="body" style={{ color: colors.error, fontWeight: '600' }}>
            Sair da Conta
          </ThemedText>
        </Pressable>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  levelBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  socialLinksContainer: {
    marginTop: Spacing.lg,
  },
  communityContainer: {
    marginBottom: Spacing.lg,
  },
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuContainer: {
    gap: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing['2xl'],
  },
});
