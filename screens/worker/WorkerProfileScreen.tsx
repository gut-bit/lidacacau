import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { getWorkOrdersByWorker, getReviewsByUser } from '@/utils/storage';
import { getLevelLabel, getLevelRequirement } from '@/utils/format';

export default function WorkerProfileScreen() {
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
    { icon: 'edit-3', label: 'Editar Perfil', onPress: () => {} },
    { icon: 'bell', label: 'Notificações', onPress: () => {} },
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
            <Feather name="briefcase" size={24} color={colors.primary} />
            <ThemedText type="h3">{stats.completedServices}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Serviços
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="star" size={24} color={colors.accent} />
            <ThemedText type="h3">{user?.averageRating?.toFixed(1) || '0.0'}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Média
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="message-circle" size={24} color={colors.success} />
            <ThemedText type="h3">{user?.totalReviews || 0}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    gap: Spacing.xs,
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
    width: 40,
    height: 40,
    borderRadius: 10,
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
