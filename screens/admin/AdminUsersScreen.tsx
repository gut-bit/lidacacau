import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { User } from '@/types';
import { getUsers } from '@/utils/storage';
import { formatDate, getLevelLabel } from '@/utils/format';

export default function AdminUsersScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await getUsers();
      setUsers(allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const roleLabel = item.role === 'producer' ? 'Produtor' : item.role === 'worker' ? 'Trabalhador' : 'Admin';
    const roleColor = item.role === 'producer' ? colors.secondary : item.role === 'worker' ? colors.success : colors.primary;

    return (
      <View style={[styles.userCard, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.userHeader}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: roleColor + '20' }]}>
            <Feather name="user" size={20} color={roleColor} />
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="h4">{item.name}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {item.email}
            </ThemedText>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <ThemedText type="caption" style={{ color: roleColor, fontWeight: '600' }}>
              {roleLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Cadastrado em {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          {item.role === 'worker' && (
            <>
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: LevelColors[`N${item.level || 1}` as keyof typeof LevelColors] },
                  ]}
                >
                  <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {getLevelLabel(item.level || 1)}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {item.totalReviews || 0} avaliações | Média: {item.averageRating?.toFixed(1) || '0.0'}
                </ThemedText>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="users" size={64} color={colors.textSecondary} />
      <ThemedText type="h3" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        Nenhum usuário
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
          users.length === 0 && styles.emptyList,
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
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  userCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  userDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
});
