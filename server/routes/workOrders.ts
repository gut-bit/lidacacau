import { Router, Response } from 'express';
import { db } from '../db/drizzle';
import { workOrders, jobs, users, serviceTypes, reviews } from '../db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { workerId, producerId, status, view, jobId } = req.query;

        const conditions = [];

        // Filter by user role/relation
        if (workerId) {
            conditions.push(eq(workOrders.workerId, workerId as string));
        } else if (producerId) {
            conditions.push(eq(workOrders.producerId, producerId as string));
        } else {
            // Default: show orders where user is involved
            conditions.push(
                or(
                    eq(workOrders.workerId, userId),
                    eq(workOrders.producerId, userId)
                )
            );
        }

        if (status) {
            conditions.push(eq(workOrders.status, status as string));
        }

        if (jobId) {
            conditions.push(eq(workOrders.jobId, jobId as string));
        }

        let query = db
            .select({
                id: workOrders.id,
                jobId: workOrders.jobId,
                workerId: workOrders.workerId,
                producerId: workOrders.producerId,
                finalPrice: workOrders.finalPrice,
                status: workOrders.status,
                paymentTerms: workOrders.paymentTerms,
                negotiationHistory: workOrders.negotiationHistory,
                negotiationStatus: workOrders.negotiationStatus,
                signedContract: workOrders.signedContract,
                checkInTime: workOrders.checkInTime,
                checkInLatitude: workOrders.checkInLatitude,
                checkInLongitude: workOrders.checkInLongitude,
                checkOutTime: workOrders.checkOutTime,
                checkOutLatitude: workOrders.checkOutLatitude,
                checkOutLongitude: workOrders.checkOutLongitude,
                photoBefore: workOrders.photoBefore,
                photoAfter: workOrders.photoAfter,
                createdAt: workOrders.createdAt,
                // Job details
                jobQuantity: jobs.quantity,
                jobLocationText: jobs.locationText,
                // ServiceType details
                serviceTypeName: serviceTypes.name,
                serviceTypeIcon: serviceTypes.icon,
                // Producer details
                producerName: users.name,
            })
            .from(workOrders)
            .leftJoin(jobs, eq(workOrders.jobId, jobs.id))
            .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
            .leftJoin(users, eq(workOrders.producerId, users.id))
            .where(and(...conditions))
            .orderBy(desc(workOrders.createdAt));

        const orders = await query;

        // If 'details' view is requested (for WorkerHistory), fetch reviews and full relations
        if (view === 'details') {
            const detailedOrders = await Promise.all(orders.map(async (wo) => {
                // Fetch Job
                const [job] = await db.select().from(jobs).where(eq(jobs.id, wo.jobId)).limit(1);
                // Fetch ServiceType
                const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, job.serviceTypeId)).limit(1);
                // Fetch Worker
                const [worker] = await db.select().from(users).where(eq(users.id, wo.workerId)).limit(1);
                // Fetch Producer
                const [producer] = await db.select().from(users).where(eq(users.id, wo.producerId)).limit(1);
                // Fetch Reviews
                const woReviews = await db.select().from(reviews).where(eq(reviews.workOrderId, wo.id));
                const producerReview = woReviews.find(r => r.reviewerRole === 'producer');
                const workerReview = woReviews.find(r => r.reviewerRole === 'worker');

                return {
                    ...wo,
                    job,
                    serviceType,
                    worker,
                    producer,
                    producerReview,
                    workerReview
                };
            }));
            res.json({ workOrders: detailedOrders });
        } else {
            res.json({ workOrders: orders });
        }

    } catch (error) {
        console.error('[WorkOrders] List error:', error);
        res.status(500).json({ error: 'Erro ao listar ordens de servico' });
    }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        // Base WorkOrder
        const [wo] = await db
            .select()
            .from(workOrders)
            .where(eq(workOrders.id, id))
            .limit(1);

        if (!wo) {
            res.status(404).json({ error: 'Ordem de servico nao encontrada' });
            return;
        }

        // Related Data
        const [job] = await db.select().from(jobs).where(eq(jobs.id, wo.jobId)).limit(1);
        const [serviceType] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, job.serviceTypeId)).limit(1);
        const [worker] = await db.select().from(users).where(eq(users.id, wo.workerId)).limit(1);
        const [producer] = await db.select().from(users).where(eq(users.id, wo.producerId)).limit(1);

        // Reviews
        const woReviews = await db.select().from(reviews).where(eq(reviews.workOrderId, wo.id));

        const fullOrder = {
            ...wo,
            job,
            serviceType,
            worker,
            producer,
            producerReview: woReviews.find(r => r.reviewerRole === 'producer'),
            workerReview: woReviews.find(r => r.reviewerRole === 'worker'),
        };

        res.json(fullOrder);
    } catch (error) {
        console.error('[WorkOrders] Get error:', error);
        res.status(500).json({ error: 'Erro ao buscar ordem de servico' });
    }
});

router.post('/:id/check-in', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { latitude, longitude } = req.body;

        const [updated] = await db
            .update(workOrders)
            .set({
                status: 'checked_in',
                checkInTime: new Date(),
                checkInLatitude: latitude,
                checkInLongitude: longitude,
            })
            .where(eq(workOrders.id, id))
            .returning();

        res.json({ workOrder: updated });
    } catch (error) {
        console.error('[WorkOrders] Check-in error:', error);
        res.status(500).json({ error: 'Erro ao realizar check-in' });
    }
});

router.post('/:id/check-out', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { latitude, longitude, photoAfter, photoBefore } = req.body;

        const [updated] = await db
            .update(workOrders)
            .set({
                status: 'checked_out',
                checkOutTime: new Date(),
                checkOutLatitude: latitude,
                checkOutLongitude: longitude,
                photoAfter: photoAfter, // Assuming URL or base64 string
                photoBefore: photoBefore
            })
            .where(eq(workOrders.id, id))
            .returning();

        res.json({ workOrder: updated });
    } catch (error) {
        console.error('[WorkOrders] Check-out error:', error);
        res.status(500).json({ error: 'Erro ao realizar check-out' });
    }
});

router.post('/:id/sign', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { role } = req.body; // 'producer' or 'worker'

        const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
        if (!wo) {
            res.status(404).json({ error: 'Ordem nao encontrada' });
            return;
        }

        let contract = (wo.signedContract as any) || {};

        // If not created yet, initialize (Mock behavior replication)
        if (!contract.text) {
            // We would ideally regenerate details here, but for now assume basics
            contract = {
                id: crypto.randomUUID(), // Node 19+, or use uuid lib
                text: `CONTRATO BASE...`, // In real app, generate full text
                totalValue: wo.finalPrice,
                createdAt: new Date().toISOString()
            };
        }

        const now = new Date().toISOString();
        if (role === 'producer') {
            contract.producerSignedAt = now;
        } else {
            contract.workerSignedAt = now;
        }

        // Update DB
        const [updated] = await db
            .update(workOrders)
            .set({
                signedContract: contract,
                negotiationStatus: 'accepted' // Assuming signing implies acceptance
            })
            .where(eq(workOrders.id, id))
            .returning();

        res.json({ workOrder: updated, contract });
    } catch (error) {
        console.error('[WorkOrders] Sign error:', error);
        res.status(500).json({ error: 'Erro ao assinar contrato' });
    }
});

router.post('/:id/complete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        const [updated] = await db
            .update(workOrders)
            .set({ status: 'completed' })
            .where(eq(workOrders.id, id))
            .returning();

        res.json({ workOrder: updated });
    } catch (error) {
        console.error('[WorkOrders] Complete error:', error);
        res.status(500).json({ error: 'Erro ao completar ordem' });
    }
});

export default router;
