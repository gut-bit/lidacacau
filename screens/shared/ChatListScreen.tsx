import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { ChatRoom, User } from '@/types';
import { serviceFactory } from '@/services';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useSimpleScreenInsets } from '@/hooks/useScreenInsets';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

interface ChatRoomWithUser extends ChatRoom {
  otherUser: User;
}

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { paddingTop, paddingBottom } = useSimpleScreenInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [chatRooms, setChatRooms] = useState<ChatRoomWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChatRooms = useCallback(async () => {
    if (!user) return;

    try {
      const socialService = serviceFactory.getSocialService();
      const roomsResult = await socialService.getChatRooms(user.id);

      if (!roomsResult.success || !roomsResult.data) {
        console.error('Failed to load rooms:', roomsResult.error);
        return;
      }

      const rooms = roomsResult.data;
      const roomsWithUsersPromises = rooms.map(async (room) => {
        const otherUserId = room.participantIds.find((id) => id !== user.id);
        if (!otherUserId) return null;

        const userResult = await socialService.getUserProfile(otherUserId);
        if (userResult.success && userResult.data) {
          return { ...room, otherUser: userResult.data } as ChatRoomWithUser;
        }
        return null;
      });

      const roomsWithUsers = (await Promise.all(roomsWithUsersPromises)).filter((r): r is ChatRoomWithUser => r !== null);
      setChatRooms(roomsWithUsers);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [loadChatRooms])
  );

  useEffect(() => {
    const handleNewChat = async () => {
      const newChatWithUserId = route.params?.newChatWithUserId;
      if (newChatWithUserId && user) {
        try {
          const result = await serviceFactory.getSocialService().getOrCreateChatRoom(user.id, newChatWithUserId);
          if (result.success && result.data) {
            navigation.navigate('ChatRoom', { roomId: result.data.id, otherUserId: newChatWithUserId });
          } else {
            console.error('Failed to create chat room:', result.error);
          }
        } catch (error) {
          console.error('Error creating chat room:', error);
        }
      }
    };
    handleNewChat();
  }, [route.params?.newChatWithUserId, user, navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadChatRooms();
  }, [loadChatRooms]);

  const handleOpenChat = (room: ChatRoomWithUser) => {
    navigation.navigate('ChatRoom', { roomId: room.id, otherUserId: room.otherUser.id });
  };

  const getTotalUnread = (): number => {
    if (!user) return 0;
    return chatRooms.reduce((total, room) => total + (room.unreadCount[user.id] || 0), 0);
  };

  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      return weekdays[date.getDay()];
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderAvatar = (otherUser: User) => {
    if (otherUser.avatar) {
      return (
        <Image
          source={{ uri: otherUser.avatar }}
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

  const renderChatItem = ({ item }: { item: ChatRoomWithUser }) => {
    const unreadCount = user ? item.unreadCount[user.id] || 0 : 0;
    const isLastMessageFromMe = item.lastMessageSenderId === user?.id;

    return (
      <Pressable
        style={[styles.chatItem, { backgroundColor: colors.card }, Shadows.card]}
        onPress={() => handleOpenChat(item)}
      >
        <View style={styles.chatContent}>
          {renderAvatar(item.otherUser)}
          <View style={styles.chatDetails}>
            <View style={styles.chatHeader}>
              <ThemedText type="h4" numberOfLines={1} style={styles.chatName}>
                {item.otherUser.name}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: unreadCount > 0 ? colors.primary : colors.textSecondary }}
              >
                {formatTime(item.lastMessageAt)}
              </ThemedText>
            </View>
            <View style={styles.chatPreview}>
              <ThemedText
                type="body"
                numberOfLines={1}
                style={[
                  styles.lastMessage,
                  {
                    color: unreadCount > 0 ? colors.text : colors.textSecondary,
                    fontWeight: unreadCount > 0 ? '600' : '400',
                  },
                ]}
              >
                {isLastMessageFromMe && item.lastMessage ? 'Voce: ' : ''}
                {item.lastMessage || 'Nenhuma mensagem ainda'}
              </ThemedText>
              {unreadCount > 0 ? (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText type="small" style={styles.unreadText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="message-circle" size={48} color={colors.primary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Nenhuma conversa ainda
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Conecte-se com outros usuarios!
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: paddingTop }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando conversas...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: paddingTop }]}>
      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: paddingBottom + Spacing.xl },
          chatRooms.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        showsVerticalScrollIndicator={false}
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
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyListContent: {
    flex: 1,
  },
  chatItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  chatContent: {
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
  chatDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lastMessage: {
    flex: 1,
  },
  unreadBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
