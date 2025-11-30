/**
 * LidaCacau - Interface de Serviço Social
 * 
 * Define o contrato para gerenciamento de amizades, chat e esquadrões.
 */

import { 
  FriendConnection, 
  ChatRoom, 
  DirectMessage, 
  UserPresence, 
  ActiveUsersStats,
  LidaSquad,
  SquadInvite,
  SquadProposal,
  AppNotification
} from '@/types';

export interface CreateSquadData {
  name: string;
  leaderId: string;
  serviceTypes?: string[];
  description?: string;
  memberIds?: string[];
}

export interface ISocialService {
  // Amizades
  getFriends(userId: string): Promise<FriendConnection[]>;
  getPendingFriendRequests(userId: string): Promise<FriendConnection[]>;
  sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendConnection>;
  acceptFriendRequest(connectionId: string): Promise<FriendConnection>;
  rejectFriendRequest(connectionId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  areFriends(userId1: string, userId2: string): Promise<boolean>;
  
  // Chat
  getChatRooms(userId: string): Promise<ChatRoom[]>;
  getChatRoomById(roomId: string): Promise<ChatRoom | null>;
  getOrCreateDirectChat(userId1: string, userId2: string): Promise<ChatRoom>;
  getMessages(roomId: string, limit?: number, before?: string): Promise<DirectMessage[]>;
  sendMessage(roomId: string, senderId: string, content: string): Promise<DirectMessage>;
  markAsRead(roomId: string, userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  
  // Presença
  updatePresence(userId: string): Promise<void>;
  getPresence(userId: string): Promise<UserPresence | null>;
  getActiveUsersStats(): Promise<ActiveUsersStats>;
  isUserOnline(userId: string, thresholdMinutes?: number): Promise<boolean>;
  
  // Esquadrões
  getSquads(userId?: string): Promise<LidaSquad[]>;
  getSquadById(squadId: string): Promise<LidaSquad | null>;
  createSquad(data: CreateSquadData): Promise<LidaSquad>;
  updateSquad(squadId: string, updates: Partial<LidaSquad>): Promise<LidaSquad | null>;
  disbandSquad(squadId: string): Promise<void>;
  
  // Convites de Esquadrão
  getSquadInvites(userId: string): Promise<SquadInvite[]>;
  sendSquadInvite(squadId: string, toUserId: string, fromUserId: string): Promise<SquadInvite>;
  acceptSquadInvite(inviteId: string): Promise<void>;
  rejectSquadInvite(inviteId: string): Promise<void>;
  
  // Propostas de Esquadrão
  getSquadProposals(userId: string): Promise<SquadProposal[]>;
  createSquadProposal(proposal: Omit<SquadProposal, 'id' | 'status' | 'createdAt'>): Promise<SquadProposal>;
  respondToProposal(proposalId: string, accept: boolean): Promise<void>;
  
  // Notificações
  getNotifications(userId: string): Promise<AppNotification[]>;
  createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}
