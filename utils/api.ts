/**
 * LidaCacau - API Utilities
 * 
 * Funções utilitárias para chamar a API do backend.
 * Substitui as funções de storage.ts que usavam AsyncStorage local.
 */

import { Job, Bid, ServiceOffer, UserPreferences, User } from '@/types';
import { getApiAdapter } from '@/services/common/ApiAdapter';

const api = getApiAdapter();

interface JobsResponse {
  jobs: Job[];
}

interface BidsResponse {
  bids: Bid[];
}

interface UsersResponse {
  users: User[];
}

/**
 * Busca demandas abertas para trabalhadores
 */
export async function getOpenJobs(workerLevel: number = 1): Promise<Job[]> {
  try {
    const result = await api.get<JobsResponse>('/jobs', { status: 'open', limit: 50 });
    if (result.success && result.data) {
      return result.data.jobs || [];
    }
    console.error('[API] getOpenJobs error:', result.error);
    return [];
  } catch (error) {
    console.error('[API] getOpenJobs exception:', error);
    return [];
  }
}

/**
 * Busca demandas de um produtor
 */
export async function getJobsByProducer(producerId: string): Promise<Job[]> {
  try {
    const result = await api.get<JobsResponse>('/jobs', { producerId, limit: 50 });
    if (result.success && result.data) {
      return result.data.jobs || [];
    }
    console.error('[API] getJobsByProducer error:', result.error);
    return [];
  } catch (error) {
    console.error('[API] getJobsByProducer exception:', error);
    return [];
  }
}

/**
 * Busca propostas de uma demanda
 */
export async function getBidsByJob(jobId: string): Promise<Bid[]> {
  try {
    const result = await api.get<{ job: any; bids: Bid[] }>(`/jobs/${jobId}`);
    if (result.success && result.data) {
      return result.data.bids || [];
    }
    console.error('[API] getBidsByJob error:', result.error);
    return [];
  } catch (error) {
    console.error('[API] getBidsByJob exception:', error);
    return [];
  }
}

/**
 * Busca propostas de um trabalhador
 */
export async function getBidsByWorker(workerId: string): Promise<Bid[]> {
  try {
    const result = await api.get<BidsResponse>('/jobs/bids', { workerId });
    if (result.success && result.data) {
      return result.data.bids || [];
    }
    return [];
  } catch (error) {
    console.error('[API] getBidsByWorker exception:', error);
    return [];
  }
}

/**
 * Busca ofertas de serviço públicas
 * TODO: Implementar endpoint no servidor
 */
export async function getPublicServiceOffers(): Promise<ServiceOffer[]> {
  return [];
}

/**
 * Busca ofertas de serviço de um trabalhador
 * TODO: Implementar endpoint no servidor
 */
export async function getServiceOffersByWorker(workerId: string): Promise<ServiceOffer[]> {
  return [];
}

/**
 * Busca preferências do usuário
 * TODO: Implementar endpoint no servidor
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  return null;
}

/**
 * Busca usuários recentes
 */
export async function getRecentNewUsers(limit: number = 10): Promise<User[]> {
  try {
    const result = await api.get<UsersResponse>('/users', { limit: limit.toString() });
    if (result.success && result.data) {
      const users = result.data.users || [];
      return users.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, limit);
    }
    console.error('[API] getRecentNewUsers error:', result.error);
    return [];
  } catch (error) {
    console.error('[API] getRecentNewUsers exception:', error);
    return [];
  }
}
