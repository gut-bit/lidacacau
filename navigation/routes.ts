/**
 * LidaCacau - Definição Central de Rotas
 * 
 * Este arquivo centraliza todas as definições de rotas do app.
 * Facilita a manutenção e evita duplicação de tipos.
 * 
 * Para adicionar uma nova rota:
 * 1. Adicione o nome em ROUTE_NAMES
 * 2. Adicione os parâmetros em RootStackParamList
 * 3. Adicione a configuração em ROUTE_CONFIG (opcional)
 */

import { User, CardType } from '@/types';

/**
 * Constantes de nomes de rotas para evitar strings literais
 */
export const ROUTE_NAMES = {
  // Auth
  LOGIN: 'Login',
  TUTORIAL: 'Tutorial',
  
  // Main Navigation
  MAIN_TABS: 'MainTabs',
  ADMIN_STACK: 'AdminStack',
  
  // Jobs & Work
  JOB_DETAIL: 'JobDetail',
  OFFER_DETAIL: 'OfferDetail',
  CREATE_JOB: 'CreateJob',
  CREATE_CARD: 'CreateCard',
  ACTIVE_WORK_ORDER: 'ActiveWorkOrder',
  REVIEW: 'Review',
  SERVICE_HISTORY: 'ServiceHistory',
  
  // Properties
  PRODUCER_PROPERTIES: 'ProducerProperties',
  PROPERTY_LIST: 'PropertyList',
  PROPERTY_DETAIL: 'PropertyDetail',
  PROPERTY_FORM: 'PropertyForm',
  TALHAO_MANAGEMENT: 'TalhaoManagement',
  PROPERTY_DOCUMENTS: 'PropertyDocuments',
  
  // Negotiation & Contracts
  NEGOTIATION_MATCH: 'NegotiationMatch',
  NEGOTIATION_TERMS: 'NegotiationTerms',
  CONTRACT_SIGNING: 'ContractSigning',
  CONTRACT_TEMPLATE: 'ContractTemplate',
  
  // Profile & Settings
  EDIT_PROFILE: 'EditProfile',
  SOCIAL_LINKS: 'SocialLinks',
  IDENTITY_VERIFICATION: 'IdentityVerification',
  REFERRAL: 'Referral',
  BENEFITS_CLUB: 'BenefitsClub',
  FAQ_SUPPORT: 'FAQSupport',
  PORTFOLIO: 'Portfolio',
  OTHER_USER_PROFILE: 'OtherUserProfile',
  
  // Social
  FRIENDS: 'Friends',
  CHAT_LIST: 'ChatList',
  CHAT_ROOM: 'ChatRoom',
  USER_SEARCH: 'UserSearch',
  CREATE_SQUAD: 'CreateSquad',
  QUICK_ACTIONS: 'QuickActions',
  
  // Payments
  PAYMENT: 'Payment',
  PAYMENT_HISTORY: 'PaymentHistory',
  PIX_SETTINGS: 'PixSettings',
  NFSE: 'NFSe',
  
  // Education
  EDUCATION: 'Education',
  SKILL_DETAIL: 'SkillDetail',
  COURSE_DETAIL: 'CourseDetail',
  QUIZ: 'Quiz',
  
  // Commerce (LidaShop)
  STORE_DETAIL: 'StoreDetail',
  
  // Prices
  CACAU_PRICES: 'CacauPrices',
  
  // Notifications
  NOTIFICATIONS: 'Notifications',
} as const;

export type RouteName = typeof ROUTE_NAMES[keyof typeof ROUTE_NAMES];

/**
 * Tipos de parâmetros para todas as rotas
 */
export type RootStackParamList = {
  // Auth
  [ROUTE_NAMES.LOGIN]: undefined;
  [ROUTE_NAMES.TUTORIAL]: undefined;
  
  // Main Navigation
  [ROUTE_NAMES.MAIN_TABS]: undefined;
  [ROUTE_NAMES.ADMIN_STACK]: undefined;
  
  // Jobs & Work
  [ROUTE_NAMES.JOB_DETAIL]: { jobId: string };
  [ROUTE_NAMES.OFFER_DETAIL]: { offerId: string };
  [ROUTE_NAMES.CREATE_JOB]: undefined;
  [ROUTE_NAMES.CREATE_CARD]: { type?: CardType };
  [ROUTE_NAMES.ACTIVE_WORK_ORDER]: { workOrderId: string };
  [ROUTE_NAMES.REVIEW]: { 
    workOrderId: string; 
    revieweeId: string; 
    revieweeName: string;
  };
  [ROUTE_NAMES.SERVICE_HISTORY]: undefined;
  
  // Properties
  [ROUTE_NAMES.PRODUCER_PROPERTIES]: undefined;
  [ROUTE_NAMES.PROPERTY_LIST]: undefined;
  [ROUTE_NAMES.PROPERTY_DETAIL]: { propertyId: string };
  [ROUTE_NAMES.PROPERTY_FORM]: { propertyId?: string };
  [ROUTE_NAMES.TALHAO_MANAGEMENT]: { propertyId: string };
  [ROUTE_NAMES.PROPERTY_DOCUMENTS]: { propertyId: string };
  
  // Negotiation & Contracts
  [ROUTE_NAMES.NEGOTIATION_MATCH]: {
    workOrderId: string;
    worker: User;
    producer: User;
    serviceName: string;
    price: number;
    isProducer: boolean;
  };
  [ROUTE_NAMES.NEGOTIATION_TERMS]: {
    workOrderId: string;
    worker: User;
    producer: User;
    serviceName: string;
    price: number;
    isProducer: boolean;
  };
  [ROUTE_NAMES.CONTRACT_SIGNING]: {
    workOrderId: string;
    isProducer: boolean;
  };
  [ROUTE_NAMES.CONTRACT_TEMPLATE]: { serviceTypeId?: string };
  
  // Profile & Settings
  [ROUTE_NAMES.EDIT_PROFILE]: undefined;
  [ROUTE_NAMES.SOCIAL_LINKS]: undefined;
  [ROUTE_NAMES.IDENTITY_VERIFICATION]: undefined;
  [ROUTE_NAMES.REFERRAL]: undefined;
  [ROUTE_NAMES.BENEFITS_CLUB]: undefined;
  [ROUTE_NAMES.FAQ_SUPPORT]: undefined;
  [ROUTE_NAMES.PORTFOLIO]: undefined;
  [ROUTE_NAMES.OTHER_USER_PROFILE]: { userId: string };
  
  // Social
  [ROUTE_NAMES.FRIENDS]: undefined;
  [ROUTE_NAMES.CHAT_LIST]: { newChatWithUserId?: string } | undefined;
  [ROUTE_NAMES.CHAT_ROOM]: { roomId: string; otherUserId: string };
  [ROUTE_NAMES.USER_SEARCH]: undefined;
  [ROUTE_NAMES.CREATE_SQUAD]: undefined;
  [ROUTE_NAMES.QUICK_ACTIONS]: undefined;
  
  // Payments
  [ROUTE_NAMES.PAYMENT]: { workOrder?: any };
  [ROUTE_NAMES.PAYMENT_HISTORY]: undefined;
  [ROUTE_NAMES.PIX_SETTINGS]: undefined;
  [ROUTE_NAMES.NFSE]: undefined;
  
  // Education
  [ROUTE_NAMES.EDUCATION]: undefined;
  [ROUTE_NAMES.SKILL_DETAIL]: { skillId: string };
  [ROUTE_NAMES.COURSE_DETAIL]: { courseId: string };
  [ROUTE_NAMES.QUIZ]: { quizId: string; skillId: string };
  
  // Commerce
  [ROUTE_NAMES.STORE_DETAIL]: { storeId: string };
  
  // Prices
  [ROUTE_NAMES.CACAU_PRICES]: undefined;
  
  // Notifications
  [ROUTE_NAMES.NOTIFICATIONS]: undefined;
};

/**
 * Configuração de rotas (títulos, opções de apresentação, etc)
 */
export const ROUTE_CONFIG: Partial<Record<RouteName, {
  title?: string;
  presentation?: 'modal' | 'card' | 'transparentModal';
  headerShown?: boolean;
  animation?: 'default' | 'fade' | 'slide_from_bottom' | 'none';
}>> = {
  [ROUTE_NAMES.LOGIN]: { headerShown: false },
  [ROUTE_NAMES.TUTORIAL]: { headerShown: false },
  [ROUTE_NAMES.MAIN_TABS]: { headerShown: false },
  [ROUTE_NAMES.ADMIN_STACK]: { headerShown: false },
  [ROUTE_NAMES.JOB_DETAIL]: { title: 'Detalhes do Trabalho' },
  [ROUTE_NAMES.CREATE_JOB]: { title: 'Nova Empreita', presentation: 'modal' },
  [ROUTE_NAMES.CREATE_CARD]: { title: 'Novo Anuncio', presentation: 'modal' },
  [ROUTE_NAMES.PRODUCER_PROPERTIES]: { title: 'Minhas Propriedades' },
  [ROUTE_NAMES.PROPERTY_LIST]: { title: 'Minhas Propriedades' },
  [ROUTE_NAMES.ACTIVE_WORK_ORDER]: { title: 'Servico em Andamento' },
  [ROUTE_NAMES.REVIEW]: { title: 'Avaliar Servico', presentation: 'modal' },
  [ROUTE_NAMES.NEGOTIATION_MATCH]: { 
    headerShown: false, 
    presentation: 'transparentModal',
    animation: 'fade',
  },
  [ROUTE_NAMES.NEGOTIATION_TERMS]: { title: 'Negociar Pagamento' },
  [ROUTE_NAMES.CONTRACT_SIGNING]: { title: 'Assinar Contrato de Empreitada' },
  [ROUTE_NAMES.CONTRACT_TEMPLATE]: { title: 'Modelo de Contrato' },
  [ROUTE_NAMES.SERVICE_HISTORY]: { title: 'Historico de Servicos' },
  [ROUTE_NAMES.SOCIAL_LINKS]: { title: 'Redes Sociais' },
  [ROUTE_NAMES.IDENTITY_VERIFICATION]: { title: 'Verificar Identidade' },
  [ROUTE_NAMES.REFERRAL]: { title: 'Indique e Ganhe' },
  [ROUTE_NAMES.BENEFITS_CLUB]: { title: 'Clube LidaCacau' },
  [ROUTE_NAMES.FAQ_SUPPORT]: { title: 'Ajuda e Suporte' },
  [ROUTE_NAMES.PORTFOLIO]: { title: 'Meu Portfolio' },
  [ROUTE_NAMES.PAYMENT]: { title: 'Pagamento PIX' },
  [ROUTE_NAMES.PAYMENT_HISTORY]: { title: 'Historico de Pagamentos' },
  [ROUTE_NAMES.PIX_SETTINGS]: { title: 'Configurar PIX' },
  [ROUTE_NAMES.NFSE]: { title: 'Nota Fiscal' },
  [ROUTE_NAMES.NOTIFICATIONS]: { title: 'Notificacoes' },
  [ROUTE_NAMES.EDUCATION]: { title: 'Capacitacao' },
  [ROUTE_NAMES.SKILL_DETAIL]: { title: 'Detalhes da Habilidade' },
  [ROUTE_NAMES.COURSE_DETAIL]: { title: 'Curso' },
  [ROUTE_NAMES.QUIZ]: { title: 'Quiz' },
  [ROUTE_NAMES.OTHER_USER_PROFILE]: { title: 'Perfil do Usuario' },
  [ROUTE_NAMES.CHAT_LIST]: { title: 'Mensagens' },
  [ROUTE_NAMES.CHAT_ROOM]: { title: 'Conversa' },
  [ROUTE_NAMES.USER_SEARCH]: { title: 'Buscar Usuarios' },
  [ROUTE_NAMES.QUICK_ACTIONS]: { 
    headerShown: false, 
    presentation: 'transparentModal',
    animation: 'fade',
  },
  [ROUTE_NAMES.CREATE_SQUAD]: { title: 'Esquadrao da Lida' },
  [ROUTE_NAMES.EDIT_PROFILE]: { title: 'Editar Perfil' },
  [ROUTE_NAMES.TALHAO_MANAGEMENT]: { title: 'Gerenciar Talhoes' },
  [ROUTE_NAMES.PROPERTY_DOCUMENTS]: { title: 'Documentos da Propriedade' },
  [ROUTE_NAMES.PROPERTY_DETAIL]: { title: 'Detalhes da Propriedade' },
  [ROUTE_NAMES.STORE_DETAIL]: { title: 'Detalhes da Loja' },
  [ROUTE_NAMES.CACAU_PRICES]: { title: 'Precos do Cacau' },
};

/**
 * Tipos de navegação para hooks tipados
 */
export type RootStackNavigationProp = import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>;
export type RootStackRouteProp<T extends keyof RootStackParamList> = import('@react-navigation/native').RouteProp<RootStackParamList, T>;

/**
 * Tab Navigator Types
 */
export const TAB_NAMES = {
  HOME: 'HomeTab',
  CHAT: 'ChatTab',
  ACTIONS: 'ActionsTab',
  EXPLORE: 'ExploreTab',
  PROFILE: 'ProfileTab',
} as const;

export type TabName = typeof TAB_NAMES[keyof typeof TAB_NAMES];
