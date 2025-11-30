/**
 * LidaCacau - Interface de Serviço Social
 * 
 * Define o contrato para operações de amizades, chat e presença.
 */

import { User } from '@/types';
import { ServiceResult, ListFilters } from '../common/types';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: FriendshipStatus;
  message?: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendWithUser extends FriendConnection {
  friend: User;
}

export interface ChatRoom {
  id: string;
  participantIds: string[];
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: Record<string, number>;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface UserSearchFilters extends ListFilters {
  query?: string;
  role?: 'producer' | 'worker';
  verified?: boolean;
  online?: boolean;
}

export interface ISocialService {
  sendFriendRequest(requesterId: string, receiverId: string, message?: string): Promise<ServiceResult<FriendConnection>>;
  
  acceptFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>>;
  
  rejectFriendRequest(connectionId: string): Promise<ServiceResult<FriendConnection>>;
  
  removeFriend(connectionId: string): Promise<ServiceResult<void>>;
  
  getFriends(userId: string): Promise<ServiceResult<FriendWithUser[]>>;
  
  getPendingRequests(userId: string): Promise<ServiceResult<FriendWithUser[]>>;
  
  areFriends(userId1: string, userId2: string): Promise<ServiceResult<boolean>>;
  
  getChatRooms(userId: string): Promise<ServiceResult<ChatRoom[]>>;
  
  getOrCreateChatRoom(userId1: string, userId2: string): Promise<ServiceResult<ChatRoom>>;
  
  getMessages(roomId: string, limit?: number, beforeId?: string): Promise<ServiceResult<DirectMessage[]>>;
  
  sendMessage(roomId: string, senderId: string, content: string): Promise<ServiceResult<DirectMessage>>;
  
  markMessagesAsRead(roomId: string, userId: string): Promise<ServiceResult<void>>;
  
  updatePresence(userId: string): Promise<ServiceResult<UserPresence>>;
  
  getPresence(userId: string): Promise<ServiceResult<UserPresence>>;
  
  getOnlineUsers(): Promise<ServiceResult<UserPresence[]>>;
  
  searchUsers(filters: UserSearchFilters): Promise<ServiceResult<User[]>>;
}
