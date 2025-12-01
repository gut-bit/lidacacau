import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/drizzle';
import { users, sessions, userProfiles, userVerification, userPresence } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['producer', 'worker']),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('[Auth] Login attempt started');
    
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      console.log('[Auth] Validation failed:', result.error.issues[0].message);
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const { email, password } = result.data;
    console.log('[Auth] Looking up user:', email.toLowerCase());

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      console.log('[Auth] User not found');
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }
    console.log('[Auth] User found:', user.id);

    console.log('[Auth] Password hash exists:', !!user.passwordHash);
    console.log('[Auth] Password hash length:', user.passwordHash?.length || 0);
    console.log('[Auth] Hash prefix:', user.passwordHash?.substring(0, 7) || 'none');
    
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('[Auth] bcrypt.compare result:', isValidPassword);
    } catch (bcryptError: any) {
      console.error('[Auth] bcrypt.compare error:', bcryptError.message);
      res.status(500).json({ 
        error: `Erro na validacao de senha: ${bcryptError.message}`,
        hashPrefix: user.passwordHash?.substring(0, 10)
      });
      return;
    }
    
    if (!isValidPassword) {
      console.log('[Auth] Invalid password');
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }
    console.log('[Auth] Password valid');

    const token = generateToken(user.id);
    console.log('[Auth] Token generated');
    
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log('[Auth] Creating session...');
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });
    console.log('[Auth] Session created');

    console.log('[Auth] Updating user presence...');
    await db
      .insert(userPresence)
      .values({ userId: user.id, isOnline: true, lastSeenAt: new Date() })
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: { isOnline: true, lastSeenAt: new Date() },
      });
    console.log('[Auth] User presence updated');

    const { passwordHash, ...userWithoutPassword } = user;

    console.log('[Auth] Login successful for:', user.email);
    res.json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error.message);
    console.error('[Auth] Error stack:', error.stack);
    res.status(500).json({ 
      error: `Erro ao fazer login: ${error.message}`,
      errorType: error.name || 'UnknownError',
      errorStack: error.stack?.split('\n').slice(0, 3).join(' | ')
    });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const { name, email, password, role, phone, location, bio } = result.data;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      res.status(400).json({ error: 'Este email ja esta cadastrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        activeRole: role,
        roles: [role],
        phone,
        location,
      })
      .returning();

    await db.insert(userProfiles).values({
      userId: newUser.id,
      profileType: role,
      bio,
    });

    await db.insert(userVerification).values({
      userId: newUser.id,
      status: 'none',
    });

    await db.insert(userPresence).values({
      userId: newUser.id,
      isOnline: true,
      lastSeenAt: new Date(),
    });

    const token = generateToken(newUser.id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    if (req.userId) {
      await db
        .update(userPresence)
        .set({ isOnline: false, lastSeenAt: new Date() })
        .where(eq(userPresence.userId, req.userId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario nao autenticado' });
      return;
    }

    const { passwordHash, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('[Auth] Get me error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuario' });
  }
});

router.get('/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ 
    valid: true, 
    userId: req.userId 
  });
});

export default router;
