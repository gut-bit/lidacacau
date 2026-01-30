import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors, Typography } from '@/constants/theme';
import { User, FriendConnection } from '@/types';
import { serviceFactory } from '@/services';
import { FriendWithUser } from '@/services/interfaces/ISocialService';
import { getLevelLabel } from '@/utils/format';
import { trackEvent } from '@/utils/analytics';
import { RootStackParamList } from '@/navigation/RootNavigator';

type TabType = 'friends' | 'received' | 'sent';


// Type alias already matches interface name but strict import is better
// removed local interface definition

export default function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendWithUser[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      const socialService = serviceFactory.getSocialService();

      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        socialService.getFriends(user.id),
        socialService.getPendingRequests(user.id),
        socialService.getSentRequests(user.id),
      ]);

      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data);
      }

      if (receivedRes.success && receivedRes.data) {
        setReceivedRequests(receivedRes.data);
      }

      if (sentRes.success && sentRes.data) {
        setSentRequests(sentRes.data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadFriendsData();
    }, [loadFriendsData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFriendsData();
  }, [loadFriendsData]);

  const handleAcceptRequest = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      const result = await serviceFactory.getSocialService().acceptFriendRequest(connectionId);
      if (!result.success) throw new Error(result.error);

      await trackEvent('friend_request_accept', { connectionId });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel aceitar o pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      const result = await serviceFactory.getSocialService().rejectFriendRequest(connectionId);
      if (!result.success) throw new Error(result.error);

      await trackEvent('friend_request_reject', { connectionId });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel recusar o pedido');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (connectionId: string, friendName: string) => {
    Alert.alert(
      'Remover Amigo',
      `Tem certeza que deseja remover ${friendName} da sua lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(connectionId);
            try {
              const result = await serviceFactory.getSocialService().removeFriend(connectionId);
              if (!result.success) throw new Error(result.error);

              await trackEvent('friend_remove', { connectionId });
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              await loadFriendsData();
            } catch (error) {
              Alert.alert('Erro', 'Nao foi possivel remover o amigo');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (friendId: string) => {
    if (!user) return;

    try {
      const result = await serviceFactory.getSocialService().getOrCreateChatRoom(user.id, friendId);
      if (!result.success || !result.data) {
        Alert.alert('Erro', result.error || 'Nao foi possivel criar a sala de conversa');
        return;
      }
      navigation.navigate('ChatRoom', { roomId: result.data.id, otherUserId: friendId });
    } catch (error) {
      console.error('Error creating chat room:', error);
      Alert.alert('Erro', 'Nao foi possivel iniciar a conversa');
    }
  };

  const handleAddFriend = () => {
    navigation.navigate('UserSearch');
  };

  const renderAvatar = (friend: User) => {
    if (friend.avatar) {
      return (
        <Image
          source={{ uri: friend.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
      );
    }
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
        <Feather name="user" size={24} color={colors.primary} />
      </View>
    );
  };

  const renderLevelBadge = (level: number | undefined) => {
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

  const renderFriendItem = (item: FriendWithUser) => (
    <View key={item.id} style={[styles.friendCard, { backgroundColor: colors.card }, Shadows.card]}>
      <View style={styles.friendInfo}>
        {renderAvatar(item.friend)}
        <View style={styles.friendDetails}>
          <View style={styles.nameRow}>
            <ThemedText type="h4" numberOfLines={1} style={styles.friendName}>
              {item.friend.name}
            </ThemedText>
            {renderLevelBadge(item.friend.level)}
          </View>
          {item.friend.location ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {item.friend.location}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.friendActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.handshake }]}
          onPress={() => handleStartChat(item.friend.id)}
          disabled={actionLoading === item.id}
        >
          <Feather name="message-circle" size={18} color="#FFFFFF" />
          <ThemedText type="small" style={styles.actionButtonText}>
            Conversar
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.removeButton, { borderColor: colors.error }]}
          onPress={() => handleRemoveFriend(item.id, item.friend.name)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Feather name="user-minus" size={18} color={colors.error} />
          )}
        </Pressable>
      </View>
    </View>
  );

  const renderReceivedRequestItem = (item: FriendWithUser) => (
    <View key={item.id} style={[styles.friendCard, { backgroundColor: colors.card }, Shadows.card]}>
      <View style={styles.friendInfo}>
        {renderAvatar(item.friend)}
        <View style={styles.friendDetails}>
          <ThemedText type="h4" numberOfLines={1} style={styles.friendName}>
            {item.friend.name}
          </ThemedText>
          {item.message ? (
            <ThemedText type="small" style={{ color: colors.textSecondary, fontStyle: 'italic' }} numberOfLines={2}>
              "{item.message}"
            </ThemedText>
          ) : (
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Quer ser seu amigo do campo
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.requestButton, { backgroundColor: colors.handshake }]}
          onPress={() => handleAcceptRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" />
              <ThemedText type="small" style={styles.actionButtonText}>
                Aceitar
              </ThemedText>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.requestButton, { backgroundColor: colors.error }]}
          onPress={() => handleRejectRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="x" size={18} color="#FFFFFF" />
              <ThemedText type="small" style={styles.actionButtonText}>
                Recusar
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );

  const renderSentRequestItem = (item: FriendWithUser) => (
    <View key={item.id} style={[styles.friendCard, { backgroundColor: colors.card }, Shadows.card]}>
      <View style={styles.friendInfo}>
        {renderAvatar(item.friend)}
        <View style={styles.friendDetails}>
          <ThemedText type="h4" numberOfLines={1} style={styles.friendName}>
            {item.friend.name}
          </ThemedText>
          <View style={styles.pendingRow}>
            <Feather name="clock" size={12} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Aguardando resposta...
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = (type: TabType) => {
    const emptyConfig = {
      friends: {
        icon: 'users' as const,
        title: 'Nenhum amigo ainda',
        message: 'Encontre outros produtores e trabalhadores para criar sua rede de amigos do campo!',
      },
      received: {
        icon: 'inbox' as const,
        title: 'Nenhum pedido recebido',
        message: 'Quando alguem quiser ser seu amigo, os pedidos aparecerao aqui.',
      },
      sent: {
        icon: 'send' as const,
        title: 'Nenhum pedido enviado',
        message: 'Busque usuarios para enviar pedidos de amizade e expandir sua rede.',
      },
    };

    const config = emptyConfig[type];

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.handshake + '20' }]}>
          <Feather name={config.icon} size={48} color={colors.handshake} />
        </View>
        <ThemedText type="h3" style={styles.emptyTitle}>
          {config.title}
        </ThemedText>
        <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          {config.message}
        </ThemedText>
      </View>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.handshake} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando...
          </ThemedText>
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return friends.length > 0 ? (
          <View style={styles.listContainer}>
            {friends.map(renderFriendItem)}
          </View>
        ) : renderEmptyState('friends');

      case 'received':
        return receivedRequests.length > 0 ? (
          <View style={styles.listContainer}>
            {receivedRequests.map(renderReceivedRequestItem)}
          </View>
        ) : renderEmptyState('received');

      case 'sent':
        return sentRequests.length > 0 ? (
          <View style={styles.listContainer}>
            {sentRequests.map(renderSentRequestItem)}
          </View>
        ) : renderEmptyState('sent');
    }
  };

  const getTabCount = (type: TabType): number => {
    switch (type) {
      case 'friends':
        return friends.length;
      case 'received':
        return receivedRequests.length;
      case 'sent':
        return sentRequests.length;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.handshake}
          />
        }
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'friends' && [styles.activeTab, { borderBottomColor: colors.handshake }],
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                activeTab === 'friends' && { color: colors.handshake, fontFamily: Typography.h4.fontFamily },
              ]}
            >
              Meus Amigos
            </ThemedText>
            {getTabCount('friends') > 0 ? (
              <View style={[styles.tabBadge, { backgroundColor: colors.handshake + '20' }]}>
                <ThemedText type="small" style={{ color: colors.handshake }}>
                  {getTabCount('friends')}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'received' && [styles.activeTab, { borderBottomColor: colors.handshake }],
            ]}
            onPress={() => setActiveTab('received')}
          >
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                activeTab === 'received' && { color: colors.handshake, fontFamily: Typography.h4.fontFamily },
              ]}
            >
              Recebidos
            </ThemedText>
            {getTabCount('received') > 0 ? (
              <View style={[styles.tabBadge, { backgroundColor: colors.handshake }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                  {getTabCount('received')}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'sent' && [styles.activeTab, { borderBottomColor: colors.handshake }],
            ]}
            onPress={() => setActiveTab('sent')}
          >
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                activeTab === 'sent' && { color: colors.handshake, fontFamily: Typography.h4.fontFamily },
              ]}
            >
              Enviados
            </ThemedText>
            {getTabCount('sent') > 0 ? (
              <View style={[styles.tabBadge, { backgroundColor: colors.handshake + '20' }]}>
                <ThemedText type="small" style={{ color: colors.handshake }}>
                  {getTabCount('sent')}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        </View>

        {renderTabContent()}
      </ScreenScrollView>

      <Pressable
        style={[
          styles.fab,
          { backgroundColor: colors.handshake, bottom: insets.bottom + Spacing.xl },
          Shadows.fab,
        ]}
        onPress={handleAddFriend}
      >
        <Feather name="user-plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    minHeight: Spacing.touchTarget,
  },
  activeTab: {
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  tabText: {
    textAlign: 'center',
  },
  tabBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  friendCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  friendDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  friendName: {
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
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  friendActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minHeight: Spacing.touchTarget,
  },
  removeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minHeight: Spacing.touchTarget,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
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
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
