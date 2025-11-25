export type UserRole = 'producer' | 'worker' | 'admin';

export type JobStatus = 'open' | 'assigned' | 'closed';

export type WorkOrderStatus = 'assigned' | 'checked_in' | 'checked_out' | 'completed';

export type PaymentTermType = 
  | 'per_unit'       // Por unidade (planta, saca, hectare)
  | 'per_hour'       // Por hora trabalhada
  | 'per_day'        // Por diária
  | 'full_after'     // 100% após conclusão
  | 'split_50_50'    // 50% antes, 50% depois
  | 'split_30_70'    // 30% antes, 70% depois
  | 'advance_custom'; // Adiantamento personalizado

export type NegotiationStatus = 'pending' | 'proposed' | 'counter' | 'accepted' | 'rejected';

export interface PaymentTerms {
  type: PaymentTermType;
  advancePercentage?: number;    // Para split_custom: % de adiantamento
  unitPrice?: number;            // Para per_unit: preço por unidade
  estimatedUnits?: number;       // Quantidade estimada de unidades
  hourlyRate?: number;           // Para per_hour: valor por hora
  dailyRate?: number;            // Para per_day: valor por diária
  notes?: string;                // Observações sobre o pagamento
}

export interface NegotiationProposal {
  id: string;
  proposerId: string;
  proposerRole: 'producer' | 'worker';
  paymentTerms: PaymentTerms;
  totalPrice: number;
  message?: string;
  status: NegotiationStatus;
  createdAt: string;
}

export type WorkerLevel = 1 | 2 | 3 | 4 | 5;

export type ProducerLevel = 1 | 2 | 3 | 4 | 5;

export interface Property {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface SocialLinks {
  whatsapp?: string;         // Numero de telefone ou link de grupo
  whatsappGroup?: string;    // Link do grupo WhatsApp da comunidade
  instagram?: string;        // @usuario ou link completo
  facebook?: string;         // Link do perfil ou pagina
  telegram?: string;         // @usuario ou link de grupo
  youtube?: string;          // Link do canal
  linkedin?: string;         // Link do perfil
}

export interface ProfileCompletion {
  hasAvatar: boolean;
  hasBio: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  hasProperties: boolean;
  hasSkills: boolean;
  hasEquipment: boolean;
  hasAvailability: boolean;
  hasSocialLinks: boolean;
  percentage: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
  requirement: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  icon: string;
}

export interface RoleProfile {
  bio?: string;
  skills?: string[];
  equipment?: string[];
  certifications?: string[];
  availability?: string;
  preferredRadius?: number;
  totalJobs?: number;
  totalEarnings?: number;
  totalSpent?: number;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: string;
  role: UserRole;
  roles: UserRole[];
  activeRole: UserRole;
  avatar?: string;
  coverPhoto?: string;
  level?: WorkerLevel;
  producerLevel?: ProducerLevel;
  totalReviews?: number;
  averageRating?: number;
  producerReviews?: number;
  producerRating?: number;
  properties?: Property[];
  tutorialCompleted?: boolean;
  workerProfile?: RoleProfile;
  producerProfile?: RoleProfile;
  badges?: Badge[];
  goals?: Goal[];
  profileCompletion?: ProfileCompletion;
  searchRadius?: number;
  socialLinks?: SocialLinks;
  createdAt: string;
}

export interface ServiceType {
  id: string;
  name: string;
  unit: string;
  basePrice: number;
  minLevel: WorkerLevel;
  icon: string;
}

export interface Job {
  id: string;
  producerId: string;
  serviceTypeId: string;
  quantity: number;
  locationText: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  offer: number;
  notes?: string;
  photos?: string[];
  status: JobStatus;
  createdAt: string;
}

export interface Bid {
  id: string;
  jobId: string;
  workerId: string;
  price: number;
  message?: string;
  proposedTerms?: PaymentTerms;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SignedContract {
  id: string;
  text: string;
  producerName: string;
  producerEmail: string;
  workerName: string;
  workerEmail: string;
  serviceType: string;
  startDate?: string;
  endDate?: string;
  totalValue: number;
  paymentTermsType: PaymentTermType;
  producerSignedAt?: string;
  workerSignedAt?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  jobId: string;
  workerId: string;
  producerId: string;
  finalPrice: number;
  status: WorkOrderStatus;
  paymentTerms?: PaymentTerms;
  negotiationHistory?: NegotiationProposal[];
  negotiationStatus?: NegotiationStatus;
  signedContract?: SignedContract;
  checkInTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutTime?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  workOrderId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'producer' | 'worker';
  quality: number;
  safety: number;
  punctuality: number;
  communication: number;
  fairness: number;
  comment?: string;
  createdAt: string;
}

export interface JobWithDetails extends Job {
  serviceType: ServiceType;
  producer: User;
  bids: BidWithWorker[];
  workOrder?: WorkOrderWithDetails;
}

export interface BidWithWorker extends Bid {
  worker: User;
}

export interface WorkOrderWithDetails extends WorkOrder {
  job: Job;
  serviceType: ServiceType;
  worker: User;
  producer: User;
  producerReview?: Review;
  workerReview?: Review;
}

export interface MapActivity {
  id: string;
  type: 'job' | 'worker' | 'producer';
  status: JobStatus | 'active';
  latitude: number;
  longitude: number;
  title: string;
  subtitle: string;
  price?: number;
  level?: WorkerLevel | ProducerLevel;
  rating?: number;
  icon: string;
  userId?: string;
  jobId?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const URUARA_CENTER: MapRegion = {
  latitude: -3.7167,
  longitude: -53.7333,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export const VILA_ALVORADA_KM140 = {
  latitude: -3.68,
  longitude: -53.72,
  name: 'Km 140 Vila Alvorada',
  city: 'Uruara',
  state: 'PA',
};

export const DEFAULT_BADGES: Badge[] = [
  {
    id: 'first_job',
    name: 'Primeiro Trabalho',
    description: 'Completou seu primeiro trabalho',
    icon: 'award',
    color: '#22C55E',
    requirement: 'Complete 1 trabalho',
  },
  {
    id: 'five_stars',
    name: 'Cinco Estrelas',
    description: 'Recebeu avaliacao de 5 estrelas',
    icon: 'star',
    color: '#FFB800',
    requirement: 'Receba 5 estrelas em uma avaliacao',
  },
  {
    id: 'reliable',
    name: 'Confiavel',
    description: 'Completou 5 trabalhos sem cancelamento',
    icon: 'shield',
    color: '#3B82F6',
    requirement: 'Complete 5 trabalhos sem cancelar',
  },
  {
    id: 'expert',
    name: 'Especialista',
    description: 'Alcancou nivel N4 ou superior',
    icon: 'zap',
    color: '#8B5CF6',
    requirement: 'Alcance nivel N4',
  },
  {
    id: 'master',
    name: 'Mestre do Cacau',
    description: 'Alcancou nivel N5',
    icon: 'sun',
    color: '#FFB800',
    requirement: 'Alcance nivel N5',
  },
  {
    id: 'top_producer',
    name: 'Produtor Top',
    description: 'Produtor com 10+ trabalhos publicados',
    icon: 'briefcase',
    color: '#2D5016',
    requirement: 'Publique 10 demandas',
  },
  {
    id: 'fair_payer',
    name: 'Pagador Justo',
    description: 'Produtor com media de justica 4.5+',
    icon: 'dollar-sign',
    color: '#22C55E',
    requirement: 'Mantenha media de justica acima de 4.5',
  },
  {
    id: 'quick_hire',
    name: 'Contratacao Rapida',
    description: 'Contratou trabalhador em menos de 24h',
    icon: 'clock',
    color: '#F59E0B',
    requirement: 'Aceite proposta em menos de 24 horas',
  },
  {
    id: 'profile_complete',
    name: 'Perfil Completo',
    description: 'Completou 100% do perfil',
    icon: 'check-circle',
    color: '#22C55E',
    requirement: 'Preencha todos os campos do perfil',
  },
  {
    id: 'community_member',
    name: 'Membro da Comunidade',
    description: 'Ativo na regiao de Uruara',
    icon: 'users',
    color: '#8B4513',
    requirement: 'Complete trabalhos na regiao',
  },
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'complete_profile',
    title: 'Complete seu Perfil',
    description: 'Preencha todas as informacoes do seu perfil',
    target: 100,
    current: 0,
    reward: 'Badge Perfil Completo',
    icon: 'user',
  },
  {
    id: 'first_review',
    title: 'Primeira Avaliacao',
    description: 'Receba sua primeira avaliacao',
    target: 1,
    current: 0,
    reward: 'Desbloqueie novos recursos',
    icon: 'star',
  },
  {
    id: 'reach_n2',
    title: 'Alcance Nivel N2',
    description: 'Complete 5 trabalhos com media 3.5+',
    target: 5,
    current: 0,
    reward: 'Acesso a mais tipos de servico',
    icon: 'trending-up',
  },
  {
    id: 'earn_1000',
    title: 'Ganhe R$ 1.000',
    description: 'Acumule R$ 1.000 em ganhos',
    target: 1000,
    current: 0,
    reward: 'Badge Trabalhador Dedicado',
    icon: 'dollar-sign',
  },
];

export type SkillLevel = 'teaser' | 'N1_assistido' | 'N2_autonomo' | 'N3_mentoravel';

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  skillId: string;
  title: string;
  passPercent: number;
  xp: {
    baseComplete: number;
    passBonus: number;
    maxScoreBonus: number;
  };
  questions: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  contentType: 'text' | 'video' | 'checklist';
  content: string[];
  duration?: string;
  icon: string;
}

export interface Course {
  id: string;
  skillId: string;
  level: SkillLevel;
  title: string;
  description: string;
  coverImage?: string;
  duration: string;
  modules: CourseModule[];
  quizId?: string;
  xpReward: number;
  prerequisites?: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  minLevel: number;
  courses: Course[];
  progressionRules: {
    level: SkillLevel;
    xpRequired: number;
    title: string;
    description: string;
  }[];
}

export interface SkillProgress {
  skillId: string;
  xpTotal: number;
  level: SkillLevel;
  coursesCompleted: string[];
  quizzesCompleted: {
    quizId: string;
    bestScore: number;
    attempts: number;
    lastAttempt: string;
  }[];
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  totalQuestions: number;
  correctQuestions: number;
  percent: number;
  passed: boolean;
  xpCalculated: number;
  xpAwarded: number;
  answers: number[];
  createdAt: string;
}
