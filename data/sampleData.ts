import { User, Job, WorkOrder, Review, MapActivity, VILA_ALVORADA_KM140 } from '@/types';

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

export const SAMPLE_PRODUCERS: User[] = [
  {
    id: 'producer-1',
    email: 'jose.silva@fazenda.com',
    password: 'senha123',
    name: 'Jose Carlos Silva',
    phone: '(93) 99999-1111',
    location: 'Km 45, Transamazonica',
    role: 'producer',
    roles: ['producer'],
    activeRole: 'producer',
    producerLevel: 3,
    producerReviews: 8,
    producerRating: 4.5,
    properties: [
      { id: 'prop-1', name: 'Fazenda Boa Esperanca', address: 'Km 45, Transamazonica', latitude: -3.7, longitude: -53.8 },
    ],
    tutorialCompleted: true,
    searchRadius: 50,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'producer-2',
    email: 'maria.santos@fazenda.com',
    password: 'senha123',
    name: 'Maria Aparecida Santos',
    phone: '(93) 99999-2222',
    location: 'Vicinal 12, Uruara',
    role: 'producer',
    roles: ['producer', 'worker'],
    activeRole: 'producer',
    level: 2,
    producerLevel: 4,
    totalReviews: 5,
    averageRating: 4.0,
    producerReviews: 12,
    producerRating: 4.7,
    properties: [
      { id: 'prop-2', name: 'Sitio Santa Maria', address: 'Vicinal 12, Uruara', latitude: -3.65, longitude: -53.75 },
    ],
    tutorialCompleted: true,
    searchRadius: 75,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'producer-3',
    email: 'antonio.ferreira@fazenda.com',
    password: 'senha123',
    name: 'Antonio Ferreira Lima',
    phone: '(93) 99999-3333',
    location: 'Ramal do Cacau, Km 8',
    role: 'producer',
    roles: ['producer'],
    activeRole: 'producer',
    producerLevel: 2,
    producerReviews: 4,
    producerRating: 4.2,
    properties: [
      { id: 'prop-3', name: 'Chacara do Sol', address: 'Ramal do Cacau, Km 8', latitude: -3.72, longitude: -53.82 },
    ],
    tutorialCompleted: true,
    searchRadius: 25,
    createdAt: threeDaysAgo.toISOString(),
  },
];

export const SAMPLE_WORKERS: User[] = [
  {
    id: 'worker-1',
    email: 'pedro.oliveira@email.com',
    password: 'senha123',
    name: 'Pedro Oliveira',
    phone: '(93) 98888-1111',
    location: 'Vila Alvorada, Km 140',
    role: 'worker',
    roles: ['worker'],
    activeRole: 'worker',
    level: 4,
    totalReviews: 18,
    averageRating: 4.6,
    tutorialCompleted: true,
    searchRadius: 100,
    badges: [
      { id: 'reliable', name: 'Confiavel', description: 'Completou 5 trabalhos sem cancelamento', icon: 'shield', color: '#3B82F6', requirement: '', earnedAt: oneDayAgo.toISOString() },
      { id: 'expert', name: 'Especialista', description: 'Alcancou nivel N4', icon: 'zap', color: '#8B5CF6', requirement: '', earnedAt: twoDaysAgo.toISOString() },
    ],
    workerProfile: {
      bio: 'Trabalhador experiente em cacau ha 10 anos',
      skills: ['poda', 'colheita', 'rocagem'],
      availability: 'Segunda a Sabado',
      totalJobs: 18,
      totalEarnings: 8500,
    },
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-2',
    email: 'joao.mendes@email.com',
    password: 'senha123',
    name: 'Joao Batista Mendes',
    phone: '(93) 98888-2222',
    location: 'Centro, Uruara',
    role: 'worker',
    roles: ['worker'],
    activeRole: 'worker',
    level: 3,
    totalReviews: 12,
    averageRating: 4.2,
    tutorialCompleted: true,
    searchRadius: 50,
    badges: [
      { id: 'first_job', name: 'Primeiro Trabalho', description: 'Completou seu primeiro trabalho', icon: 'award', color: '#22C55E', requirement: '', earnedAt: threeDaysAgo.toISOString() },
    ],
    workerProfile: {
      bio: 'Especialista em aplicacao de defensivos',
      skills: ['aplicacao', 'rocagem'],
      equipment: ['Pulverizador costal', 'EPI completo'],
      availability: 'Todos os dias',
      totalJobs: 12,
      totalEarnings: 5200,
    },
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-3',
    email: 'carlos.souza@email.com',
    password: 'senha123',
    name: 'Carlos Eduardo Souza',
    phone: '(93) 98888-3333',
    location: 'Km 135, Transamazonica',
    role: 'worker',
    roles: ['worker', 'producer'],
    activeRole: 'worker',
    level: 5,
    producerLevel: 1,
    totalReviews: 28,
    averageRating: 4.8,
    tutorialCompleted: true,
    searchRadius: 100,
    badges: [
      { id: 'master', name: 'Mestre do Cacau', description: 'Alcancou nivel N5', icon: 'sun', color: '#FFB800', requirement: '', earnedAt: oneDayAgo.toISOString() },
      { id: 'five_stars', name: 'Cinco Estrelas', description: 'Recebeu avaliacao de 5 estrelas', icon: 'star', color: '#FFB800', requirement: '', earnedAt: twoDaysAgo.toISOString() },
    ],
    workerProfile: {
      bio: 'Mestre cacaueiro com 15 anos de experiencia',
      skills: ['poda', 'enxertia', 'colheita', 'rocagem', 'aplicacao'],
      certifications: ['Curso de Enxertia - CEPLAC'],
      availability: 'Sob demanda',
      totalJobs: 28,
      totalEarnings: 15800,
    },
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-4',
    email: 'lucas.costa@email.com',
    password: 'senha123',
    name: 'Lucas da Costa',
    phone: '(93) 98888-4444',
    location: 'Vila Alvorada',
    role: 'worker',
    roles: ['worker'],
    activeRole: 'worker',
    level: 2,
    totalReviews: 7,
    averageRating: 3.9,
    tutorialCompleted: true,
    searchRadius: 50,
    workerProfile: {
      bio: 'Trabalhador dedicado',
      skills: ['rocagem', 'colheita'],
      availability: 'Segunda a Sexta',
      totalJobs: 7,
      totalEarnings: 2800,
    },
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-5',
    email: 'francisco.lima@email.com',
    password: 'senha123',
    name: 'Francisco Lima Junior',
    role: 'worker',
    roles: ['worker'],
    activeRole: 'worker',
    level: 1,
    totalReviews: 2,
    averageRating: 4.0,
    tutorialCompleted: true,
    searchRadius: 25,
    createdAt: oneDayAgo.toISOString(),
  },
];

export const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-sample-1',
    producerId: 'producer-1',
    serviceTypeId: 'colheita',
    quantity: 50,
    locationText: 'Fazenda Boa Esperanca, Km 45',
    latitude: -3.7,
    longitude: -53.8,
    offer: 750,
    notes: 'Cacau maduro pronto para colheita. Precisa de experiencia.',
    status: 'assigned',
    createdAt: sixHoursAgo.toISOString(),
  },
  {
    id: 'job-sample-2',
    producerId: 'producer-2',
    serviceTypeId: 'poda',
    quantity: 200,
    locationText: 'Sitio Santa Maria, Vicinal 12',
    latitude: -3.65,
    longitude: -53.75,
    offer: 100,
    notes: 'Poda de formacao em plantas jovens.',
    status: 'open',
    createdAt: threeHoursAgo.toISOString(),
  },
  {
    id: 'job-sample-3',
    producerId: 'producer-3',
    serviceTypeId: 'rocagem',
    quantity: 3,
    locationText: 'Chacara do Sol, Ramal do Cacau',
    latitude: -3.72,
    longitude: -53.82,
    offer: 450,
    notes: 'Limpeza do terreno. Area com mato alto.',
    status: 'closed',
    createdAt: twoDaysAgo.toISOString(),
  },
  {
    id: 'job-sample-4',
    producerId: 'producer-1',
    serviceTypeId: 'enxertia',
    quantity: 100,
    locationText: 'Fazenda Boa Esperanca, Km 45',
    latitude: -3.7,
    longitude: -53.8,
    offer: 200,
    notes: 'Enxertia de copas novas. Material fornecido.',
    status: 'open',
    createdAt: twoHoursAgo.toISOString(),
  },
  {
    id: 'job-sample-5',
    producerId: 'producer-2',
    serviceTypeId: 'aplicacao',
    quantity: 5,
    locationText: 'Sitio Santa Maria, Vicinal 12',
    latitude: -3.65,
    longitude: -53.75,
    offer: 400,
    notes: 'Aplicacao de fungicida. EPI necessario.',
    status: 'assigned',
    createdAt: oneDayAgo.toISOString(),
  },
  {
    id: 'job-sample-6',
    producerId: 'producer-3',
    serviceTypeId: 'trator',
    quantity: 8,
    locationText: 'Chacara do Sol, Ramal do Cacau',
    latitude: -3.72,
    longitude: -53.82,
    offer: 1440,
    notes: 'Preparo de area para novo plantio.',
    status: 'open',
    createdAt: oneHourAgo.toISOString(),
  },
];

export const SAMPLE_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-sample-1',
    jobId: 'job-sample-1',
    workerId: 'worker-3',
    producerId: 'producer-1',
    finalPrice: 750,
    status: 'checked_in',
    checkInTime: oneHourAgo.toISOString(),
    checkInLatitude: -3.7,
    checkInLongitude: -53.8,
    createdAt: threeHoursAgo.toISOString(),
  },
  {
    id: 'wo-sample-2',
    jobId: 'job-sample-3',
    workerId: 'worker-1',
    producerId: 'producer-3',
    finalPrice: 450,
    status: 'completed',
    checkInTime: twoDaysAgo.toISOString(),
    checkInLatitude: -3.72,
    checkInLongitude: -53.82,
    checkOutTime: oneDayAgo.toISOString(),
    checkOutLatitude: -3.72,
    checkOutLongitude: -53.82,
    createdAt: twoDaysAgo.toISOString(),
  },
  {
    id: 'wo-sample-3',
    jobId: 'job-sample-5',
    workerId: 'worker-2',
    producerId: 'producer-2',
    finalPrice: 400,
    status: 'assigned',
    createdAt: sixHoursAgo.toISOString(),
  },
];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'review-sample-1',
    workOrderId: 'wo-sample-2',
    reviewerId: 'producer-3',
    revieweeId: 'worker-1',
    reviewerRole: 'producer',
    quality: 5,
    safety: 5,
    punctuality: 4,
    communication: 5,
    fairness: 5,
    comment: 'Excelente trabalho! Muito profissional.',
    createdAt: oneDayAgo.toISOString(),
  },
  {
    id: 'review-sample-2',
    workOrderId: 'wo-sample-2',
    reviewerId: 'worker-1',
    revieweeId: 'producer-3',
    reviewerRole: 'worker',
    quality: 5,
    safety: 5,
    punctuality: 5,
    communication: 4,
    fairness: 5,
    comment: 'Pagamento em dia. Otimo produtor!',
    createdAt: oneDayAgo.toISOString(),
  },
];

export interface ActivityItem {
  id: string;
  type: 'job_posted' | 'job_started' | 'job_completed' | 'review_received';
  title: string;
  description: string;
  producerName: string;
  workerName?: string;
  serviceType: string;
  serviceIcon: string;
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  level?: number;
  timestamp: string;
  status?: 'open' | 'assigned' | 'closed' | 'in_progress';
}

export const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'job_started',
    title: 'Trabalho em andamento',
    description: 'Carlos Eduardo iniciou a colheita',
    producerName: 'Jose Carlos Silva',
    workerName: 'Carlos Eduardo Souza',
    serviceType: 'Colheita',
    serviceIcon: 'package',
    price: 750,
    location: 'Fazenda Boa Esperanca',
    latitude: -3.7,
    longitude: -53.8,
    level: 5,
    timestamp: oneHourAgo.toISOString(),
    status: 'in_progress',
  },
  {
    id: 'activity-2',
    type: 'job_posted',
    title: 'Nova demanda',
    description: 'Operador de trator necessario',
    producerName: 'Antonio Ferreira Lima',
    serviceType: 'Operador de Trator',
    serviceIcon: 'truck',
    price: 1440,
    location: 'Chacara do Sol',
    latitude: -3.72,
    longitude: -53.82,
    timestamp: oneHourAgo.toISOString(),
    status: 'open',
  },
  {
    id: 'activity-3',
    type: 'job_posted',
    title: 'Nova demanda',
    description: 'Enxertia de 100 plantas',
    producerName: 'Jose Carlos Silva',
    serviceType: 'Enxertia',
    serviceIcon: 'git-branch',
    price: 200,
    location: 'Fazenda Boa Esperanca',
    latitude: -3.7,
    longitude: -53.8,
    timestamp: twoHoursAgo.toISOString(),
    status: 'open',
  },
  {
    id: 'activity-4',
    type: 'job_posted',
    title: 'Nova demanda',
    description: 'Poda de 200 plantas',
    producerName: 'Maria Aparecida Santos',
    serviceType: 'Poda',
    serviceIcon: 'scissors',
    price: 100,
    location: 'Sitio Santa Maria',
    latitude: -3.65,
    longitude: -53.75,
    timestamp: threeHoursAgo.toISOString(),
    status: 'open',
  },
  {
    id: 'activity-5',
    type: 'job_completed',
    title: 'Trabalho concluido',
    description: 'Rocagem de 3 hectares finalizada',
    producerName: 'Antonio Ferreira Lima',
    workerName: 'Pedro Oliveira',
    serviceType: 'Rocagem',
    serviceIcon: 'wind',
    price: 450,
    location: 'Chacara do Sol',
    latitude: -3.72,
    longitude: -53.82,
    rating: 4.8,
    level: 4,
    timestamp: oneDayAgo.toISOString(),
    status: 'closed',
  },
  {
    id: 'activity-6',
    type: 'review_received',
    title: 'Nova avaliacao',
    description: 'Pedro recebeu 5 estrelas',
    producerName: 'Antonio Ferreira Lima',
    workerName: 'Pedro Oliveira',
    serviceType: 'Rocagem',
    serviceIcon: 'star',
    price: 450,
    location: 'Chacara do Sol',
    latitude: -3.72,
    longitude: -53.82,
    rating: 5,
    level: 4,
    timestamp: oneDayAgo.toISOString(),
  },
  {
    id: 'activity-7',
    type: 'job_started',
    title: 'Trabalho iniciado',
    description: 'Joao comecou aplicacao',
    producerName: 'Maria Aparecida Santos',
    workerName: 'Joao Batista Mendes',
    serviceType: 'Aplicacao/Manejo',
    serviceIcon: 'droplet',
    price: 400,
    location: 'Sitio Santa Maria',
    latitude: -3.65,
    longitude: -53.75,
    level: 3,
    timestamp: sixHoursAgo.toISOString(),
    status: 'in_progress',
  },
];

export function getActivityItems(): ActivityItem[] {
  return SAMPLE_ACTIVITY.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getOpenSampleJobs(): Job[] {
  return SAMPLE_JOBS.filter(j => j.status === 'open');
}

export function getInProgressJobs(): ActivityItem[] {
  return SAMPLE_ACTIVITY.filter(a => a.status === 'in_progress');
}

export function getMapActivities(radiusKm: number = 100): MapActivity[] {
  const centerLat = VILA_ALVORADA_KM140.latitude;
  const centerLng = VILA_ALVORADA_KM140.longitude;
  
  const activities: MapActivity[] = [];

  SAMPLE_ACTIVITY.forEach((item) => {
    if (!item.latitude || !item.longitude) return;
    
    const distance = getDistanceKm(centerLat, centerLng, item.latitude, item.longitude);
    if (distance > radiusKm) return;

    let status: 'open' | 'assigned' | 'closed' | 'active' = 'open';
    if (item.status === 'in_progress') status = 'assigned';
    else if (item.status === 'closed') status = 'closed';
    else if (item.status === 'open') status = 'open';

    activities.push({
      id: `map-${item.id}`,
      type: 'job',
      status,
      latitude: item.latitude,
      longitude: item.longitude,
      title: item.serviceType,
      subtitle: item.location,
      price: item.price,
      level: item.level as 1 | 2 | 3 | 4 | 5 | undefined,
      rating: item.rating,
      icon: item.serviceIcon,
      jobId: item.id,
    });
  });

  SAMPLE_WORKERS.forEach((worker) => {
    if (!worker.location) return;
    
    const workerLat = -3.68 + (Math.random() - 0.5) * 0.1;
    const workerLng = -53.72 + (Math.random() - 0.5) * 0.1;
    
    const distance = getDistanceKm(centerLat, centerLng, workerLat, workerLng);
    if (distance > radiusKm) return;

    activities.push({
      id: `map-worker-${worker.id}`,
      type: 'worker',
      status: 'active',
      latitude: workerLat,
      longitude: workerLng,
      title: worker.name,
      subtitle: `N${worker.level} - ${worker.averageRating?.toFixed(1) || '0.0'}`,
      level: worker.level,
      rating: worker.averageRating,
      icon: 'user',
      userId: worker.id,
    });
  });

  return activities;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
