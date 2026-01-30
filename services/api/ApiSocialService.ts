import { ISocialService, FriendConnection, FriendWithUser, ChatRoom, DirectMessage, UserPresence, UserSearchFilters } from '@/services/interfaces/ISocialService';
import { ServiceResult } from '../common/types';
import { User } from '@/types'; // Adjust imports as needed
import { getApiAdapter } from '../common/ApiAdapter';

export class ApiSocialService implements ISocialService {
  private api = getApiAdapter();
  private baseUrl = '/social';

  async sendFriendRequest(requesterId: string, receiverId: string, message?: string): Promise<ServiceResult<FriendConnection>> {
    return this.api.post<FriendConnection>(`${this.baseUrl}/friends/request`, {
      receiverId,
      message
    });
  }

  async acceptFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    return this.api.post<FriendConnection>(`${this.baseUrl}/friends/${connectionId}/accept`);
  }

  async rejectFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>> {
    // Backend doesn't explicitly have "reject" endpoint yet, using Delete/Remove for now or implementation choice.
    // Looking at storage.ts, reject updates status. My backend implemented DELETE.
    // Let's use DELETE to remove/reject.
    return this.api.delete<any>(`${this.baseUrl}/friends/${connectionId}`);
  }

  async removeFriend(connectionId: string): Promise<ServiceResult<void>> {
    return this.api.delete<void>(`${this.baseUrl}/friends/${connectionId}`);
  }

  async getFriends(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    // Backend /friends returns list of connections with enriched friend data
    return this.api.get<FriendWithUser[]>(`${this.baseUrl}/friends`);
  }

  async getPendingRequests(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    return this.api.get<FriendWithUser[]>(`${this.baseUrl}/friends/pending`);
  }

  async getSentRequests(userId: string): Promise<ServiceResult<FriendWithUser[]>> {
    return this.api.get<FriendWithUser[]>(`${this.baseUrl}/friends/sent`);
  }

  async areFriends(userId1: string, userId2: string): Promise<ServiceResult<boolean>> {
    // This is a derived check, typically checking list of friends.
    // Or we could implement a specific endpoint check.
    // For now, let's fetch friends and check efficiently? No, that's heavy.
    // Let's rely on cached state or implement endpoint if needed.
    // Given the method signature, it's async.
    // TODO: Implement dedicated endpoint or optimized check.
    // Fallback: Fetch friends of userId1 (current user) and check userId2.
    const result = await this.getFriends(userId1);
    if (!result.success || !result.data) return { success: false, error: result.error };
    const isFriend = result.data.some(f =>
      (f.requesterId === userId1 && f.receiverId === userId2) ||
      (f.requesterId === userId2 && f.receiverId === userId1)
    );
    return { success: true, data: isFriend };
  }

  async getChatRooms(userId: string): Promise<ServiceResult<ChatRoom[]>> {
    return this.api.get<ChatRoom[]>(`${this.baseUrl}/chat/rooms`);
  }

  async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ServiceResult<ChatRoom>> {
    return this.api.post<ChatRoom>(`${this.baseUrl}/chat/rooms`, { targetUserId: userId2 });
  }

  async getMessages(roomId: string, limit?: number, beforeId?: string): Promise<ServiceResult<DirectMessage[]>> {
    let url = `${this.baseUrl}/chat/rooms/${roomId}/messages`;
    // Query params not implemented in backend yet, but prepared in interface
    return this.api.get<DirectMessage[]>(url);
  }

  async sendMessage(roomId: string, senderId: string, content: string): Promise<ServiceResult<DirectMessage>> {
    return this.api.post<DirectMessage>(`${this.baseUrl}/chat/rooms/${roomId}/messages`, {
      content,
      type: 'text'
    });
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<ServiceResult<void>> {
    return this.api.post<void>(`${this.baseUrl}/chat/rooms/${roomId}/read`);
  }

  // Presence & Search - Placeholder / Future Implementation
  async updatePresence(userId: string): Promise<ServiceResult<UserPresence>> {
    return { success: true, data: { userId, isOnline: true, lastSeenAt: new Date().toISOString() } };
  }

  async getPresence(userId: string): Promise<ServiceResult<UserPresence>> {
    return { success: true, data: { userId, isOnline: false, lastSeenAt: new Date().toISOString() } };
  }

  async getOnlineUsers(): Promise<ServiceResult<UserPresence[]>> {
    return { success: true, data: [] };
  }

  async searchUsers(filters: UserSearchFilters): Promise<ServiceResult<User[]>> {
    const params = new URLSearchParams();
    if (filters.query) params.append('search', filters.query);
    if (filters.limit) params.append('limit', filters.limit.toString());

    // Using the api adapter's get method which might not support query params object directly in all versions, 
    // but typically we append to url or pass config. 
    // Assuming ApiAdapter supports query string in URL.
    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    const result = await this.api.get<{ users: User[] }>(url);
    if (!result.success || !result.data) return { success: false, error: result.error };
    return { success: true, data: result.data.users };
  }

  async getUserProfile(userId: string): Promise<ServiceResult<User>> {
    const result = await this.api.get<{ user: User }>(`/users/${userId}`);
    if (!result.success || !result.data) return { success: false, error: result.error };
    return { success: true, data: result.data.user };
  }
}
