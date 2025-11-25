import { User, Job, WorkOrder, Review } from '@/types';

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
    role: 'producer',
    properties: [
      { id: 'prop-1', name: 'Fazenda Boa Esperanca', address: 'Km 45, Transamazonica', latitude: -3.7, longitude: -53.8 },
    ],
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'producer-2',
    email: 'maria.santos@fazenda.com',
    password: 'senha123',
    name: 'Maria Aparecida Santos',
    role: 'producer',
    properties: [
      { id: 'prop-2', name: 'Sitio Santa Maria', address: 'Vicinal 12, Uruara', latitude: -3.65, longitude: -53.75 },
    ],
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'producer-3',
    email: 'antonio.ferreira@fazenda.com',
    password: 'senha123',
    name: 'Antonio Ferreira Lima',
    role: 'producer',
    properties: [
      { id: 'prop-3', name: 'Chacara do Sol', address: 'Ramal do Cacau, Km 8', latitude: -3.72, longitude: -53.82 },
    ],
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
];

export const SAMPLE_WORKERS: User[] = [
  {
    id: 'worker-1',
    email: 'pedro.oliveira@email.com',
    password: 'senha123',
    name: 'Pedro Oliveira',
    role: 'worker',
    level: 4,
    totalReviews: 18,
    averageRating: 4.6,
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-2',
    email: 'joao.mendes@email.com',
    password: 'senha123',
    name: 'Joao Batista Mendes',
    role: 'worker',
    level: 3,
    totalReviews: 12,
    averageRating: 4.2,
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-3',
    email: 'carlos.souza@email.com',
    password: 'senha123',
    name: 'Carlos Eduardo Souza',
    role: 'worker',
    level: 5,
    totalReviews: 28,
    averageRating: 4.8,
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-4',
    email: 'lucas.costa@email.com',
    password: 'senha123',
    name: 'Lucas da Costa',
    role: 'worker',
    level: 2,
    totalReviews: 7,
    averageRating: 3.9,
    tutorialCompleted: true,
    createdAt: threeDaysAgo.toISOString(),
  },
  {
    id: 'worker-5',
    email: 'francisco.lima@email.com',
    password: 'senha123',
    name: 'Francisco Lima Junior',
    role: 'worker',
    level: 1,
    totalReviews: 2,
    averageRating: 4.0,
    tutorialCompleted: true,
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
