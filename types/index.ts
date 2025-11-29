export type UserRole = 'producer' | 'worker' | 'admin';

export type JobStatus = 'open' | 'assigned' | 'closed';

export type WorkOrderStatus = 'assigned' | 'checked_in' | 'checked_out' | 'completed';

export type WorkOrderPaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface PaymentBreakdown {
  totalValue: number;           // Valor total do servico
  platformFee: number;          // Taxa da plataforma (10%)
  workerPayout: number;         // Valor para o trabalhador (90%)
  advancePaid?: number;         // Adiantamento ja pago (se houver)
  remainingToPay: number;       // Valor restante a pagar
}

export interface WorkOrderPayment {
  status: WorkOrderPaymentStatus;
  breakdown: PaymentBreakdown;
  workerPixChargeId?: string;   // ID da cobranca PIX para o trabalhador
  platformPixChargeId?: string; // ID da cobranca PIX para a plataforma
  workerPaidAt?: string;
  platformPaidAt?: string;
  processedAt?: string;
}

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

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface IdentityVerification {
  status: VerificationStatus;
  documentType?: 'rg' | 'cnh' | 'ctps';
  documentPhotoUri?: string;
  selfiePhotoUri?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface PortfolioItem {
  id: string;
  photoUri: string;
  description?: string;
  serviceTypeId?: string;
  createdAt: string;
}

export interface PersonalBackground {
  birthPlace?: string;
  yearsInRegion?: number;
  familyConnections?: string;
  personalStory?: string;
  funFact?: string;
}

export interface Recommendation {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  type: 'text' | 'audio';
  content: string;
  audioUri?: string;
  relationship?: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  title: string;
  institution?: string;
  photoUri?: string;
  description?: string;
  issueDate?: string;
  createdAt: string;
}

export interface ReferralInfo {
  code: string;
  referredBy?: string;
  referrals: string[];
  totalXpEarned: number;
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
  pixKey?: string;              // Chave PIX para recebimento (CPF, email, telefone, aleatoria)
  pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
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
  verification?: IdentityVerification;
  portfolio?: PortfolioItem[];
  referral?: ReferralInfo;
  personalBackground?: PersonalBackground;
  recommendations?: Recommendation[];
  certificates?: Certificate[];
  workPhotos?: PortfolioItem[];
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
  payment?: WorkOrderPayment;
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

export type PixPaymentStatus = 
  | 'pending'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export type PixChargeType = 'worker_payout' | 'platform_fee' | 'manual';

export interface PixCharge {
  id: string;
  correlationID: string;
  workOrderId?: string;
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  receiverPixKey?: string;
  value: number;
  description: string;
  brCode: string;
  qrCodeImage?: string;
  status: PixPaymentStatus;
  chargeType: PixChargeType;
  expiresAt: string;
  paidAt?: string;
  createdAt: string;
}

export const PLATFORM_FEE_PERCENTAGE = 0.10;

export interface PaymentSummary {
  totalReceived: number;
  totalPaid: number;
  pendingPayments: number;
  completedPayments: number;
}

export interface ContractHistoryItem {
  id: string;
  workOrderId: string;
  jobId: string;
  contract: SignedContract;
  userId: string;
  userRole: 'producer' | 'worker';
  otherPartyId: string;
  otherPartyName: string;
  serviceType: string;
  totalValue: number;
  status: 'pending' | 'signed' | 'completed' | 'cancelled';
  savedAt: string;
}

// ============================================
// SISTEMA DE CARDS DE DEMANDA E OFERTA
// ============================================

export type CardType = 'demand' | 'offer';
export type CardVisibility = 'public' | 'private' | 'deleted';
export type CardStatus = 'active' | 'matched' | 'completed' | 'expired' | 'cancelled';

// Cores para distinguir visualmente Demanda vs Oferta
export const CARD_COLORS = {
  demand: {
    primary: '#2D5016',    // Verde escuro - Produtor busca trabalhador
    secondary: '#4A7C23',
    background: '#E8F5E0',
    icon: 'search',        // Icone de busca
  },
  offer: {
    primary: '#1565C0',    // Azul - Trabalhador oferece servico
    secondary: '#1976D2',
    background: '#E3F2FD',
    icon: 'hand',          // Icone de mao levantada
  },
};

// Opcoes adicionais que podem ser incluidas no card
export interface CardExtras {
  providesFood?: boolean;           // Alimentacao inclusa
  providesAccommodation?: boolean;  // Estadia inclusa
  providesTransport?: boolean;      // Transporte incluso
  transportCost?: number;           // Custo de transporte (se nao incluso)
  directions?: string;              // Como chegar
  toolsProvided?: boolean;          // Ferramentas fornecidas
  customConditions?: string[];      // Condicoes personalizadas do usuario
}

// Oferta de servico (Trabalhador oferecendo seu trabalho)
export interface ServiceOffer {
  id: string;
  workerId: string;
  serviceTypeIds: string[];         // Pode oferecer multiplos servicos
  pricePerUnit?: number;            // Preco por unidade
  pricePerDay?: number;             // Diaria
  pricePerHour?: number;            // Por hora
  priceNegotiable: boolean;         // Preco negociavel
  locationText: string;
  latitude?: number;
  longitude?: number;
  availableRadius: number;          // Raio de atendimento em km
  availability: string;             // Disponibilidade (ex: "Segunda a Sexta")
  description: string;
  photos?: string[];
  extras?: CardExtras;
  visibility: CardVisibility;
  status: CardStatus;
  viewCount: number;
  interestCount: number;            // Quantos produtores demonstraram interesse
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// Interesse em uma oferta (Produtor interessado em trabalhador)
export interface OfferInterest {
  id: string;
  offerId: string;
  producerId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Card unificado para o feed (pode ser Demanda ou Oferta)
export interface FeedCard {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  serviceTypes: string[];
  price: number;
  priceLabel: string;
  location: string;
  distance?: number;                // Distancia do usuario em km
  latitude?: number;
  longitude?: number;
  photos?: string[];
  extras?: CardExtras;
  ownerName: string;
  ownerId: string;
  ownerAvatar?: string;
  ownerLevel?: number;
  ownerRating?: number;
  ownerVerified?: boolean;
  status: CardStatus;
  interactionCount: number;         // Propostas ou interesses
  createdAt: string;
  originalData: Job | ServiceOffer; // Dados originais
}

// Preset de card salvo pelo usuario
export interface CardPreset {
  id: string;
  userId: string;
  name: string;
  type: CardType;
  serviceTypeIds: string[];
  defaultPrice?: number;
  defaultLocation?: string;
  defaultDescription?: string;
  defaultExtras?: CardExtras;
  createdAt: string;
}

// Preferencias do usuario para algoritmo de recomendacao
export interface UserPreferences {
  userId: string;
  preferredServiceTypes: string[];  // Tipos de servico mais importantes
  preferredRadius: number;          // Raio de busca preferido
  minPrice?: number;
  maxPrice?: number;
  preferredPaymentTerms?: PaymentTermType[];
  notificationPreferences: {
    newMatches: boolean;
    newOffers: boolean;
    newDemands: boolean;
    priceChanges: boolean;
  };
  updatedAt: string;
}

// Filtros para o feed
export interface FeedFilters {
  type?: CardType | 'all';
  serviceTypeIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  radius?: number;                  // Raio em km
  region?: string;                  // Nome da regiao
  municipality?: string;            // Municipio
  sortBy: 'date' | 'distance' | 'price' | 'relevance';
  showOnlyWithExtras?: boolean;
}

// Regioes pre-definidas de Uruara
export const URUARA_REGIONS = [
  { id: 'vila_alvorada', name: 'Vila Alvorada (Km 140)', latitude: -3.68, longitude: -53.72 },
  { id: 'centro', name: 'Centro de Uruara', latitude: -3.7167, longitude: -53.7333 },
  { id: 'km_120', name: 'Km 120', latitude: -3.65, longitude: -53.70 },
  { id: 'km_160', name: 'Km 160', latitude: -3.71, longitude: -53.75 },
  { id: 'km_180', name: 'Km 180', latitude: -3.74, longitude: -53.78 },
];

// Match entre Demanda e Oferta
export interface CardMatch {
  id: string;
  demandId?: string;                // Job ID (se veio de demanda)
  offerId?: string;                 // ServiceOffer ID (se veio de oferta)
  producerId: string;
  workerId: string;
  matchedAt: string;
  status: 'pending_negotiation' | 'negotiating' | 'agreed' | 'cancelled';
  chatMessages?: ChatMessage[];
  agreedPrice?: number;
  agreedTerms?: PaymentTerms;
}

// Mensagem de chat na negociacao
export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'producer' | 'worker';
  message: string;
  createdAt: string;
  read: boolean;
}

// ==========================================
// SISTEMA "AMIGOS DO CAMPO" - DAR A MAO
// ==========================================

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendConnection {
  id: string;
  requesterId: string;          // Quem deu a mao
  receiverId: string;           // Quem recebeu o convite
  status: FriendshipStatus;
  message?: string;             // Mensagem opcional no convite
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendWithUser extends FriendConnection {
  friend: User;                 // Dados do amigo (o outro usuario)
}

// ==========================================
// SISTEMA DE CHAT ENTRE USUARIOS
// ==========================================

export interface ChatRoom {
  id: string;
  participantIds: string[];     // IDs dos 2 usuarios
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  unreadCount: Record<string, number>;  // Contagem por usuario
  createdAt: string;
}

export interface ChatRoomWithDetails extends ChatRoom {
  otherUser: User;              // O outro participante
  messages: DirectMessage[];
}

export interface DirectMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  imageUri?: string;
  audioUri?: string;
  read: boolean;
  createdAt: string;
}

// ==========================================
// SISTEMA DE PRESENCA E ATIVIDADE
// ==========================================

export interface UserPresence {
  userId: string;
  lastActive: string;           // ISO timestamp
  isOnline: boolean;
  currentScreen?: string;       // Tela atual (para analytics)
}

export interface ActiveUsersStats {
  totalUsers: number;
  activeNow: number;            // Ativos nos ultimos 5 min
  activeToday: number;          // Ativos hoje
  activeThisWeek: number;       // Ativos esta semana
  byRole: {
    producers: { total: number; active: number };
    workers: { total: number; active: number };
  };
  byRegion?: Record<string, { total: number; active: number }>;
}

// ==========================================
// SISTEMA DE ANALYTICS E LOGS
// ==========================================

export type AnalyticsEventType = 
  | 'app_open'
  | 'login'
  | 'logout'
  | 'signup'
  | 'card_created'
  | 'card_viewed'
  | 'bid_sent'
  | 'bid_accepted'
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'chat_message_sent'
  | 'profile_viewed'
  | 'search_performed'
  | 'filter_changed'
  | 'tutorial_step_completed'
  | 'quick_action_tap'
  | 'squad_created'
  | 'squad_proposed'
  | 'squad_invite_sent'
  | 'squad_invite_responded'
  | 'error_occurred';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, unknown>;
  screen?: string;
  timestamp: string;
  sessionId?: string;
  deviceInfo?: {
    platform: 'ios' | 'android' | 'web';
    version?: string;
  };
}

export interface AnalyticsSession {
  id: string;
  userId?: string;
  startedAt: string;
  endedAt?: string;
  events: AnalyticsEvent[];
  screens: string[];
}

// ==========================================
// TUTORIAL MELHORADO
// ==========================================

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;              // Acao para executar
  targetScreen?: string;        // Tela para navegar
  forRole?: UserRole;           // Se especifico para um papel
}

export interface TutorialProgress {
  userId: string;
  completedSteps: string[];
  currentStep: number;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// PESQUISA DE USUARIOS
// ==========================================

export interface UserSearchFilters {
  query?: string;               // Busca por nome
  role?: UserRole;
  serviceTypeIds?: string[];
  region?: string;
  municipality?: string;
  minLevel?: number;
  maxDistance?: number;         // Em km
  onlyVerified?: boolean;
  onlyOnline?: boolean;
  sortBy: 'name' | 'rating' | 'distance' | 'level';
}

export interface UserSearchResult {
  user: User;
  distance?: number;            // Distancia em km
  isFriend: boolean;
  pendingRequest: boolean;      // Se tem pedido de amizade pendente
  mutualFriends?: number;
}

// ==========================================
// NOTIFICACOES - GENTE DA LIDA
// ==========================================

export type NotificationType = 
  | 'new_user'            // Novo usuario se cadastrou
  | 'friend_request'      // Pedido de amizade
  | 'friend_accepted'     // Amizade aceita
  | 'new_message'         // Nova mensagem
  | 'new_job'             // Nova demanda criada
  | 'new_offer'           // Nova oferta de servico
  | 'bid_received'        // Proposta recebida
  | 'bid_accepted'        // Proposta aceita
  | 'system';             // Notificacao do sistema

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;              // Usuario relacionado (ex: quem se cadastrou)
  targetId?: string;            // ID do objeto relacionado (job, offer, etc)
  read: boolean;
  createdAt: string;
}

// ==========================================
// ESQUADRAO DA LIDA - GRUPOS DE TRABALHO
// ==========================================

export type SquadStatus = 
  | 'proposed'        // Proposta de criacao (aguardando aprovacao)
  | 'recruiting'      // Recrutando membros
  | 'active'          // Equipe formada e ativa
  | 'working'         // Em trabalho
  | 'completed'       // Trabalho concluido
  | 'disbanded';      // Equipe dissolvida

export type SquadMemberStatus = 
  | 'invited'         // Convidado (aguardando resposta)
  | 'accepted'        // Aceitou o convite
  | 'declined'        // Recusou o convite
  | 'removed';        // Removido do grupo

export interface SquadMember {
  userId: string;
  role: 'leader' | 'member';        // Lider ou membro
  status: SquadMemberStatus;
  joinedAt?: string;                // Quando entrou
  invitedAt: string;                // Quando foi convidado
  invitedBy: string;                // Quem convidou
}

export interface LidaSquad {
  id: string;
  name: string;                     // Nome do esquadrao (ex: "Esquadrao do Joao")
  description?: string;             // Descricao do grupo
  leaderId: string;                 // ID do lider
  members: SquadMember[];           // Lista de membros (max 4)
  maxMembers: number;               // Tamanho maximo (4 por padrao)
  serviceTypeIds?: string[];        // Tipos de servico que o grupo faz
  skills?: string[];                // Habilidades do grupo
  locationText?: string;            // Regiao de atuacao
  latitude?: number;
  longitude?: number;
  status: SquadStatus;
  totalJobsCompleted: number;
  totalEarnings: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SquadWithDetails extends LidaSquad {
  leader: User;
  memberUsers: User[];              // Dados dos membros
}

export interface SquadInvite {
  id: string;
  squadId: string;
  inviterId: string;                // Quem convidou
  inviteeId: string;                // Quem foi convidado
  message?: string;                 // Mensagem do convite
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

export interface SquadProposal {
  id: string;
  proposerId: string;               // Quem propos
  proposedLeaderId: string;         // Lider proposto
  squadName: string;
  description?: string;
  invitedUserIds: string[];         // IDs dos convidados iniciais
  serviceTypeIds?: string[];
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

// ==========================================
// SISTEMA DE PROPRIEDADES RURAIS
// ==========================================

export type PropertyVerificationStatus = 
  | 'none'              // Sem verificacao
  | 'pending'           // Documentos enviados, aguardando analise
  | 'verified'          // Propriedade verificada com selo
  | 'rejected';         // Documentos rejeitados

export type TalhaoVisibility = 'public' | 'private';
export type TalhaoPriority = 'low' | 'medium' | 'high' | 'urgent';

// Coordenada geografica simples
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

// Poligono geografico (array de coordenadas formando area fechada)
export interface PolygonGeometry {
  coordinates: GeoCoordinate[];
  areaHectares?: number;         // Area calculada em hectares
  perimeterKm?: number;          // Perimetro em km
}

// Tag de servico associada a um talhao
export interface TalhaoServiceTag {
  id: string;
  serviceTypeId: string;
  priority: TalhaoPriority;
  estimatedCost?: number;
  notes?: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
}

// Talhao - Subdivisao da propriedade
export interface Talhao {
  id: string;
  propertyId: string;
  name: string;                   // Ex: "Talhao 1", "Area do Cacau", etc
  description?: string;
  polygon?: PolygonGeometry;      // Poligono do talhao
  areaHectares?: number;
  cropType?: string;              // Tipo de cultivo (cacau, cafe, etc)
  plantingDate?: string;          // Data do plantio
  harvestDate?: string;           // Previsao de colheita
  visibility: TalhaoVisibility;   // Publico ou privado
  serviceTags: TalhaoServiceTag[]; // Tags de servico pendentes
  photos?: string[];              // Fotos do talhao
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Documento da propriedade (CAR, escritura, etc)
export interface PropertyDocument {
  id: string;
  propertyId: string;
  type: 'car' | 'escritura' | 'geo_json' | 'kml' | 'shapefile' | 'other';
  title: string;
  description?: string;
  fileUri: string;                // URI do arquivo
  fileName: string;
  fileSize?: number;              // Tamanho em bytes
  mimeType?: string;
  carNumber?: string;             // Numero do CAR (se aplicavel)
  verificationStatus: PropertyVerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

// Propriedade Rural Detalhada
export interface PropertyDetail {
  id: string;
  ownerId: string;                // ID do produtor dono
  name: string;                   // Nome da propriedade
  description?: string;
  
  // Localizacao
  address: string;                // Endereco completo
  city?: string;
  state?: string;
  cep?: string;
  latitude: number;
  longitude: number;
  
  // Geometria
  polygon?: PolygonGeometry;      // Poligono da propriedade inteira
  areaHectares?: number;          // Area total
  
  // Subdivisoes
  talhoes: Talhao[];              // Lista de talhoes
  
  // Documentacao
  documents: PropertyDocument[];   // Documentos da propriedade
  carNumber?: string;             // Numero do CAR principal
  
  // Verificacao
  verificationStatus: PropertyVerificationStatus;
  verificationBadge?: boolean;    // Selo de propriedade verificada
  verifiedAt?: string;
  
  // Fotos
  coverPhoto?: string;            // Foto de capa
  photos?: string[];              // Galeria de fotos
  
  // Metadados para tokenizacao futura
  registryCode?: string;          // Codigo de registro unico
  blockchainRef?: string;         // Referencia blockchain (futuro)
  carbonPotential?: number;       // Potencial de credito de carbono
  certifications?: string[];      // Certificacoes (organico, etc)
  
  // Auditoria
  createdAt: string;
  updatedAt: string;
  revisionHistory?: {
    timestamp: string;
    changeType: 'create' | 'update' | 'verify' | 'polygon_update';
    changedBy: string;
    details?: string;
  }[];
}

// Propriedade com detalhes do dono
export interface PropertyWithOwner extends PropertyDetail {
  owner: User;
}

// Filtros para busca de propriedades
export interface PropertySearchFilters {
  ownerId?: string;
  city?: string;
  state?: string;
  verified?: boolean;
  hasCAR?: boolean;
  minArea?: number;
  maxArea?: number;
  cropType?: string;
  sortBy: 'name' | 'area' | 'date' | 'distance';
}

// Funcao auxiliar para calcular area de poligono (formula de Shoelace)
export function calculatePolygonArea(coordinates: GeoCoordinate[]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // Conversao aproximada para metros (1 grau ~ 111km no equador)
    const x1 = coordinates[i].longitude * 111320 * Math.cos(coordinates[i].latitude * Math.PI / 180);
    const y1 = coordinates[i].latitude * 110540;
    const x2 = coordinates[j].longitude * 111320 * Math.cos(coordinates[j].latitude * Math.PI / 180);
    const y2 = coordinates[j].latitude * 110540;
    
    area += (x1 * y2) - (x2 * y1);
  }
  
  // Area em metros quadrados, convertida para hectares (1 ha = 10000 m2)
  return Math.abs(area / 2) / 10000;
}

// Constantes para tipos de documentos
export const PROPERTY_DOCUMENT_TYPES = [
  { id: 'car', label: 'CAR - Cadastro Ambiental Rural', icon: 'file-text' },
  { id: 'escritura', label: 'Escritura / Matricula', icon: 'book' },
  { id: 'geo_json', label: 'Arquivo GeoJSON', icon: 'map' },
  { id: 'kml', label: 'Arquivo KML', icon: 'map-pin' },
  { id: 'shapefile', label: 'Shapefile', icon: 'layers' },
  { id: 'other', label: 'Outro documento', icon: 'paperclip' },
] as const;

// Tipos de cultivo comuns na regiao
export const CROP_TYPES = [
  { id: 'cacau', label: 'Cacau', icon: 'coffee' },
  { id: 'cafe', label: 'Cafe', icon: 'coffee' },
  { id: 'banana', label: 'Banana', icon: 'sun' },
  { id: 'mandioca', label: 'Mandioca', icon: 'zap' },
  { id: 'pimenta', label: 'Pimenta do Reino', icon: 'target' },
  { id: 'gado', label: 'Pastagem/Gado', icon: 'box' },
  { id: 'acai', label: 'Acai', icon: 'droplet' },
  { id: 'cupuacu', label: 'Cupuacu', icon: 'circle' },
  { id: 'reserva', label: 'Reserva Legal', icon: 'shield' },
  { id: 'app', label: 'APP - Area de Preservacao', icon: 'feather' },
  { id: 'mixed', label: 'Cultivo Misto', icon: 'grid' },
  { id: 'other', label: 'Outro', icon: 'more-horizontal' },
] as const;

// Frases e trocadilhos da Lida
export const LIDA_PHRASES = {
  welcome: [
    'Mais um companheiro de lida!',
    'Chegou mais gente da lida!',
    'Bora meter a mao na massa!',
    'Bem-vindo a comunidade da lida!',
    'Mais um pra fortalecer a lida!',
  ],
  greeting: [
    'E ai, parceiro de lida!',
    'Opa, companheiro!',
    'Tudo certo por ai?',
    'Firme na lida?',
  ],
  success: [
    'Servico bem feito, lida bem paga!',
    'Isso que e trabalhar direito!',
    'Mandou bem na lida!',
    'Ta de parabens, parceiro!',
  ],
  encouragement: [
    'Bora que a lida nao para!',
    'Vamos que vamos!',
    'A lida e todo dia!',
    'Trabalho bom aparece!',
  ],
} as const;

// LIDASHOP - Sistema de E-commerce para insumos agropecuarios
export type StoreStatus = 'active' | 'inactive' | 'suspended';
export type ProductCategory = 'herbicida' | 'fungicida' | 'inseticida' | 'adubo' | 'ferramenta' | 'outro';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup' | 'combined';

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  city: string;
  state: string;
  whatsapp?: string;
  email?: string;
  phone?: string;
  status: StoreStatus;
  rating: number;
  totalReviews: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  discount?: number;
  quantity: number;
  images: string[];
  specifications?: Record<string, string>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  storeId: string;
  quantity: number;
  addedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  items: CartItem[];
  totalValue: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
