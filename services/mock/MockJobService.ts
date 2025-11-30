/**
 * LidaCacau - Mock Job Service
 * 
 * Implementação mock usando AsyncStorage para demandas de trabalho.
 */

import { Job, Bid, ServiceType, JobWithDetails, BidWithWorker, User } from '@/types';
import { 
  IJobService, 
  CreateJobData, 
  JobFilters, 
  CreateBidData 
} from '../interfaces/IJobService';
import { ServiceResult, createSuccess, createError } from '../common/types';
import storageAdapter, { StorageKeys } from '../common/AsyncStorageAdapter';

const SERVICE_TYPES: ServiceType[] = [
  { id: 'harvest_cocoa', name: 'Colheita de Cacau', unit: 'saca', basePrice: 15, minLevel: 1, icon: 'package' },
  { id: 'prune_cocoa', name: 'Poda de Cacau', unit: 'planta', basePrice: 3, minLevel: 2, icon: 'scissors' },
  { id: 'clear_land', name: 'Rocagem', unit: 'hectare', basePrice: 200, minLevel: 1, icon: 'wind' },
  { id: 'fence', name: 'Cerca', unit: 'metro', basePrice: 25, minLevel: 2, icon: 'grid' },
  { id: 'masonry', name: 'Pedreiro', unit: 'dia', basePrice: 150, minLevel: 2, icon: 'home' },
  { id: 'electrical', name: 'Eletricista', unit: 'dia', basePrice: 200, minLevel: 3, icon: 'zap' },
  { id: 'plumbing', name: 'Encanador', unit: 'dia', basePrice: 180, minLevel: 3, icon: 'droplet' },
  { id: 'painting', name: 'Pintor', unit: 'm2', basePrice: 20, minLevel: 2, icon: 'edit-3' },
  { id: 'carpentry', name: 'Carpinteiro', unit: 'dia', basePrice: 180, minLevel: 3, icon: 'tool' },
  { id: 'welding', name: 'Serralheiro', unit: 'dia', basePrice: 200, minLevel: 3, icon: 'settings' },
];

export class MockJobService implements IJobService {
  async createJob(data: CreateJobData): Promise<ServiceResult<Job>> {
    try {
      const job: Job = {
        id: storageAdapter.generateId(),
        ...data,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(StorageKeys.JOBS, job);
      return createSuccess(job);
    } catch (error) {
      return createError('Erro ao criar demanda');
    }
  }

  async getJob(id: string): Promise<ServiceResult<JobWithDetails>> {
    try {
      const job = await storageAdapter.findById<Job>(StorageKeys.JOBS, id);
      if (!job) {
        return createError('Demanda nao encontrada', 'NOT_FOUND');
      }

      const serviceType = SERVICE_TYPES.find(st => st.id === job.serviceTypeId);
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);
      const producer = users.find(u => u.id === job.producerId);
      const bids = await this.getBidsForJob(id);

      const jobWithDetails: JobWithDetails = {
        ...job,
        serviceType: serviceType!,
        producer: producer!,
        bids: bids.data || [],
      };

      return createSuccess(jobWithDetails);
    } catch (error) {
      return createError('Erro ao buscar demanda');
    }
  }

  async getJobs(filters?: JobFilters): Promise<ServiceResult<Job[]>> {
    try {
      let jobs = await storageAdapter.getList<Job>(StorageKeys.JOBS);

      if (filters) {
        if (filters.status) {
          jobs = jobs.filter(j => j.status === filters.status);
        }
        if (filters.serviceTypeId) {
          jobs = jobs.filter(j => j.serviceTypeId === filters.serviceTypeId);
        }
        if (filters.producerId) {
          jobs = jobs.filter(j => j.producerId === filters.producerId);
        }
      }

      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return createSuccess(jobs);
    } catch (error) {
      return createError('Erro ao listar demandas');
    }
  }

  async getJobsByProducer(producerId: string): Promise<ServiceResult<Job[]>> {
    return this.getJobs({ producerId });
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<ServiceResult<Job>> {
    try {
      const updated = await storageAdapter.updateInList<Job>(StorageKeys.JOBS, id, updates);
      if (!updated) {
        return createError('Demanda nao encontrada', 'NOT_FOUND');
      }
      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao atualizar demanda');
    }
  }

  async deleteJob(id: string): Promise<ServiceResult<void>> {
    try {
      await storageAdapter.removeFromList<Job>(StorageKeys.JOBS, id);
      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao excluir demanda');
    }
  }

  async createBid(data: CreateBidData): Promise<ServiceResult<Bid>> {
    try {
      const existingBids = await storageAdapter.getList<Bid>(StorageKeys.BIDS);
      const alreadyBid = existingBids.find(
        b => b.jobId === data.jobId && b.workerId === data.workerId
      );
      if (alreadyBid) {
        return createError('Voce ja enviou uma proposta para esta demanda');
      }

      const bid: Bid = {
        id: storageAdapter.generateId(),
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(StorageKeys.BIDS, bid);
      return createSuccess(bid);
    } catch (error) {
      return createError('Erro ao criar proposta');
    }
  }

  async getBidsForJob(jobId: string): Promise<ServiceResult<BidWithWorker[]>> {
    try {
      const bids = await storageAdapter.getList<Bid>(StorageKeys.BIDS);
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);
      
      const jobBids = bids
        .filter(b => b.jobId === jobId)
        .map(bid => ({
          ...bid,
          worker: users.find(u => u.id === bid.workerId)!,
        }))
        .filter(b => b.worker);

      return createSuccess(jobBids);
    } catch (error) {
      return createError('Erro ao buscar propostas');
    }
  }

  async getBidsByWorker(workerId: string): Promise<ServiceResult<Bid[]>> {
    try {
      const bids = await storageAdapter.getList<Bid>(StorageKeys.BIDS);
      const workerBids = bids.filter(b => b.workerId === workerId);
      return createSuccess(workerBids);
    } catch (error) {
      return createError('Erro ao buscar propostas');
    }
  }

  async acceptBid(bidId: string): Promise<ServiceResult<Bid>> {
    try {
      const updated = await storageAdapter.updateInList<Bid>(StorageKeys.BIDS, bidId, { status: 'accepted' });
      if (!updated) {
        return createError('Proposta nao encontrada', 'NOT_FOUND');
      }

      await this.updateJob(updated.jobId, { status: 'assigned' });
      
      const otherBids = await storageAdapter.getList<Bid>(StorageKeys.BIDS);
      for (const bid of otherBids) {
        if (bid.jobId === updated.jobId && bid.id !== bidId) {
          await storageAdapter.updateInList<Bid>(StorageKeys.BIDS, bid.id, { status: 'rejected' });
        }
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao aceitar proposta');
    }
  }

  async rejectBid(bidId: string): Promise<ServiceResult<Bid>> {
    try {
      const updated = await storageAdapter.updateInList<Bid>(StorageKeys.BIDS, bidId, { status: 'rejected' });
      if (!updated) {
        return createError('Proposta nao encontrada', 'NOT_FOUND');
      }
      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao rejeitar proposta');
    }
  }

  async getServiceTypes(): Promise<ServiceResult<ServiceType[]>> {
    return createSuccess(SERVICE_TYPES);
  }
}

export const mockJobService = new MockJobService();
