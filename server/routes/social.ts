import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { friendConnections, chatRooms, directMessages, users } from '../db/schema';
import { eq, and, or, desc, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// ==========================================
// FRIENDS / CONNECTIONS
// ==========================================

// Get all friends (accepted connections)
router.get('/friends', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find accepted connections where user is requester OR receiver
    const connections = await db
      .select({
        connection: friendConnections,
        friend: users,
      })
      .from(friendConnections)
      .leftJoin(users, or(
        and(eq(friendConnections.requesterId, userId), eq(users.id, friendConnections.receiverId)),
        and(eq(friendConnections.receiverId, userId), eq(users.id, friendConnections.requesterId))
      ))
      .where(and(
        or(eq(friendConnections.requesterId, userId), eq(friendConnections.receiverId, userId)),
        eq(friendConnections.status, 'accepted')
      ));

    // Transform to FriendWithUser format
    const formatted = connections.map(c => {
      if (!c.friend) return null;
      // Exclude sensitive data
      const { passwordHash, ...safeFriend } = c.friend;
      return {
        ...c.connection,
        friend: safeFriend
      };
    }).filter(Boolean);

    res.json(formatted);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ error: 'Erro ao buscar amigos' });
  }
});

// Get Pending Requests (Received)
router.get('/friends/pending', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find requests where user is RECEIVER and status is pending
    const requests = await db
      .select({
        connection: friendConnections,
        friend: users,
      })
      .from(friendConnections)
      .leftJoin(users, eq(friendConnections.requesterId, users.id))
      .where(and(
        eq(friendConnections.receiverId, userId),
        eq(friendConnections.status, 'pending')
      ));

    const formatted = requests.map(c => {
      if (!c.friend) return null;
      const { passwordHash, ...safeFriend } = c.friend;
      return {
        ...c.connection,
        friend: safeFriend
      };
    }).filter(Boolean);

    res.json(formatted);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitacoes' });
  }
});

// Get Sent Requests
router.get('/friends/sent', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find requests where user is REQUESTER and status is pending
    const requests = await db
      .select({
        connection: friendConnections,
        friend: users,
      })
      .from(friendConnections)
      .leftJoin(users, eq(friendConnections.receiverId, users.id))
      .where(and(
        eq(friendConnections.requesterId, userId),
        eq(friendConnections.status, 'pending')
      ));

    const formatted = requests.map(c => {
      if (!c.friend) return null;
      const { passwordHash, ...safeFriend } = c.friend;
      return {
        ...c.connection,
        friend: safeFriend
      };
    }).filter(Boolean);

    res.json(formatted);
  } catch (error) {
    console.error('Error getting sent requests:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitacoes enviadas' });
  }
});

// Send Friend Request
router.post('/friends/request', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      res.status(400).json({ error: 'ID do destinatario obrigatorio' });
      return;
    }

    if (requesterId === receiverId) {
      res.status(400).json({ error: 'Nao pode adicionar a si mesmo' });
      return;
    }

    // Check existing connection
    const [existing] = await db
      .select()
      .from(friendConnections)
      .where(or(
        and(eq(friendConnections.requesterId, requesterId), eq(friendConnections.receiverId, receiverId)),
        and(eq(friendConnections.requesterId, receiverId), eq(friendConnections.receiverId, requesterId))
      ))
      .limit(1);

    if (existing) {
      if (existing.status === 'accepted') {
        res.status(400).json({ error: 'Voces ja sao amigos' });
        return;
      }
      if (existing.status === 'pending') {
        res.status(400).json({ error: 'Ja existe um pedido pendente' });
        return;
      }
      // If rejected, allow new request (implementation choice, or block)
    }

    const [newConnection] = await db.insert(friendConnections).values({
      requesterId,
      receiverId,
      status: 'pending',
      message
    }).returning();

    res.json(newConnection);
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Erro ao enviar pedido de amizade' });
  }
});

// Accept Request
router.post('/friends/:id/accept', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Current user must be the receiver
    const id = req.params.id as string;

    const [connection] = await db
      .select()
      .from(friendConnections)
      .where(eq(friendConnections.id, id))
      .limit(1);

    if (!connection) {
      res.status(404).json({ error: 'Pedido nao encontrado' });
      return;
    }

    if (connection.receiverId !== userId) {
      res.status(403).json({ error: 'Nao autorizado' });
      return;
    }

    const [updated] = await db
      .update(friendConnections)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(friendConnections.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Erro ao aceitar pedido' });
  }
});

// Remove Friend or Reject
router.delete('/friends/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    // Allow deletion if user is either requester or receiver
    const [deleted] = await db
      .delete(friendConnections)
      .where(and(
        eq(friendConnections.id, id),
        or(eq(friendConnections.requesterId, userId), eq(friendConnections.receiverId, userId))
      ))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Conexao nao encontrada ou nao autorizada' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Erro ao remover amigo' });
  }
});

// ==========================================
// CHAT
// ==========================================

// Get User's Chat Rooms
router.get('/chat/rooms', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find rooms where user is listed in participant_ids (array)
    // Drizzle specific array contains check logic might vary by driver,
    // using raw SQL filter for array containment if strictly typed query is complex
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(sql`${userId} = ANY(${chatRooms.participantIds})`)
      .orderBy(desc(chatRooms.lastMessageAt));

    res.json(rooms); // Client expects ChatRoom[]
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

// Get or Create Room for 1:1 chat
router.post('/chat/rooms', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'Usuario alvo necessario' });
      return;
    }

    // Check if room exists with exactly these 2 participants
    // This query assumes 1:1 chat logic mostly.
    // We look for a room containing both IDs.
    const [existing] = await db
      .select()
      .from(chatRooms)
      .where(and(
        sql`${userId} = ANY(${chatRooms.participantIds})`,
        sql`${targetUserId} = ANY(${chatRooms.participantIds})`
      ))
      .limit(1);

    if (existing) {
      res.json(existing);
      return;
    }

    // Create new
    const [newRoom] = await db.insert(chatRooms).values({
      participantIds: [userId, targetUserId],
      // unreadCount default is null/empty in schema? storage uses object.
      // Keeping it simple for DB schema compatibility.
    }).returning();

    res.json(newRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

// Get Messages for a Room
router.get('/chat/rooms/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    // Optional: Verify user participant access to room

    const msgs = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.roomId, roomId))
      .orderBy(sql`${directMessages.createdAt} ASC`); // Oldest first usually for chat history

    res.json(msgs);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Send Message
router.post('/chat/rooms/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const roomId = req.params.roomId as string;
    const { content, type = 'text' } = req.body;

    const [msg] = await db.insert(directMessages).values({
      roomId,
      senderId,
      content,
      readAt: null // unread
    }).returning();

    // Update Room last message info
    await db.update(chatRooms)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 50) // Store preview
      })
      .where(eq(chatRooms.id, roomId));

    res.json(msg);

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Mark Messages as Read
router.post('/chat/rooms/:roomId/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const roomId = req.params.roomId as string;

    // Mark all messages in room sent by OTHERS as read
    await db
      .update(directMessages)
      .set({ readAt: new Date() })
      .where(and(
        eq(directMessages.roomId, roomId),
        ne(directMessages.senderId, userId),
        sql`${directMessages.readAt} IS NULL`
      ));

    // Note: keeping unreadCount consistent might require separate table or calculation
    // For now, client logic usually refreshes simple view

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
});

export default router;
