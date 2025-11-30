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
import { getApiAdapter } from '../common/ApiAdapter';
import { ServiceResult, createSuccess, createError } from '../common/types';

interface FriendsResponse {
  friends: FriendWithUser[];
}

interface ConnectionResponse {
  connection: FriendConnection;
}

interface ChatsResponse {
  chats: ChatRoom[];
}

interface ChatResponse {
  chat: ChatRoom;
}

interface MessagesResponse {
  messages: DirectMessage[];
}

interface MessageResponse {
  message: DirectMessage;
}

interface PresenceResponse {
  presence: UserPresence;
}

interface OnlineUsersResponse {
  users: UserPresence[];
}

interface UsersResponse {
  users: User[];
}

export class ApiSocialService implements ISocialService {
  private api = getApiAdapter();

  async sendFriendRequest(requesterId: string, receiverId: string, message?: string): Promise<ServiceResult<FriendConnection>> {
    const result = await this.api.post<ConnectionResponse>('/social/friends/request', { 
      requesterId, 
      receiverId, 
      message 
    });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao enviar solicitação de amizade', result.code);
    }

    return createSuccess(result.data.connection);
  }

  async acceptFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    const result = await this.api.post<ConnectionResponse>(`/social/friends/${connectionId}/accept`);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao aceitar solicitação', result.code);
    }

    return createSuccess(result.data.connection);
  }

  async rejectFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    const result = await this.api.post<ConnectionResponse>(`/social/friends/${connectionId}/reject`);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao rejeitar solicitação', result.code);
    }

    return createSuccess(result.data.connection);
  }

  async removeFriend(connectionId: string): Promise<ServiceResult<void>> {
    const result = await this.api.delete(`/social/friends/${connectionId}`);
    
    if (!result.success) {
      return createError(result.error || 'Erro ao remover amigo', result.code);
    }

    return createSuccess(undefined);
  }

  async getFriends(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    const result = await this.api.get<FriendsResponse>('/social/friends', { userId });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar amigos', result.code);
    }

    return createSuccess(result.data.friends);
  }

  async getPendingRequests(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    const result = await this.api.get<FriendsResponse>('/social/friends/requests', { userId });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar solicitações pendentes', result.code);
    }

    return createSuccess(result.data.friends);
  }

  async areFriends(userId1: string, userId2: string): Promise<ServiceResult<boolean>> {
    const result = await this.api.get<{ areFriends: boolean }>('/social/friends/check', { userId1, userId2 });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao verificar amizade', result.code);
    }

    return createSuccess(result.data.areFriends);
  }

  async getChatRooms(userId: string): Promise<ServiceResult<ChatRoom[]>> {
    const result = await this.api.get<ChatsResponse>('/social/chats', { userId });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar conversas', result.code);
    }

    return createSuccess(result.data.chats);
  }

  async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ServiceResult<ChatRoom>> {
    const result = await this.api.post<ChatResponse>('/social/chats/start', { userId1, userId2 });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao criar conversa', result.code);
    }

    return createSuccess(result.data.chat);
  }

  async getMessages(roomId: string, limit?: number, beforeId?: string): Promise<ServiceResult<DirectMessage[]>> {
    const params: Record<string, any> = {};
    if (limit) params.limit = limit;
    if (beforeId) params.beforeId = beforeId;

    const result = await this.api.get<MessagesResponse>(`/social/chats/${roomId}/messages`, params);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar mensagens', result.code);
    }

    return createSuccess(result.data.messages);
  }

  async sendMessage(roomId: string, senderId: string, content: string): Promise<ServiceResult<DirectMessage>> {
    const result = await this.api.post<MessageResponse>(`/social/chats/${roomId}/messages`, { senderId, content });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao enviar mensagem', result.code);
    }

    return createSuccess(result.data.message);
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<ServiceResult<void>> {
    const result = await this.api.post(`/social/chats/${roomId}/read`, { userId });
    
    if (!result.success) {
      return createError(result.error || 'Erro ao marcar mensagens como lidas', result.code);
    }

    return createSuccess(undefined);
  }

  async updatePresence(userId: string): Promise<ServiceResult<UserPresence>> {
    const result = await this.api.post<PresenceResponse>('/social/presence/heartbeat', { userId });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao atualizar presença', result.code);
    }

    return createSuccess(result.data.presence);
  }

  async getPresence(userId: string): Promise<ServiceResult<UserPresence>> {
    const result = await this.api.get<PresenceResponse>(`/social/presence/${userId}`);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar presença', result.code);
    }

    return createSuccess(result.data.presence);
  }

  async getOnlineUsers(): Promise<ServiceResult<UserPresence[]>> {
    const result = await this.api.get<OnlineUsersResponse>('/social/presence/online');
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar usuários online', result.code);
    }

    return createSuccess(result.data.users);
  }

  async searchUsers(filters: UserSearchFilters): Promise<ServiceResult<User[]>> {
    const params: Record<string, any> = {};
    if (filters.query) params.query = filters.query;
    if (filters.role) params.role = filters.role;
    if (filters.verified !== undefined) params.verified = filters.verified;
    if (filters.online !== undefined) params.online = filters.online;
    if (filters.page) params.page = filters.page;
    if (filters.pageSize) params.pageSize = filters.pageSize;

    const result = await this.api.get<UsersResponse>('/social/users/search', params);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar usuários', result.code);
    }

    return createSuccess(result.data.users);
  }
}
