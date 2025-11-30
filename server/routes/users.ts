import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { users, userProfiles, userVerification, userPresence } from '../db/schema';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { authMiddleware, optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, verified, search, limit = '20', offset = '0' } = req.query;

    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      location: users.location,
      role: users.role,
      activeRole: users.activeRole,
      avatar: users.avatar,
      level: users.level,
      producerLevel: users.producerLevel,
      totalReviews: users.totalReviews,
      averageRating: users.averageRating,
      createdAt: users.createdAt,
    }).from(users);

    const conditions = [];

    if (role && typeof role === 'string') {
      conditions.push(eq(users.activeRole, role));
    }

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.location, `%${search}%`)
        )
      );
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        location: users.location,
        role: users.role,
        activeRole: users.activeRole,
        avatar: users.avatar,
        level: users.level,
        producerLevel: users.producerLevel,
        totalReviews: users.totalReviews,
        averageRating: users.averageRating,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ users: userList });
  } catch (error) {
    console.error('[Users] List error:', error);
    res.status(500).json({ error: 'Erro ao listar usuarios' });
  }
});

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        location: users.location,
        role: users.role,
        activeRole: users.activeRole,
        roles: users.roles,
        avatar: users.avatar,
        coverPhoto: users.coverPhoto,
        level: users.level,
        producerLevel: users.producerLevel,
        totalReviews: users.totalReviews,
        averageRating: users.averageRating,
        producerReviews: users.producerReviews,
        producerRating: users.producerRating,
        tutorialCompleted: users.tutorialCompleted,
        searchRadius: users.searchRadius,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, id))
      .limit(1);

    const [verification] = await db
      .select()
      .from(userVerification)
      .where(eq(userVerification.userId, id))
      .limit(1);

    const [presence] = await db
      .select()
      .from(userPresence)
      .where(eq(userPresence.userId, id))
      .limit(1);

    res.json({
      user: {
        ...user,
        profile,
        verification: verification || { status: 'none' },
        isOnline: presence?.isOnline || false,
        lastSeenAt: presence?.lastSeenAt,
      },
    });
  } catch (error) {
    console.error('[Users] Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const updates = req.body;

    const allowedFields = [
      'name', 'phone', 'location', 'avatar', 'coverPhoto',
      'tutorialCompleted', 'searchRadius', 'activeRole'
    ];

    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      res.status(400).json({ error: 'Nenhum campo valido para atualizar' });
      return;
    }

    filteredUpdates.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(filteredUpdates)
      .where(eq(users.id, userId))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('[Users] Update error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuario' });
  }
});

router.patch('/me/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { profileType, ...updates } = req.body;

    const type = profileType || req.user?.activeRole || 'worker';

    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(and(
        eq(userProfiles.userId, userId),
        eq(userProfiles.profileType, type)
      ))
      .limit(1);

    let profile;
    if (existingProfile) {
      [profile] = await db
        .update(userProfiles)
        .set(updates)
        .where(eq(userProfiles.id, existingProfile.id))
        .returning();
    } else {
      [profile] = await db
        .insert(userProfiles)
        .values({ userId, profileType: type, ...updates })
        .returning();
    }

    res.json({ profile });
  } catch (error) {
    console.error('[Users] Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.post('/me/switch-role', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { role } = req.body;

    if (!['producer', 'worker'].includes(role)) {
      res.status(400).json({ error: 'Role invalido' });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'Usuario nao encontrado' });
      return;
    }

    const currentRoles = user.roles || [];
    const newRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];

    const [updatedUser] = await db
      .update(users)
      .set({ activeRole: role, roles: newRoles, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(and(
        eq(userProfiles.userId, userId),
        eq(userProfiles.profileType, role)
      ))
      .limit(1);

    if (!existingProfile) {
      await db.insert(userProfiles).values({
        userId,
        profileType: role,
      });
    }

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('[Users] Switch role error:', error);
    res.status(500).json({ error: 'Erro ao trocar perfil' });
  }
});

export default router;
