import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { DirectMessage, User } from '@/types';
import { getMessages, sendDirectMessage, markMessagesAsRead, getUserById } from '@/utils/storage';
import { trackEvent } from '@/utils/analytics';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { roomId, otherUserId } = route.params ?? {};
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const hasValidParams = Boolean(roomId && otherUserId);

  const loadData = useCallback(async () => {
    if (!roomId || !otherUserId) return;
    
    try {
      const [loadedMessages, loadedUser] = await Promise.all([
        getMessages(roomId),
        getUserById(otherUserId),
      ]);
      
      setMessages(loadedMessages);
      setOtherUser(loadedUser);

      if (user) {
        await markMessagesAsRead(roomId, user.id);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, otherUserId, user]);

  useFocusEffect(
    useCallback(() => {
      if (hasValidParams) {
        loadData();
      }
    }, [loadData, hasValidParams])
  );

  useEffect(() => {
    if (otherUser && hasValidParams) {
      navigation.setOptions({
        headerTitle: () => (
          <Pressable
            style={styles.headerTitle}
            onPress={() => navigation.navigate('OtherUserProfile', { userId: otherUserId! })}
          >
            {otherUser.avatar ? (
              <Image
                source={{ uri: otherUser.avatar }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.primary + '30' }]}>
                <Feather name="user" size={16} color={colors.primary} />
              </View>
            )}
            <View>
              <ThemedText type="h4" numberOfLines={1}>
                {otherUser.name}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textSecondary} />
          </Pressable>
        ),
      });
    }
  }, [otherUser, navigation, otherUserId, colors, hasValidParams]);

  if (!hasValidParams) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Parametros de conversa invalidos
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleSend = async () => {
    if (!messageText.trim() || !user || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const newMessage = await sendDirectMessage(roomId, user.id, text);
      await trackEvent('chat_send', { roomId, messageLength: text.length });
      setMessages((prev) => [...prev, newMessage]);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hoje';
    } else if (days === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage: DirectMessage, index: number, reversedMessages: DirectMessage[]): boolean => {
    if (index === reversedMessages.length - 1) return true;
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const nextDate = new Date(reversedMessages[index + 1].createdAt).toDateString();
    return currentDate !== nextDate;
  };

  const reversedMessages = [...messages].reverse();

  const renderMessage = ({ item, index }: { item: DirectMessage; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const showDateSeparator = shouldShowDateSeparator(item, index, reversedMessages);

    return (
      <View>
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage
                ? [styles.myMessageBubble, { backgroundColor: colors.primary }]
                : [styles.otherMessageBubble, { backgroundColor: colors.backgroundSecondary }],
            ]}
          >
            <ThemedText
              type="body"
              style={[styles.messageText, { color: isMyMessage ? '#FFFFFF' : colors.text }]}
            >
              {item.content}
            </ThemedText>
            <View style={styles.messageFooter}>
              <ThemedText
                type="caption"
                style={[
                  styles.messageTime,
                  { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                ]}
              >
                {formatMessageTime(item.createdAt)}
              </ThemedText>
              {isMyMessage ? (
                <Feather
                  name={item.read ? 'check-circle' : 'check'}
                  size={12}
                  color="rgba(255,255,255,0.7)"
                  style={styles.readIcon}
                />
              ) : null}
            </View>
          </View>
        </View>
        {showDateSeparator ? (
          <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <ThemedText type="small" style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDateSeparator(item.createdAt)}
            </ThemedText>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="message-circle" size={48} color={colors.primary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        Inicie a conversa
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Envie uma mensagem para {otherUser?.name || 'este usuario'}
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando mensagens...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          inverted={messages.length > 0}
        />

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.backgroundDefault, paddingBottom: insets.bottom + Spacing.sm },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={colors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              editable={!sending}
            />
          </View>
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim() ? colors.primary : colors.backgroundSecondary,
              },
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather
                name="send"
                size={20}
                color={messageText.trim() ? '#FFFFFF' : colors.textSecondary}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: Spacing.touchTarget,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myMessageBubble: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  messageTime: {
    fontSize: 11,
  },
  readIcon: {
    marginLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: Spacing.touchTarget,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Rubik_400Regular',
    padding: 0,
  },
  sendButton: {
    width: Spacing.touchTarget,
    height: Spacing.touchTarget,
    borderRadius: Spacing.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
