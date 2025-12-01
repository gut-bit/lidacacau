import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { jobs, bids, users, serviceTypes, workOrders } from '../db/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { authMiddleware, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const createJobSchema = z.object({
  serviceTypeId: z.string().uuid(),
  quantity: z.number().int().positive(),
  locationText: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  offer: z.number().positive(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const createBidSchema = z.object({
  price: z.number().positive(),
  message: z.string().optional(),
  proposedTerms: z.record(z.string(), z.any()).optional(),
});

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status = 'open', producerId, limit = '20', offset = '0' } = req.query;

    const conditions = [];
    
    if (status) {
      conditions.push(eq(jobs.status, status as string));
    }
    
    if (producerId && typeof producerId === 'string') {
      conditions.push(eq(jobs.producerId, producerId));
    }

    const jobList = await db
      .select({
        id: jobs.id,
        producerId: jobs.producerId,
        serviceTypeId: jobs.serviceTypeId,
        quantity: jobs.quantity,
        locationText: jobs.locationText,
        latitude: jobs.latitude,
        longitude: jobs.longitude,
        startDate: jobs.startDate,
        endDate: jobs.endDate,
        offer: jobs.offer,
        notes: jobs.notes,
        photos: jobs.photos,
        status: jobs.status,
        createdAt: jobs.createdAt,
        producerName: users.name,
        producerAvatar: users.avatar,
        serviceTypeName: serviceTypes.name,
        serviceTypeIcon: serviceTypes.icon,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.producerId, users.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({ jobs: jobList });
  } catch (error) {
    console.error('[Jobs] List error:', error);
    res.status(500).json({ error: 'Erro ao listar demandas' });
  }
});

router.get('/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { role } = req.query;

    let jobList;
    if (role === 'producer') {
      jobList = await db
        .select()
        .from(jobs)
        .where(eq(jobs.producerId, userId))
        .orderBy(desc(jobs.createdAt));
    } else {
      const myBids = await db
        .select({ jobId: bids.jobId })
        .from(bids)
        .where(eq(bids.workerId, userId));

      const jobIds = myBids.map(b => b.jobId);
      if (jobIds.length === 0) {
        res.json({ jobs: [] });
        return;
      }

      jobList = await db
        .select()
        .from(jobs)
        .where(sql`${jobs.id} = ANY(${jobIds})`);
    }

    res.json({ jobs: jobList });
  } catch (error) {
    console.error('[Jobs] My jobs error:', error);
    res.status(500).json({ error: 'Erro ao listar suas demandas' });
  }
});

router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [job] = await db
      .select({
        id: jobs.id,
        producerId: jobs.producerId,
        serviceTypeId: jobs.serviceTypeId,
        quantity: jobs.quantity,
        locationText: jobs.locationText,
        latitude: jobs.latitude,
        longitude: jobs.longitude,
        startDate: jobs.startDate,
        endDate: jobs.endDate,
        offer: jobs.offer,
        notes: jobs.notes,
        photos: jobs.photos,
        status: jobs.status,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        producerName: users.name,
        producerAvatar: users.avatar,
        producerLevel: users.producerLevel,
        serviceTypeName: serviceTypes.name,
        serviceTypeIcon: serviceTypes.icon,
        serviceTypeUnit: serviceTypes.unit,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.producerId, users.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) {
      res.status(404).json({ error: 'Demanda nao encontrada' });
      return;
    }

    const jobBids = await db
      .select({
        id: bids.id,
        workerId: bids.workerId,
        price: bids.price,
        message: bids.message,
        status: bids.status,
        createdAt: bids.createdAt,
        workerName: users.name,
        workerAvatar: users.avatar,
        workerLevel: users.level,
      })
      .from(bids)
      .leftJoin(users, eq(bids.workerId, users.id))
      .where(eq(bids.jobId, id))
      .orderBy(desc(bids.createdAt));

    res.json({ job, bids: jobBids });
  } catch (error) {
    console.error('[Jobs] Get job error:', error);
    res.status(500).json({ error: 'Erro ao buscar demanda' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = createJobSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const userId = req.userId!;
    const data = result.data;

    const [newJob] = await db
      .insert(jobs)
      .values({
        producerId: userId,
        serviceTypeId: data.serviceTypeId,
        quantity: data.quantity,
        locationText: data.locationText,
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        offer: data.offer.toString(),
        notes: data.notes,
        photos: data.photos,
        status: 'open',
      })
      .returning();

    res.status(201).json({ job: newJob });
  } catch (error) {
    console.error('[Jobs] Create error:', error);
    res.status(500).json({ error: 'Erro ao criar demanda' });
  }
});

router.post('/:id/bids', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = createBidSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }

    const userId = req.userId!;
    const data = result.data;

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) {
      res.status(404).json({ error: 'Demanda nao encontrada' });
      return;
    }

    if (job.status !== 'open') {
      res.status(400).json({ error: 'Esta demanda nao esta aberta para propostas' });
      return;
    }

    if (job.producerId === userId) {
      res.status(400).json({ error: 'Voce nao pode enviar proposta para sua propria demanda' });
      return;
    }

    const [existingBid] = await db
      .select()
      .from(bids)
      .where(and(
        eq(bids.jobId, id),
        eq(bids.workerId, userId)
      ))
      .limit(1);

    if (existingBid) {
      res.status(400).json({ error: 'Voce ja enviou uma proposta para esta demanda' });
      return;
    }

    const [newBid] = await db
      .insert(bids)
      .values({
        jobId: id,
        workerId: userId,
        price: data.price.toString(),
        message: data.message,
        proposedTerms: data.proposedTerms,
        status: 'pending',
      })
      .returning();

    res.status(201).json({ bid: newBid });
  } catch (error) {
    console.error('[Jobs] Create bid error:', error);
    res.status(500).json({ error: 'Erro ao enviar proposta' });
  }
});

router.post('/:jobId/bids/:bidId/accept', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId, bidId } = req.params;
    const userId = req.userId!;

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      res.status(404).json({ error: 'Demanda nao encontrada' });
      return;
    }

    if (job.producerId !== userId) {
      res.status(403).json({ error: 'Apenas o produtor pode aceitar propostas' });
      return;
    }

    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!bid) {
      res.status(404).json({ error: 'Proposta nao encontrada' });
      return;
    }

    await db
      .update(bids)
      .set({ status: 'accepted' })
      .where(eq(bids.id, bidId));

    await db
      .update(bids)
      .set({ status: 'rejected' })
      .where(and(
        eq(bids.jobId, jobId),
        sql`${bids.id} != ${bidId}`
      ));

    await db
      .update(jobs)
      .set({ status: 'assigned', updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    const [workOrder] = await db
      .insert(workOrders)
      .values({
        jobId,
        workerId: bid.workerId,
        producerId: userId,
        finalPrice: bid.price,
        status: 'assigned',
      })
      .returning();

    res.json({ success: true, workOrder });
  } catch (error) {
    console.error('[Jobs] Accept bid error:', error);
    res.status(500).json({ error: 'Erro ao aceitar proposta' });
  }
});

router.get('/bids/worker', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const workerBids = await db
      .select({
        id: bids.id,
        jobId: bids.jobId,
        workerId: bids.workerId,
        price: bids.price,
        message: bids.message,
        status: bids.status,
        proposedTerms: bids.proposedTerms,
        createdAt: bids.createdAt,
        jobTitle: serviceTypes.name,
        jobLocation: jobs.locationText,
        producerName: users.name,
      })
      .from(bids)
      .leftJoin(jobs, eq(bids.jobId, jobs.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(users, eq(jobs.producerId, users.id))
      .where(eq(bids.workerId, userId))
      .orderBy(desc(bids.createdAt));

    res.json({ bids: workerBids });
  } catch (error) {
    console.error('[Jobs] Worker bids error:', error);
    res.status(500).json({ error: 'Erro ao listar propostas' });
  }
});

router.get('/service-types/list', async (_req, res: Response) => {
  try {
    const types = await db.select().from(serviceTypes);
    res.json({ serviceTypes: types });
  } catch (error) {
    console.error('[Jobs] Service types error:', error);
    res.status(500).json({ error: 'Erro ao listar tipos de servico' });
  }
});

export default router;
