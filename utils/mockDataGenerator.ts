import {
    createUser, createJob, createBid, acceptBid, updateJob, createWorkOrder
} from './storage';
import { User, Job, ServiceType, LIDA_PHRASES } from '@/types';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { VILA_ALVORADA_KM140 } from '@/types';

// Helper to get random coordinates around a center point
const getRandomLocation = (center: { latitude: number; longitude: number }, radiusKm: number = 5) => {
    const r = radiusKm / 111.32; // Convert km to degrees roughly
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    return {
        latitude: center.latitude + x,
        longitude: center.longitude + y
    };
};

export const seedMockData = async () => {
    console.log('Starting seed...');

    // 1. Create Producers
    const producer1 = await createUser({
        name: 'João do Cacau',
        email: 'joao@teste.com',
        password: '123',
        role: 'producer',
        activeRole: 'producer',
        roles: ['producer'],
        phone: '(93) 99123-4567',
        location: 'Km 140 - Faixa',
    });

    const producer2 = await createUser({
        name: 'Maria da Roça',
        email: 'maria@teste.com',
        password: '123',
        role: 'producer',
        activeRole: 'producer',
        roles: ['producer'],
        phone: '(93) 99765-4321',
        location: 'Km 135 - Sul',
    });

    // 2. Create Workers
    const worker1 = await createUser({
        name: 'Pedro Podador',
        email: 'pedro@teste.com',
        password: '123',
        role: 'worker',
        activeRole: 'worker',
        roles: ['worker'],
        phone: '(93) 99888-7777',
        location: 'Vila Alvorada',
        level: 3,
    });

    const worker2 = await createUser({
        name: 'Ana Colheitadeira',
        email: 'ana@teste.com',
        password: '123',
        role: 'worker',
        activeRole: 'worker',
        roles: ['worker'],
        phone: '(93) 99666-5555',
        location: 'Uruará Centro',
        level: 2,
    });

    // 3. Create Jobs
    const serviceTypes = SERVICE_TYPES;

    // Job 1: Pruning (Open)
    const loc1 = getRandomLocation(VILA_ALVORADA_KM140);
    await createJob({
        producerId: producer1.id,
        serviceTypeId: 'pruning_cacao_maintenance',
        notes: 'Preciso de poda em 500 pés de cacau clonado.',
        quantity: 500,
        offer: 1500,
        locationText: 'Fazenda Esperança - Km 140',
        latitude: loc1.latitude,
        longitude: loc1.longitude,
    });

    // Job 2: Harvest (Open)
    const loc2 = getRandomLocation(VILA_ALVORADA_KM140);
    await createJob({
        producerId: producer2.id,
        serviceTypeId: 'harvest_cacao_full',
        notes: 'Colheita e quebra. Pagamento por diária.',
        quantity: 5,
        offer: 150, // per day/unit
        locationText: 'Sítio Alegria - Km 135',
        latitude: loc2.latitude,
        longitude: loc2.longitude,
    });

    // Job 3: Cleaning (Assigned)
    const loc3 = getRandomLocation(VILA_ALVORADA_KM140);
    const job3 = await createJob({
        producerId: producer1.id,
        serviceTypeId: 'cleaning_pasture_manual',
        notes: 'Roço manual de pasto.',
        quantity: 2, // hectares
        offer: 800,
        locationText: 'Fazenda Esperança',
        latitude: loc3.latitude,
        longitude: loc3.longitude,
    });

    // 4. Create Bids & Work Order for Job 3
    const bid = await createBid({
        jobId: job3.id,
        workerId: worker1.id,
        price: 800,
        message: 'Tenho disponibilidade imediata.',
    });

    await acceptBid(bid.id);

    console.log('Seed complete!');
};
