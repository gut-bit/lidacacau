/**
 * LidaCacau - Mock Social Service
 * 
 * Implementação mock usando AsyncStorage para funcionalidades sociais.
 */

import { User } from '@/types';
import { 
  ISocialService,
  FriendConnection,
  FriendWithUser,
  ChatRoom,
  DirectMessage,
  UserPresence,
  UserSearchFilters
} from '../interfaces/ISocialService';
import { ServiceResult, createSuccess, createError } from '../common/types';
import storageAdapter, { StorageKeys } from '../common/AsyncStorageAdapter';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export class MockSocialService implements ISocialService {
  private getMessagesKey(roomId: string): string {
    return `${StorageKeys.CHAT_ROOMS}_messages_${roomId}`;
  }

  async sendFriendRequest(requesterId: string, receiverId: string, message?: string): Promise<ServiceResult<FriendConnection>> {
    try {
      const existing = await storageAdapter.getList<FriendConnection>(StorageKeys.FRIENDS);
      const alreadyExists = existing.find(
        f => (f.requesterId === requesterId && f.receiverId === receiverId) ||
             (f.requesterId === receiverId && f.receiverId === requesterId)
      );

      if (alreadyExists) {
        return createError('Ja existe uma conexao com este usuario');
      }

      const connection: FriendConnection = {
        id: storageAdapter.generateId(),
        requesterId,
        receiverId,
        status: 'pending',
        message,
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(StorageKeys.FRIENDS, connection);
      return createSuccess(connection);
    } catch (error) {
      return createError('Erro ao enviar solicitacao');
    }
  }

  async acceptFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    try {
      const updated = await storageAdapter.updateInList<FriendConnection>(StorageKeys.FRIENDS, connectionId, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      if (!updated) {
        return createError('Solicitacao nao encontrada', 'NOT_FOUND');
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao aceitar solicitacao');
    }
  }

  async rejectFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    try {
      const updated = await storageAdapter.updateInList<FriendConnection>(StorageKeys.FRIENDS, connectionId, {
        status: 'rejected',
      });

      if (!updated) {
        return createError('Solicitacao nao encontrada', 'NOT_FOUND');
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao rejeitar solicitacao');
    }
  }

  async removeFriend(connectionId: string): Promise<ServiceResult<void>> {
    try {
      await storageAdapter.removeFromList<FriendConnection>(StorageKeys.FRIENDS, connectionId);
      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao remover amigo');
    }
  }

  async getFriends(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    try {
      const connections = await storageAdapter.getList<FriendConnection>(StorageKeys.FRIENDS);
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);

      const friendConnections = connections.filter(
        c => c.status === 'accepted' && (c.requesterId === userId || c.receiverId === userId)
      );

      const friendsWithUser = friendConnections.map(connection => {
        const friendId = connection.requesterId === userId ? connection.receiverId : connection.requesterId;
        const friend = users.find(u => u.id === friendId);
        return {
          ...connection,
          friend: friend!,
        };
      }).filter(f => f.friend);

      return createSuccess(friendsWithUser);
    } catch (error) {
      return createError('Erro ao buscar amigos');
    }
  }

  async getPendingRequests(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    try {
      const connections = await storageAdapter.getList<FriendConnection>(StorageKeys.FRIENDS);
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);

      const pending = connections.filter(
        c => c.status === 'pending' && c.receiverId === userId
      );

      const pendingWithUser = pending.map(connection => {
        const friend = users.find(u => u.id === connection.requesterId);
        return {
          ...connection,
          friend: friend!,
        };
      }).filter(f => f.friend);

      return createSuccess(pendingWithUser);
    } catch (error) {
      return createError('Erro ao buscar solicitacoes pendentes');
    }
  }

  async areFriends(userId1: string, userId2: string): Promise<ServiceResult<boolean>> {
    try {
      const connections = await storageAdapter.getList<FriendConnection>(StorageKeys.FRIENDS);
      const areFriends = connections.some(
        c => c.status === 'accepted' &&
             ((c.requesterId === userId1 && c.receiverId === userId2) ||
              (c.requesterId === userId2 && c.receiverId === userId1))
      );
      return createSuccess(areFriends);
    } catch (error) {
      return createError('Erro ao verificar amizade');
    }
  }

  async getChatRooms(userId: string): Promise<ServiceResult<ChatRoom[]>> {
    try {
      const rooms = await storageAdapter.getList<ChatRoom>(StorageKeys.CHAT_ROOMS);
      const userRooms = rooms.filter(r => r.participantIds.includes(userId));
      userRooms.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
      return createSuccess(userRooms);
    } catch (error) {
      return createError('Erro ao buscar conversas');
    }
  }

  async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ServiceResult<ChatRoom>> {
    try {
      const rooms = await storageAdapter.getList<ChatRoom>(StorageKeys.CHAT_ROOMS);
      const existingRoom = rooms.find(
        r => r.participantIds.includes(userId1) && r.participantIds.includes(userId2)
      );

      if (existingRoom) {
        return createSuccess(existingRoom);
      }

      const newRoom: ChatRoom = {
        id: storageAdapter.generateId(),
        participantIds: [userId1, userId2],
        unreadCount: { [userId1]: 0, [userId2]: 0 },
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(StorageKeys.CHAT_ROOMS, newRoom);
      return createSuccess(newRoom);
    } catch (error) {
      return createError('Erro ao criar conversa');
    }
  }

  async getMessages(roomId: string, limit: number = 50, beforeId?: string): Promise<ServiceResult<DirectMessage[]>> {
    try {
      let messages = await storageAdapter.getList<DirectMessage>(this.getMessagesKey(roomId));
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (beforeId) {
        const index = messages.findIndex(m => m.id === beforeId);
        if (index > 0) {
          messages = messages.slice(Math.max(0, index - limit), index);
        }
      } else {
        messages = messages.slice(-limit);
      }

      return createSuccess(messages);
    } catch (error) {
      return createError('Erro ao buscar mensagens');
    }
  }

  async sendMessage(roomId: string, senderId: string, content: string): Promise<ServiceResult<DirectMessage>> {
    try {
      const message: DirectMessage = {
        id: storageAdapter.generateId(),
        roomId,
        senderId,
        content,
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(this.getMessagesKey(roomId), message);

      const rooms = await storageAdapter.getList<ChatRoom>(StorageKeys.CHAT_ROOMS);
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        const newUnreadCount = { ...room.unreadCount };
        room.participantIds.forEach(pid => {
          if (pid !== senderId) {
            newUnreadCount[pid] = (newUnreadCount[pid] || 0) + 1;
          }
        });

        await storageAdapter.updateInList<ChatRoom>(StorageKeys.CHAT_ROOMS, roomId, {
          lastMessageAt: message.createdAt,
          lastMessagePreview: content.substring(0, 100),
          unreadCount: newUnreadCount,
        });
      }

      return createSuccess(message);
    } catch (error) {
      return createError('Erro ao enviar mensagem');
    }
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const rooms = await storageAdapter.getList<ChatRoom>(StorageKeys.CHAT_ROOMS);
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        const newUnreadCount = { ...room.unreadCount, [userId]: 0 };
        await storageAdapter.updateInList<ChatRoom>(StorageKeys.CHAT_ROOMS, roomId, {
          unreadCount: newUnreadCount,
        });
      }
      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao marcar mensagens como lidas');
    }
  }

  async updatePresence(userId: string): Promise<ServiceResult<UserPresence>> {
    try {
      type StoredPresence = UserPresence & { id: string };
      const presenceList = await storageAdapter.getList<StoredPresence>(StorageKeys.PRESENCE);
      const existing = presenceList.find(p => p.userId === userId);
      const now = new Date().toISOString();

      const presence: UserPresence = {
        userId,
        isOnline: true,
        lastSeenAt: now,
      };

      if (existing) {
        await storageAdapter.updateInList<StoredPresence>(StorageKeys.PRESENCE, userId, { ...presence, id: userId });
      } else {
        await storageAdapter.addToList(StorageKeys.PRESENCE, { ...presence, id: userId });
      }

      return createSuccess(presence);
    } catch (error) {
      return createError('Erro ao atualizar presenca');
    }
  }

  async getPresence(userId: string): Promise<ServiceResult<UserPresence>> {
    try {
      const presenceList = await storageAdapter.getList<UserPresence & { id: string }>(StorageKeys.PRESENCE);
      const presence = presenceList.find(p => p.userId === userId);

      if (!presence) {
        return createSuccess({
          userId,
          isOnline: false,
          lastSeenAt: new Date().toISOString(),
        });
      }

      const isOnline = Date.now() - new Date(presence.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
      return createSuccess({ ...presence, isOnline });
    } catch (error) {
      return createError('Erro ao buscar presenca');
    }
  }

  async getOnlineUsers(): Promise<ServiceResult<UserPresence[]>> {
    try {
      const presenceList = await storageAdapter.getList<UserPresence>(StorageKeys.PRESENCE);
      const now = Date.now();
      const onlineUsers = presenceList.filter(
        p => now - new Date(p.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
      );
      return createSuccess(onlineUsers);
    } catch (error) {
      return createError('Erro ao buscar usuarios online');
    }
  }

  async searchUsers(filters: UserSearchFilters): Promise<ServiceResult<User[]>> {
    try {
      let users = await storageAdapter.getList<User>(StorageKeys.USERS);

      if (filters.query) {
        const query = filters.query.toLowerCase();
        users = users.filter(u => 
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }

      if (filters.role) {
        users = users.filter(u => u.activeRole === filters.role || u.roles?.includes(filters.role!));
      }

      if (filters.verified !== undefined) {
        users = users.filter(u => 
          filters.verified 
            ? u.verification?.status === 'approved'
            : !u.verification || u.verification.status !== 'approved'
        );
      }

      if (filters.online !== undefined) {
        const presenceList = await storageAdapter.getList<UserPresence>(StorageKeys.PRESENCE);
        const now = Date.now();
        const onlineUserIds = presenceList
          .filter(p => now - new Date(p.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS)
          .map(p => p.userId);

        users = users.filter(u => 
          filters.online ? onlineUserIds.includes(u.id) : !onlineUserIds.includes(u.id)
        );
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      users = users.slice(start, start + pageSize);

      return createSuccess(users);
    } catch (error) {
      return createError('Erro ao buscar usuarios');
    }
  }
}

export const mockSocialService = new MockSocialService();
