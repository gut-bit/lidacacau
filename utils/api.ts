/**
 * LidaCacau - API Utilities
 * 
 * Funções utilitárias para obter dados via ServiceFactory.
 * Usa mock ou API real dependendo do ambiente.
 */

import { Job, Bid, ServiceOffer, UserPreferences, User } from '@/types';
import { serviceFactory } from '@/services/ServiceFactory';

/**
 * Busca demandas abertas para trabalhadores
 */
export async function getOpenJobs(workerLevel: number = 1): Promise<Job[]> {
  try {
    const jobService = serviceFactory.getJobService();
    const result = await jobService.getJobs({ status: 'open' });
    return result.success && result.data ? result.data : [];
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
    const jobService = serviceFactory.getJobService();
    const result = await jobService.getJobsByProducer(producerId);
    return result.success && result.data ? result.data : [];
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
    const jobService = serviceFactory.getJobService();
    const result = await jobService.getBidsForJob(jobId);
    return result.success && result.data ? result.data : [];
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
    const jobService = serviceFactory.getJobService();
    const result = await jobService.getBidsByWorker(workerId);
    return result.success && result.data ? result.data : [];
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
    const socialService = serviceFactory.getSocialService();
    const result = await socialService.searchUsers({ pageSize: limit });
    if (result.success && result.data) {
      return result.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error('[API] getRecentNewUsers exception:', error);
    return [];
  }
}
