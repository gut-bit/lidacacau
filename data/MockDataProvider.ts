/**
 * LidaCacau - Provider de Dados Mock
 * 
 * Este arquivo encapsula toda a lógica de inicialização de dados mock.
 * Em produção, esta função não deve ser chamada.
 * 
 * Para migrar para produção:
 * 1. Defina enableMockData = false em app.config.ts
 * 2. Configure a API real em api.baseUrl
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, FriendConnection, ChatRoom } from '@/types';
import { AppConfiguration } from '@/config';
import { hashPassword } from '@/services/common/PasswordUtils';

const STORAGE_PREFIX = AppConfiguration.storage.prefix;

const SEEDING_VERSION = 'v3_fixed_' + Date.now().toString().slice(-6);

const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  FRIENDS: `${STORAGE_PREFIX}friends`,
  CHAT_ROOMS: `${STORAGE_PREFIX}chatrooms`,
  INITIALIZED: `${STORAGE_PREFIX}initialized`,
  DEV_DATA_SEEDED: `${STORAGE_PREFIX}dev_data_seeded_${SEEDING_VERSION}`,
};

/**
 * Gera um ID único
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Dados de demonstração para desenvolvimento
 */
const DEMO_USERS: Omit<User, 'id' | 'createdAt'>[] = [
  {
    name: 'Maria da Silva',
    email: 'maria@demo.lidacacau.com',
    password: 'demo123',
    role: 'producer',
    roles: ['producer'],
    activeRole: 'producer',
    phone: '(93) 99999-1234',
    location: 'Km 140 Vila Alvorada - Uruara/PA',
    tutorialCompleted: true,
    verification: {
      status: 'approved',
      selfiePhotoUri: 'https://example.com/selfie.jpg',
      documentPhotoUri: 'https://example.com/doc.jpg',
      reviewedAt: new Date().toISOString(),
    },
  },
  {
    name: 'Joao Pereira',
    email: 'joao@demo.lidacacau.com',
    password: 'demo123',
    role: 'worker',
    roles: ['worker'],
    activeRole: 'worker',
    phone: '(93) 99999-5678',
    location: 'Centro de Uruara/PA',
    level: 3,
    totalReviews: 15,
    averageRating: 4.7,
    tutorialCompleted: true,
    verification: {
      status: 'approved',
      selfiePhotoUri: 'https://example.com/selfie2.jpg',
      documentPhotoUri: 'https://example.com/doc2.jpg',
      reviewedAt: new Date().toISOString(),
    },
  },
];

/**
 * Inicializa dados de demonstração para desenvolvimento
 * Apenas é executado se enableMockData estiver ativo
 */
export async function initializeMockData(): Promise<void> {
  if (!AppConfiguration.features.enableMockData) {
    console.log('[MockData] Mock data disabled - skipping initialization');
    return;
  }

  try {
    const alreadySeeded = await AsyncStorage.getItem(KEYS.DEV_DATA_SEEDED);
    if (alreadySeeded === 'true') {
      console.log('[MockData] Demo data already seeded');
      return;
    }

    console.log('[MockData] Initializing demo data with hashed passwords...');

    // Criar usuários de demonstração
    const existingUsers = await AsyncStorage.getItem(KEYS.USERS);
    let users: User[] = existingUsers ? JSON.parse(existingUsers) : [];

    // Remove old demo users (they might have plain-text passwords)
    const demoEmails = DEMO_USERS.map(u => u.email);
    users = users.filter(u => !demoEmails.includes(u.email));

    const createdUsers: User[] = [];

    for (const demoUser of DEMO_USERS) {
      const hashedPassword = await hashPassword(demoUser.password || 'demo123');
      const newUser: User = {
        ...demoUser,
        password: hashedPassword,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      createdUsers.push(newUser);
      console.log('[MockData] Created user:', demoUser.email, 'with hashed password');
    }

    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));

    // Criar conexão de amizade entre Maria e João se ambos foram criados
    if (createdUsers.length >= 2) {
      const maria = createdUsers.find(u => u.email === 'maria@demo.lidacacau.com');
      const joao = createdUsers.find(u => u.email === 'joao@demo.lidacacau.com');

      if (maria && joao) {
        // Criar amizade
        const existingFriends = await AsyncStorage.getItem(KEYS.FRIENDS);
        const friends: FriendConnection[] = existingFriends ? JSON.parse(existingFriends) : [];
        
        const friendship: FriendConnection = {
          id: generateId(),
          requesterId: maria.id,
          receiverId: joao.id,
          status: 'accepted',
          createdAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        };
        friends.push(friendship);
        await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(friends));

        // Criar sala de chat
        const existingRooms = await AsyncStorage.getItem(KEYS.CHAT_ROOMS);
        const rooms: ChatRoom[] = existingRooms ? JSON.parse(existingRooms) : [];
        
        const chatRoom: ChatRoom = {
          id: generateId(),
          participantIds: [maria.id, joao.id],
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          unreadCount: { [maria.id]: 0, [joao.id]: 0 },
        };
        rooms.push(chatRoom);
        await AsyncStorage.setItem(KEYS.CHAT_ROOMS, JSON.stringify(rooms));

        console.log('[MockData] Created demo friendship and chat room');
      }
    }

    // Marcar como semeado
    await AsyncStorage.setItem(KEYS.DEV_DATA_SEEDED, 'true');
    console.log('[MockData] Demo data initialized successfully');

  } catch (error) {
    console.error('[MockData] Error initializing demo data:', error);
  }
}

/**
 * Limpa todos os dados mock (para reset durante desenvolvimento)
 */
export async function clearMockData(): Promise<void> {
  try {
    const keysToRemove = [
      `${STORAGE_PREFIX}users`,
      `${STORAGE_PREFIX}jobs`,
      `${STORAGE_PREFIX}bids`,
      `${STORAGE_PREFIX}workorders`,
      `${STORAGE_PREFIX}reviews`,
      `${STORAGE_PREFIX}offers`,
      `${STORAGE_PREFIX}presets`,
      `${STORAGE_PREFIX}friends`,
      `${STORAGE_PREFIX}chatrooms`,
      `${STORAGE_PREFIX}presence`,
      `${STORAGE_PREFIX}analytics`,
      `${STORAGE_PREFIX}current_user`,
      `${STORAGE_PREFIX}dev_data_seeded`,
      `${STORAGE_PREFIX}initialized`,
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('[MockData] All mock data cleared');
  } catch (error) {
    console.error('[MockData] Error clearing mock data:', error);
  }
}

/**
 * Verifica se os dados mock estão habilitados
 */
export function isMockDataEnabled(): boolean {
  return AppConfiguration.features.enableMockData;
}

export default {
  initializeMockData,
  clearMockData,
  isMockDataEnabled,
};
