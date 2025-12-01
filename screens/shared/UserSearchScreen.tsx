import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors, Typography } from '@/constants/theme';
import { User, FriendConnection, UserPresence } from '@/types';
import {
  getUsers,
  getFriends,
  getSentFriendRequests,
  sendFriendRequest,
  getUserPresence,
} from '@/utils/storage';
import { trackEvent } from '@/utils/analytics';
import { RootStackParamList } from '@/navigation/RootNavigator';

type FilterType = 'all' | 'producers' | 'workers' | 'verified' | 'online';

interface UserWithStatus extends User {
  isFriend: boolean;
  hasPendingRequest: boolean;
  isOnline: boolean;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'producers', label: 'Produtores' },
  { key: 'workers', label: 'Trabalhadores' },
  { key: 'verified', label: 'Verificados' },
  { key: 'online', label: 'Online agora' },
];

export default function UserSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [allUsers, setAllUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!user) return;

    try {
      const [users, friendConnections, sentRequests] = await Promise.all([
        getUsers(),
        getFriends(user.id),
        getSentFriendRequests(user.id),
      ]);

      const friendIds = new Set<string>();
      for (const connection of friendConnections) {
        const friendId = connection.requesterId === user.id 
          ? connection.receiverId 
          : connection.requesterId;
        friendIds.add(friendId);
      }

      const pendingRequestIds = new Set<string>();
      for (const request of sentRequests) {
        pendingRequestIds.add(request.receiverId);
      }

      const usersWithPresence: UserWithStatus[] = [];
      
      for (const u of users) {
        if (u.id === user.id) continue;
        
        const presence = await getUserPresence(u.id);
        const isOnline = presence?.isOnline || false;
        
        usersWithPresence.push({
          ...u,
          isFriend: friendIds.has(u.id),
          hasPendingRequest: pendingRequestIds.has(u.id),
          isOnline,
        });
      }

      setAllUsers(usersWithPresence);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleSendRequest = async (targetUserId: string, targetUserName: string) => {
    if (!user) return;

    setSendingRequest(targetUserId);
    try {
      await sendFriendRequest(user.id, targetUserId);
      await trackEvent('friend_request_send', { targetUserId });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Pedido Enviado!',
        `Voce deu a mao para ${targetUserName}. Aguarde a resposta!`
      );
      await loadUsers();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel enviar o pedido');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    navigation.navigate('OtherUserProfile', { userId });
  };

  const filteredUsers = allUsers.filter((u) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (!u.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    switch (activeFilter) {
      case 'producers':
        return u.roles.includes('producer');
      case 'workers':
        return u.roles.includes('worker');
      case 'verified':
        return u.verification?.status === 'approved';
      case 'online':
        return u.isOnline;
      case 'all':
      default:
        return true;
    }
  });

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderAvatar = (u: UserWithStatus) => {
    if (u.avatar) {
      return (
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: u.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          {u.isOnline ? (
            <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
          <ThemedText type="h4" style={{ color: colors.primary }}>
            {getInitials(u.name)}
          </ThemedText>
        </View>
        {u.isOnline ? (
          <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
        ) : null}
      </View>
    );
  };

  const renderLevelBadge = (level: number | undefined, role: string) => {
    if (!level) return null;
    const levelKey = `N${level}` as keyof typeof LevelColors;
    return (
      <View style={[styles.levelBadge, { backgroundColor: LevelColors[levelKey] }]}>
        <ThemedText type="small" style={styles.levelText}>
          N{level}
        </ThemedText>
      </View>
    );
  };

  const renderRating = (rating: number | undefined, totalReviews: number | undefined) => {
    const displayRating = rating || 0;
    const stars = Math.round(displayRating);
    
    return (
      <View style={styles.ratingContainer}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Feather
            key={i}
            name="star"
            size={12}
            color={i < stars ? '#FFB800' : colors.textSecondary}
          />
        ))}
        <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
          {Number(displayRating || 0).toFixed(1)} ({totalReviews || 0})
        </ThemedText>
      </View>
    );
  };

  const renderActionButton = (u: UserWithStatus) => {
    if (u.isFriend) {
      return (
        <View style={[styles.actionButton, styles.friendButton, { backgroundColor: colors.textSecondary + '30' }]}>
          <Feather name="check" size={16} color={colors.textSecondary} />
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Ja amigos
          </ThemedText>
        </View>
      );
    }

    if (u.hasPendingRequest) {
      return (
        <View style={[styles.actionButton, { backgroundColor: colors.warning }]}>
          <Feather name="clock" size={16} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: '#FFFFFF' }}>
            Aguardando...
          </ThemedText>
        </View>
      );
    }

    return (
      <Pressable
        style={[styles.actionButton, { backgroundColor: colors.handshake }]}
        onPress={() => handleSendRequest(u.id, u.name)}
        disabled={sendingRequest === u.id}
      >
        {sendingRequest === u.id ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Feather name="user-plus" size={16} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Dar a Mao
            </ThemedText>
          </>
        )}
      </Pressable>
    );
  };

  const renderUserCard = ({ item }: { item: UserWithStatus }) => (
    <Pressable
      style={[styles.userCard, { backgroundColor: colors.card }, Shadows.card]}
      onPress={() => handleNavigateToProfile(item.id)}
    >
      <View style={styles.cardContent}>
        {renderAvatar(item)}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <ThemedText type="h4" numberOfLines={1} style={styles.userName}>
              {item.name}
            </ThemedText>
            {item.roles.includes('worker') ? renderLevelBadge(item.level, 'worker') : null}
            {item.verification?.status === 'approved' ? (
              <Feather name="check-circle" size={16} color={colors.success} />
            ) : null}
          </View>
          
          {item.location ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {item.location}
              </ThemedText>
            </View>
          ) : null}
          
          {item.roles.includes('worker') ? (
            renderRating(item.averageRating, item.totalReviews)
          ) : null}
          
          <View style={styles.roleRow}>
            {item.roles.includes('producer') ? (
              <View style={[styles.roleTag, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText type="small" style={{ color: colors.primary }}>
                  Produtor
                </ThemedText>
              </View>
            ) : null}
            {item.roles.includes('worker') ? (
              <View style={[styles.roleTag, { backgroundColor: colors.secondary + '20' }]}>
                <ThemedText type="small" style={{ color: colors.secondary }}>
                  Trabalhador
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        {renderActionButton(item)}
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.handshake + '20' }]}>
        <Feather name="users" size={48} color={colors.handshake} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Nenhum usuario encontrado
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Tente buscar por outro nome ou ajuste os filtros.
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.handshake} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando usuarios...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por nome..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key
                ? { backgroundColor: colors.handshake }
                : { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <ThemedText
              type="small"
              style={[
                styles.filterText,
                { color: activeFilter === filter.key ? '#FFFFFF' : colors.text },
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: paddingBottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.handshake}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    height: Spacing.inputHeight,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Rubik_400Regular',
    paddingVertical: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minHeight: Spacing.touchTarget,
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  userCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userName: {
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  roleTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minHeight: Spacing.touchTarget,
  },
  friendButton: {},
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
