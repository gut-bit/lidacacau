import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { properties, talhoes, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createPropertySchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  address: z.string().min(1, 'Endereco obrigatorio'),
  city: z.string().default('Uruara'),
  state: z.string().default('PA'),
  areaHectares: z.number().optional(),
  latitude: z.number(),
  longitude: z.number(),
  polygonBoundary: z.any().optional(),
  coverPhotoUri: z.string().optional(),
});

const createTalhaoSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  areaHectares: z.number().positive(),
  cropType: z.enum(['cacau', 'cafe', 'banana', 'pasto', 'reserva', 'outro']),
  notes: z.string().optional(),
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const propertyList = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId))
      .orderBy(desc(properties.createdAt));

    res.json({ properties: propertyList });
  } catch (error) {
    console.error('[Properties] List error:', error);
    res.status(500).json({ error: 'Erro ao listar propriedades' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, id),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    const propertyTalhoes = await db
      .select()
      .from(talhoes)
      .where(eq(talhoes.propertyId, id))
      .orderBy(desc(talhoes.createdAt));

    res.json({ property, talhoes: propertyTalhoes });
  } catch (error) {
    console.error('[Properties] Get error:', error);
    res.status(500).json({ error: 'Erro ao buscar propriedade' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createPropertySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const userId = req.userId!;
    const data = result.data;

    const [newProperty] = await db
      .insert(properties)
      .values({
        ownerId: userId,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        areaHectares: data.areaHectares?.toString(),
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        polygonBoundary: data.polygonBoundary,
        coverPhotoUri: data.coverPhotoUri,
        verificationStatus: 'pending',
      })
      .returning();

    res.status(201).json({ property: newProperty });
  } catch (error) {
    console.error('[Properties] Create error:', error);
    res.status(500).json({ error: 'Erro ao criar propriedade' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, id),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    const allowedFields = ['name', 'address', 'city', 'state', 'areaHectares', 
      'latitude', 'longitude', 'polygonBoundary', 'coverPhotoUri'];
    
    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    filteredUpdates.updatedAt = new Date();

    const [updatedProperty] = await db
      .update(properties)
      .set(filteredUpdates)
      .where(eq(properties.id, id))
      .returning();

    res.json({ property: updatedProperty });
  } catch (error) {
    console.error('[Properties] Update error:', error);
    res.status(500).json({ error: 'Erro ao atualizar propriedade' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, id),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    await db.delete(properties).where(eq(properties.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('[Properties] Delete error:', error);
    res.status(500).json({ error: 'Erro ao deletar propriedade' });
  }
});

router.get('/:propertyId/talhoes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    const talhoesList = await db
      .select()
      .from(talhoes)
      .where(eq(talhoes.propertyId, propertyId))
      .orderBy(desc(talhoes.createdAt));

    res.json({ talhoes: talhoesList });
  } catch (error) {
    console.error('[Properties] List talhoes error:', error);
    res.status(500).json({ error: 'Erro ao listar talhoes' });
  }
});

router.post('/:propertyId/talhoes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    const result = createTalhaoSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    const data = result.data;

    const [newTalhao] = await db
      .insert(talhoes)
      .values({
        propertyId,
        name: data.name,
        areaHectares: data.areaHectares.toString(),
        cropType: data.cropType,
        notes: data.notes,
      })
      .returning();

    res.status(201).json({ talhao: newTalhao });
  } catch (error) {
    console.error('[Properties] Create talhao error:', error);
    res.status(500).json({ error: 'Erro ao criar talhao' });
  }
});

router.delete('/:propertyId/talhoes/:talhaoId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId, talhaoId } = req.params;
    const userId = req.userId!;

    const [property] = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId),
        eq(properties.ownerId, userId)
      ))
      .limit(1);

    if (!property) {
      res.status(404).json({ error: 'Propriedade nao encontrada' });
      return;
    }

    await db.delete(talhoes).where(eq(talhoes.id, talhaoId));

    res.json({ success: true });
  } catch (error) {
    console.error('[Properties] Delete talhao error:', error);
    res.status(500).json({ error: 'Erro ao deletar talhao' });
  }
});

export default router;
