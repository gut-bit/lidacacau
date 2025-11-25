import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { AdminStackParamList } from '@/navigation/AdminStackNavigator';
import { getUsers, getJobs, getWorkOrders } from '@/utils/storage';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [stats, setStats] = useState({
    totalUsers: 0,
    producers: 0,
    workers: 0,
    openJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const users = await getUsers();
      const jobs = await getJobs();
      const workOrders = await getWorkOrders();

      const producers = users.filter((u) => u.role === 'producer').length;
      const workers = users.filter((u) => u.role === 'worker').length;
      const openJobs = jobs.filter((j) => j.status === 'open').length;
      const completedWOs = workOrders.filter((wo) => wo.status === 'completed');
      const totalRevenue = completedWOs.reduce((sum, wo) => sum + wo.finalPrice, 0);

      setStats({
        totalUsers: users.length,
        producers,
        workers,
        openJobs,
        completedJobs: completedWOs.length,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h2">Painel Admin</ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Olá, {user?.name}
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="users" size={24} color={colors.primary} />
            <ThemedText type="h2">{stats.totalUsers}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Usuários
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="user" size={24} color={colors.secondary} />
            <ThemedText type="h2">{stats.producers}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Produtores
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="briefcase" size={24} color={colors.success} />
            <ThemedText type="h2">{stats.workers}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Trabalhadores
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="clipboard" size={24} color={colors.warning} />
            <ThemedText type="h2">{stats.openJobs}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Demandas Abertas
            </ThemedText>
          </View>
        </View>

        <View style={[styles.revenueCard, { backgroundColor: colors.accent + '20' }]}>
          <Feather name="trending-up" size={24} color={colors.accent} />
          <View>
            <ThemedText type="h3" style={{ color: colors.accent }}>
              {formatCurrency(stats.totalRevenue)}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.accent }}>
              Total movimentado ({stats.completedJobs} serviços)
            </ThemedText>
          </View>
        </View>

        <View style={styles.menuSection}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Gerenciamento
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
              Shadows.card,
            ]}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="users" size={20} color={colors.primary} />
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>
              Usuários
            </ThemedText>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
              Shadows.card,
            ]}
            onPress={() => navigation.navigate('AdminServices')}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.success + '10' }]}>
              <Feather name="tool" size={20} color={colors.success} />
            </View>
            <ThemedText type="body" style={{ flex: 1 }}>
              Tipos de Serviço
            </ThemedText>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
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
  header: {
    marginBottom: Spacing['2xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing['2xl'],
  },
  menuSection: {
    marginBottom: Spacing['2xl'],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  menuIcon: {
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
  },
});
