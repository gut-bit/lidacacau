import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/drizzle';
import { cocoaPriceSubmissions, cocoaPriceMetrics, users } from '../db/schema';
import { eq, desc, gte, and, sql } from 'drizzle-orm';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

const SUPPORTED_CITIES = [
  'Uruara', 'Medicilândia', 'Altamira', 'Brasil Novo', 
  'Vitoria do Xingu', 'Placas', 'Ruropolis'
] as const;

const submitPriceSchema = z.object({
  buyerName: z.string().min(2, 'Nome do comprador deve ter pelo menos 2 caracteres'),
  city: z.string().min(2, 'Cidade obrigatoria'),
  pricePerKg: z.number().min(0.01, 'Preco deve ser maior que zero').max(1000, 'Preco invalido'),
  conditions: z.string().optional(),
  proofPhotoUri: z.string().optional(),
  submitterName: z.string().optional(),
  submitterPhone: z.string().optional(),
});

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { city, limit = '50', status = 'approved' } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = db
      .select({
        id: cocoaPriceSubmissions.id,
        buyerName: cocoaPriceSubmissions.buyerName,
        city: cocoaPriceSubmissions.city,
        region: cocoaPriceSubmissions.region,
        pricePerKg: cocoaPriceSubmissions.pricePerKg,
        conditions: cocoaPriceSubmissions.conditions,
        proofPhotoUri: cocoaPriceSubmissions.proofPhotoUri,
        source: cocoaPriceSubmissions.source,
        submitterName: cocoaPriceSubmissions.submitterName,
        status: cocoaPriceSubmissions.status,
        createdAt: cocoaPriceSubmissions.createdAt,
      })
      .from(cocoaPriceSubmissions)
      .where(
        city && city !== 'all'
          ? and(
              eq(cocoaPriceSubmissions.status, status as string),
              eq(cocoaPriceSubmissions.city, city as string),
              gte(cocoaPriceSubmissions.createdAt, sevenDaysAgo)
            )
          : and(
              eq(cocoaPriceSubmissions.status, status as string),
              gte(cocoaPriceSubmissions.createdAt, sevenDaysAgo)
            )
      )
      .orderBy(desc(cocoaPriceSubmissions.createdAt))
      .limit(limitNum);

    const prices = await query;

    res.json({
      success: true,
      data: prices,
      count: prices.length,
    });
  } catch (error) {
    console.error('[CacauPrecos] Error fetching prices:', error);
    res.status(500).json({ error: 'Erro ao buscar precos' });
  }
});

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await db
      .select({
        city: cocoaPriceSubmissions.city,
        avgPrice: sql<string>`ROUND(AVG(${cocoaPriceSubmissions.pricePerKg}), 2)`,
        minPrice: sql<string>`MIN(${cocoaPriceSubmissions.pricePerKg})`,
        maxPrice: sql<string>`MAX(${cocoaPriceSubmissions.pricePerKg})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(cocoaPriceSubmissions)
      .where(
        and(
          eq(cocoaPriceSubmissions.status, 'approved'),
          gte(cocoaPriceSubmissions.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(cocoaPriceSubmissions.city);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMetrics = await db
      .select({
        city: cocoaPriceSubmissions.city,
        avgPrice: sql<string>`ROUND(AVG(${cocoaPriceSubmissions.pricePerKg}), 2)`,
      })
      .from(cocoaPriceSubmissions)
      .where(
        and(
          eq(cocoaPriceSubmissions.status, 'approved'),
          gte(cocoaPriceSubmissions.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(cocoaPriceSubmissions.city);

    const bestPrice = await db
      .select()
      .from(cocoaPriceSubmissions)
      .where(
        and(
          eq(cocoaPriceSubmissions.status, 'approved'),
          gte(cocoaPriceSubmissions.createdAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(cocoaPriceSubmissions.pricePerKg))
      .limit(1);

    res.json({
      success: true,
      data: {
        thirtyDays: metrics,
        sevenDays: recentMetrics,
        bestPrice: bestPrice[0] || null,
        cities: SUPPORTED_CITIES,
      },
    });
  } catch (error) {
    console.error('[CacauPrecos] Error fetching metrics:', error);
    res.status(500).json({ error: 'Erro ao buscar metricas' });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const result = submitPriceSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const { buyerName, city, pricePerKg, conditions, proofPhotoUri, submitterName, submitterPhone } = result.data;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    const [submission] = await db
      .insert(cocoaPriceSubmissions)
      .values({
        buyerName,
        city,
        region: 'Para',
        pricePerKg: pricePerKg.toString(),
        conditions: conditions || null,
        proofPhotoUri: proofPhotoUri || null,
        source: 'lidacacau',
        submittedBy: userId || null,
        submitterName: submitterName || (authReq.user?.name) || null,
        submitterPhone: submitterPhone || null,
        status: userId ? 'approved' : 'pending',
      })
      .returning();

    console.log('[CacauPrecos] New price submitted:', {
      id: submission.id,
      buyer: buyerName,
      city,
      price: pricePerKg,
      userId: userId || 'anonymous',
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: userId 
        ? 'Preco registrado com sucesso!' 
        : 'Preco enviado para aprovacao. Obrigado!',
    });
  } catch (error) {
    console.error('[CacauPrecos] Error submitting price:', error);
    res.status(500).json({ error: 'Erro ao registrar preco' });
  }
});

router.get('/my-submissions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const submissions = await db
      .select()
      .from(cocoaPriceSubmissions)
      .where(eq(cocoaPriceSubmissions.submittedBy, userId))
      .orderBy(desc(cocoaPriceSubmissions.createdAt))
      .limit(50);

    res.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('[CacauPrecos] Error fetching user submissions:', error);
    res.status(500).json({ error: 'Erro ao buscar seus envios' });
  }
});

router.patch('/:id/moderate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Status invalido' });
      return;
    }

    const [updated] = await db
      .update(cocoaPriceSubmissions)
      .set({
        status,
        verifiedAt: status === 'approved' ? new Date() : null,
        verifiedBy: status === 'approved' ? authReq.user!.id : null,
        updatedAt: new Date(),
      })
      .where(eq(cocoaPriceSubmissions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Preco nao encontrado' });
      return;
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[CacauPrecos] Error moderating price:', error);
    res.status(500).json({ error: 'Erro ao moderar preco' });
  }
});

export default router;
