import { Job, Bid, ServiceType, JobWithDetails, BidWithWorker } from '@/types';
import { IJobService, CreateJobData, CreateBidData, JobFilters } from '../interfaces/IJobService';
import { getApiAdapter } from '../common/ApiAdapter';
import { ServiceResult, createSuccess, createError } from '../common/types';
import { cacheService } from '../common/CacheService';

interface JobsResponse {
  jobs: Job[];
}

interface JobResponse {
  job: JobWithDetails;
  bids?: BidWithWorker[];
}

interface BidResponse {
  bid: Bid;
}

interface BidsResponse {
  bids: BidWithWorker[];
}

interface ServiceTypesResponse {
  serviceTypes: ServiceType[];
}

export class ApiJobService implements IJobService {
  private api = getApiAdapter();

  async createJob(data: CreateJobData): Promise<ServiceResult<Job>> {
    const result = await this.api.post<JobResponse>('/jobs', data);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao criar demanda', result.code);
    }

    return createSuccess(result.data.job);
  }

  async getJob(id: string): Promise<ServiceResult<JobWithDetails>> {
    const result = await this.api.get<JobResponse>(`/jobs/${id}`);

    if (!result.success || !result.data) {
      return createError(result.error || 'Demanda não encontrada', result.code);
    }

    return createSuccess(result.data.job);
  }

  async getJobs(filters?: JobFilters): Promise<ServiceResult<Job[]>> {
    const params: Record<string, any> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.serviceTypeId) params.serviceTypeId = filters.serviceTypeId;
    if (filters?.producerId) params.producerId = filters.producerId;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    if (filters?.latitude) params.latitude = filters.latitude;
    if (filters?.longitude) params.longitude = filters.longitude;
    if (filters?.radiusKm) params.radiusKm = filters.radiusKm;

    const result = await this.api.get<JobsResponse>('/jobs', params);

    if (!result.success || !result.data) {
      // Try to load from cache if API fails
      const cacheKey = `jobs_list_${JSON.stringify(params)}`;
      const cachedJobs = await cacheService.getStale<Job[]>(cacheKey);

      if (cachedJobs) {
        console.log('[ApiJobService] Serving jobs from cache due to API failure');
        return createSuccess(cachedJobs);
      }

      return createError(result.error || 'Erro ao buscar demandas', result.code);
    }

    // Save to cache on success
    const cacheKey = `jobs_list_${JSON.stringify(params)}`;
    cacheService.set(cacheKey, result.data.jobs, 5 * 60 * 1000); // 5 min cache

    return createSuccess(result.data.jobs);
  }

  async getJobsByProducer(producerId: string): Promise<ServiceResult<Job[]>> {
    const result = await this.api.get<JobsResponse>('/jobs', { producerId });

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar demandas do produtor', result.code);
    }

    return createSuccess(result.data.jobs);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<ServiceResult<Job>> {
    const result = await this.api.patch<JobResponse>(`/jobs/${id}`, updates);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao atualizar demanda', result.code);
    }

    return createSuccess(result.data.job);
  }

  async deleteJob(id: string): Promise<ServiceResult<void>> {
    const result = await this.api.delete(`/jobs/${id}`);

    if (!result.success) {
      return createError(result.error || 'Erro ao excluir demanda', result.code);
    }

    return createSuccess(undefined);
  }

  async createBid(data: CreateBidData): Promise<ServiceResult<Bid>> {
    const result = await this.api.post<BidResponse>(`/jobs/${data.jobId}/bids`, data);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao criar proposta', result.code);
    }

    return createSuccess(result.data.bid);
  }

  async getBidsForJob(jobId: string): Promise<ServiceResult<BidWithWorker[]>> {
    const result = await this.api.get<BidsResponse>(`/jobs/${jobId}/bids`);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar propostas', result.code);
    }

    return createSuccess(result.data.bids);
  }

  async getBidsByWorker(workerId: string): Promise<ServiceResult<Bid[]>> {
    const result = await this.api.get<{ bids: Bid[] }>('/jobs/bids', { workerId });

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar propostas do trabalhador', result.code);
    }

    return createSuccess(result.data.bids);
  }

  async acceptBid(bidId: string): Promise<ServiceResult<Bid>> {
    const result = await this.api.post<BidResponse>(`/jobs/bids/${bidId}/accept`);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao aceitar proposta', result.code);
    }

    return createSuccess(result.data.bid);
  }

  async rejectBid(bidId: string): Promise<ServiceResult<Bid>> {
    const result = await this.api.post<BidResponse>(`/jobs/bids/${bidId}/reject`);

    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao rejeitar proposta', result.code);
    }

    return createSuccess(result.data.bid);
  }

  async getServiceTypes(): Promise<ServiceResult<ServiceType[]>> {
    const cacheKey = 'service_types_list';
    const result = await this.api.get<ServiceTypesResponse>('/jobs/service-types/list');

    if (!result.success || !result.data) {
      const cachedTypes = await cacheService.getStale<ServiceType[]>(cacheKey);
      if (cachedTypes) return createSuccess(cachedTypes);
      return createError(result.error || 'Erro ao buscar tipos de serviço', result.code);
    }

    cacheService.set(cacheKey, result.data.serviceTypes, 24 * 60 * 60 * 1000); // 24h cache
    return createSuccess(result.data.serviceTypes);
  }
}
