import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { friendConnections, chatRooms, directMessages, userPresence, users, notifications } from '../db/schema';
import { eq, and, or, desc, sql, arrayContains } from 'drizzle-orm';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/friends', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const connections = await db
      .select({
        id: friendConnections.id,
        requesterId: friendConnections.requesterId,
        receiverId: friendConnections.receiverId,
        status: friendConnections.status,
        message: friendConnections.message,
        createdAt: friendConnections.createdAt,
        acceptedAt: friendConnections.acceptedAt,
      })
      .from(friendConnections)
      .where(
        and(
          or(
            eq(friendConnections.requesterId, userId),
            eq(friendConnections.receiverId, userId)
          ),
          eq(friendConnections.status, 'accepted')
        )
      );

    const friendIds = connections.map(c => 
      c.requesterId === userId ? c.receiverId : c.requesterId
    );

    if (friendIds.length === 0) {
      res.json({ friends: [] });
      return;
    }

    const friends = await db
      .select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        location: users.location,
        level: users.level,
        activeRole: users.activeRole,
      })
      .from(users)
      .where(sql`${users.id} = ANY(${friendIds})`);

    res.json({ friends });
  } catch (error) {
    console.error('[Social] Friends list error:', error);
    res.status(500).json({ error: 'Erro ao listar amigos' });
  }
});

router.get('/friends/requests', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const requests = await db
      .select({
        id: friendConnections.id,
        requesterId: friendConnections.requesterId,
        message: friendConnections.message,
        createdAt: friendConnections.createdAt,
        requesterName: users.name,
        requesterAvatar: users.avatar,
      })
      .from(friendConnections)
      .leftJoin(users, eq(friendConnections.requesterId, users.id))
      .where(
        and(
          eq(friendConnections.receiverId, userId),
          eq(friendConnections.status, 'pending')
        )
      )
      .orderBy(desc(friendConnections.createdAt));

    res.json({ requests });
  } catch (error) {
    console.error('[Social] Friend requests error:', error);
    res.status(500).json({ error: 'Erro ao listar solicitacoes' });
  }
});

router.post('/friends/request', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { receiverId, message } = req.body;

    if (userId === receiverId) {
      res.status(400).json({ error: 'Voce nao pode adicionar a si mesmo' });
      return;
    }

    const [existing] = await db
      .select()
      .from(friendConnections)
      .where(
        or(
          and(
            eq(friendConnections.requesterId, userId),
            eq(friendConnections.receiverId, receiverId)
          ),
          and(
            eq(friendConnections.requesterId, receiverId),
            eq(friendConnections.receiverId, userId)
          )
        )
      )
      .limit(1);

    if (existing) {
      res.status(400).json({ error: 'Ja existe uma conexao com este usuario' });
      return;
    }

    const [connection] = await db
      .insert(friendConnections)
      .values({
        requesterId: userId,
        receiverId,
        message,
        status: 'pending',
      })
      .returning();

    const requester = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db.insert(notifications).values({
      userId: receiverId,
      type: 'friend_request',
      title: 'Nova solicitacao de amizade',
      message: `${requester[0]?.name || 'Alguem'} quer ser seu amigo!`,
      data: { connectionId: connection.id, requesterId: userId },
    });

    res.status(201).json({ connection });
  } catch (error) {
    console.error('[Social] Friend request error:', error);
    res.status(500).json({ error: 'Erro ao enviar solicitacao' });
  }
});

router.post('/friends/:connectionId/accept', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.userId!;

    const [connection] = await db
      .select()
      .from(friendConnections)
      .where(
        and(
          eq(friendConnections.id, connectionId),
          eq(friendConnections.receiverId, userId),
          eq(friendConnections.status, 'pending')
        )
      )
      .limit(1);

    if (!connection) {
      res.status(404).json({ error: 'Solicitacao nao encontrada' });
      return;
    }

    await db
      .update(friendConnections)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(friendConnections.id, connectionId));

    res.json({ success: true });
  } catch (error) {
    console.error('[Social] Accept friend error:', error);
    res.status(500).json({ error: 'Erro ao aceitar solicitacao' });
  }
});

router.post('/friends/:connectionId/reject', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.userId!;

    await db
      .update(friendConnections)
      .set({ status: 'rejected' })
      .where(
        and(
          eq(friendConnections.id, connectionId),
          eq(friendConnections.receiverId, userId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('[Social] Reject friend error:', error);
    res.status(500).json({ error: 'Erro ao rejeitar solicitacao' });
  }
});

router.get('/chats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const rooms = await db
      .select()
      .from(chatRooms)
      .where(sql`${userId} = ANY(${chatRooms.participantIds})`)
      .orderBy(desc(chatRooms.lastMessageAt));

    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const otherParticipantId = room.participantIds.find(id => id !== userId);
        if (!otherParticipantId) return { ...room, otherParticipant: null };

        const [otherUser] = await db
          .select({
            id: users.id,
            name: users.name,
            avatar: users.avatar,
          })
          .from(users)
          .where(eq(users.id, otherParticipantId))
          .limit(1);

        return { ...room, otherParticipant: otherUser };
      })
    );

    res.json({ chats: roomsWithParticipants });
  } catch (error) {
    console.error('[Social] Chats list error:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

router.get('/chats/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId!;
    const { limit = '50', before } = req.query;

    const [room] = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.id, roomId),
          sql`${userId} = ANY(${chatRooms.participantIds})`
        )
      )
      .limit(1);

    if (!room) {
      res.status(404).json({ error: 'Conversa nao encontrada' });
      return;
    }

    let query = db
      .select({
        id: directMessages.id,
        senderId: directMessages.senderId,
        content: directMessages.content,
        readAt: directMessages.readAt,
        createdAt: directMessages.createdAt,
        senderName: users.name,
        senderAvatar: users.avatar,
      })
      .from(directMessages)
      .leftJoin(users, eq(directMessages.senderId, users.id))
      .where(eq(directMessages.roomId, roomId))
      .orderBy(desc(directMessages.createdAt))
      .limit(parseInt(limit as string));

    const messages = await query;

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('[Social] Messages error:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

router.post('/chats/:roomId/messages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId!;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Mensagem vazia' });
      return;
    }

    const [room] = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.id, roomId),
          sql`${userId} = ANY(${chatRooms.participantIds})`
        )
      )
      .limit(1);

    if (!room) {
      res.status(404).json({ error: 'Conversa nao encontrada' });
      return;
    }

    const [message] = await db
      .insert(directMessages)
      .values({
        roomId,
        senderId: userId,
        content: content.trim(),
      })
      .returning();

    await db
      .update(chatRooms)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: content.trim().substring(0, 100),
      })
      .where(eq(chatRooms.id, roomId));

    res.status(201).json({ message });
  } catch (error) {
    console.error('[Social] Send message error:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.post('/chats/start', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { participantId } = req.body;

    if (userId === participantId) {
      res.status(400).json({ error: 'Voce nao pode conversar consigo mesmo' });
      return;
    }

    const existingRooms = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          sql`${userId} = ANY(${chatRooms.participantIds})`,
          sql`${participantId} = ANY(${chatRooms.participantIds})`
        )
      )
      .limit(1);

    if (existingRooms.length > 0) {
      res.json({ chat: existingRooms[0] });
      return;
    }

    const [newRoom] = await db
      .insert(chatRooms)
      .values({
        participantIds: [userId, participantId],
      })
      .returning();

    res.status(201).json({ chat: newRoom });
  } catch (error) {
    console.error('[Social] Start chat error:', error);
    res.status(500).json({ error: 'Erro ao iniciar conversa' });
  }
});

router.get('/notifications', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { limit = '50', unreadOnly } = req.query;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(parseInt(limit as string));

    const notificationList = await query;

    res.json({ notifications: notificationList });
  } catch (error) {
    console.error('[Social] Notifications error:', error);
    res.status(500).json({ error: 'Erro ao buscar notificacoes' });
  }
});

router.post('/notifications/:id/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('[Social] Mark read error:', error);
    res.status(500).json({ error: 'Erro ao marcar notificacao' });
  }
});

router.post('/presence/heartbeat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await db
      .insert(userPresence)
      .values({ userId, isOnline: true, lastSeenAt: new Date() })
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: { isOnline: true, lastSeenAt: new Date() },
      });

    res.json({ success: true });
  } catch (error) {
    console.error('[Social] Heartbeat error:', error);
    res.status(500).json({ error: 'Erro ao atualizar presenca' });
  }
});

export default router;
