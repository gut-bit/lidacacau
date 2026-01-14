import { Router, Request, Response } from 'express';
import { db } from '../db/drizzle';
import { vicinais, roads, occurrences, petitions, signatures, fiscalizationAlerts, users } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { roadsKm140 } from '../data/roads-km140';

const router = Router();

router.get('/vicinais', async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(vicinais).orderBy(vicinais.nome);
    res.json(result);
  } catch (error) {
    console.error('[Community] Error fetching vicinais:', error);
    res.status(500).json({ error: 'Erro ao buscar vicinais' });
  }
});

router.post('/vicinais', async (req: Request, res: Response) => {
  try {
    const { nome, descricao, whatsappLink, facebookLink, instagramLink, latitude, longitude, cidade } = req.body;
    
    if (!nome || !latitude || !longitude) {
      res.status(400).json({ error: 'Nome, latitude e longitude sao obrigatorios' });
      return;
    }
    
    const [newVicinal] = await db.insert(vicinais).values({
      nome,
      descricao,
      whatsappLink,
      facebookLink,
      instagramLink,
      latitude,
      longitude,
      cidade: cidade || 'Uruara',
    }).returning();
    
    res.status(201).json(newVicinal);
  } catch (error) {
    console.error('[Community] Error creating vicinal:', error);
    res.status(500).json({ error: 'Erro ao criar vicinal' });
  }
});

router.get('/roads', async (_req: Request, res: Response) => {
  try {
    const dbRoads = await db.select().from(roads).orderBy(roads.nome);
    
    if (dbRoads.length === 0) {
      const staticRoads = roadsKm140.map(road => ({
        id: road.id,
        nome: road.name,
        classification: road.classification,
        coordinates: road.coordinates,
        color: road.color || '#2563eb',
        trafegabilidade: 'regular',
        createdAt: new Date().toISOString(),
      }));
      res.json(staticRoads);
      return;
    }
    
    res.json(dbRoads);
  } catch (error) {
    console.error('[Community] Error fetching roads:', error);
    const staticRoads = roadsKm140.map(road => ({
      id: road.id,
      nome: road.name,
      classification: road.classification,
      coordinates: road.coordinates,
      color: road.color || '#2563eb',
      trafegabilidade: 'regular',
      createdAt: new Date().toISOString(),
    }));
    res.json(staticRoads);
  }
});

router.post('/roads', async (req: Request, res: Response) => {
  try {
    const { nome, classification, coordinates, color, vicinalId, trafegabilidade, agriculturaPrincipal, comprimentoMetros, createdBy } = req.body;
    
    if (!nome || !coordinates) {
      res.status(400).json({ error: 'Nome e coordenadas sao obrigatorios' });
      return;
    }
    
    const [newRoad] = await db.insert(roads).values({
      nome,
      classification: classification || 'ramal',
      coordinates,
      color: color || '#2563eb',
      vicinalId,
      trafegabilidade: trafegabilidade || 'regular',
      agriculturaPrincipal,
      comprimentoMetros,
      createdBy,
    }).returning();
    
    res.status(201).json(newRoad);
  } catch (error) {
    console.error('[Community] Error creating road:', error);
    res.status(500).json({ error: 'Erro ao criar estrada' });
  }
});

router.get('/occurrences', async (req: Request, res: Response) => {
  try {
    const { status, tipo, vicinalId, limit = '50' } = req.query;
    
    let query = db
      .select({
        id: occurrences.id,
        titulo: occurrences.titulo,
        descricao: occurrences.descricao,
        tipo: occurrences.tipo,
        status: occurrences.status,
        latitude: occurrences.latitude,
        longitude: occurrences.longitude,
        fotos: occurrences.fotos,
        createdAt: occurrences.createdAt,
        userId: occurrences.userId,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(occurrences)
      .leftJoin(users, eq(occurrences.userId, users.id))
      .orderBy(desc(occurrences.createdAt))
      .limit(parseInt(limit as string));
    
    const result = await query;
    res.json(result);
  } catch (error) {
    console.error('[Community] Error fetching occurrences:', error);
    res.status(500).json({ error: 'Erro ao buscar ocorrencias' });
  }
});

router.post('/occurrences', async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, tipo, vicinalId, userId, roadId, latitude, longitude, fotos } = req.body;
    
    if (!titulo || !descricao || !tipo || !userId || !latitude || !longitude) {
      res.status(400).json({ error: 'Campos obrigatorios: titulo, descricao, tipo, userId, latitude, longitude' });
      return;
    }
    
    const [newOccurrence] = await db.insert(occurrences).values({
      titulo,
      descricao,
      tipo,
      status: 'open',
      vicinalId,
      userId,
      roadId,
      latitude,
      longitude,
      fotos: fotos || [],
    }).returning();
    
    res.status(201).json(newOccurrence);
  } catch (error) {
    console.error('[Community] Error creating occurrence:', error);
    res.status(500).json({ error: 'Erro ao criar ocorrencia' });
  }
});

router.patch('/occurrences/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolvedBy } = req.body;
    
    if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Status invalido. Use: open, in_progress ou resolved' });
      return;
    }
    
    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = resolvedBy;
    }
    
    const [updated] = await db
      .update(occurrences)
      .set(updateData)
      .where(eq(occurrences.id, id))
      .returning();
    
    if (!updated) {
      res.status(404).json({ error: 'Ocorrencia nao encontrada' });
      return;
    }
    
    res.json(updated);
  } catch (error) {
    console.error('[Community] Error updating occurrence:', error);
    res.status(500).json({ error: 'Erro ao atualizar ocorrencia' });
  }
});

router.get('/petitions', async (_req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        id: petitions.id,
        titulo: petitions.titulo,
        descricao: petitions.descricao,
        targetSignatures: petitions.targetSignatures,
        createdAt: petitions.createdAt,
        userId: petitions.userId,
        userName: users.name,
        signatureCount: sql<number>`(SELECT COUNT(*) FROM signatures WHERE signatures.petition_id = petitions.id)`,
      })
      .from(petitions)
      .leftJoin(users, eq(petitions.userId, users.id))
      .orderBy(desc(petitions.createdAt));
    
    res.json(result);
  } catch (error) {
    console.error('[Community] Error fetching petitions:', error);
    res.status(500).json({ error: 'Erro ao buscar peticoes' });
  }
});

router.post('/petitions', async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, occurrenceId, vicinalId, userId, fotos, targetSignatures } = req.body;
    
    if (!titulo || !descricao || !userId) {
      res.status(400).json({ error: 'Titulo, descricao e userId sao obrigatorios' });
      return;
    }
    
    const [newPetition] = await db.insert(petitions).values({
      titulo,
      descricao,
      occurrenceId,
      vicinalId,
      userId,
      fotos: fotos || [],
      targetSignatures: targetSignatures || 50,
    }).returning();
    
    res.status(201).json(newPetition);
  } catch (error) {
    console.error('[Community] Error creating petition:', error);
    res.status(500).json({ error: 'Erro ao criar peticao' });
  }
});

router.post('/petitions/:id/sign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'userId e obrigatorio' });
      return;
    }
    
    const existing = await db
      .select()
      .from(signatures)
      .where(and(eq(signatures.petitionId, id), eq(signatures.userId, userId)))
      .limit(1);
    
    if (existing.length > 0) {
      res.status(400).json({ error: 'Voce ja assinou esta peticao' });
      return;
    }
    
    const [newSignature] = await db.insert(signatures).values({
      petitionId: id,
      userId,
    }).returning();
    
    res.status(201).json(newSignature);
  } catch (error) {
    console.error('[Community] Error signing petition:', error);
    res.status(500).json({ error: 'Erro ao assinar peticao' });
  }
});

router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        id: fiscalizationAlerts.id,
        tipo: fiscalizationAlerts.tipo,
        descricao: fiscalizationAlerts.descricao,
        direcao: fiscalizationAlerts.direcao,
        veiculos: fiscalizationAlerts.veiculos,
        status: fiscalizationAlerts.status,
        latitude: fiscalizationAlerts.latitude,
        longitude: fiscalizationAlerts.longitude,
        expiresAt: fiscalizationAlerts.expiresAt,
        createdAt: fiscalizationAlerts.createdAt,
        userId: fiscalizationAlerts.userId,
        userName: users.name,
      })
      .from(fiscalizationAlerts)
      .leftJoin(users, eq(fiscalizationAlerts.userId, users.id))
      .where(eq(fiscalizationAlerts.status, 'active'))
      .orderBy(desc(fiscalizationAlerts.createdAt));
    
    res.json(result);
  } catch (error) {
    console.error('[Community] Error fetching alerts:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const { vicinalId, userId, tipo, descricao, direcao, veiculos, latitude, longitude, expiresInHours = 2 } = req.body;
    
    if (!userId || !tipo) {
      res.status(400).json({ error: 'userId e tipo sao obrigatorios' });
      return;
    }
    
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    
    const [newAlert] = await db.insert(fiscalizationAlerts).values({
      vicinalId,
      userId,
      tipo,
      descricao,
      direcao,
      veiculos,
      latitude,
      longitude,
      expiresAt,
      status: 'active',
    }).returning();
    
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('[Community] Error creating alert:', error);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

export default router;
