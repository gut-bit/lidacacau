/**
 * LidaCacau - Interface de Serviço de Demandas (Jobs)
 * 
 * Define o contrato para operações de demandas de trabalho.
 */

import { Job, Bid, ServiceType, JobWithDetails, BidWithWorker, PaymentTerms } from '@/types';
import { ServiceResult, ListFilters } from '../common/types';

export interface CreateJobData {
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
}

export interface JobFilters extends ListFilters {
  status?: 'open' | 'assigned' | 'closed';
  serviceTypeId?: string;
  producerId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export interface CreateBidData {
  jobId: string;
  workerId: string;
  price: number;
  message?: string;
  proposedTerms?: PaymentTerms;
}

export interface IJobService {
  createJob(data: CreateJobData): Promise<ServiceResult<Job>>;
  
  getJob(id: string): Promise<ServiceResult<JobWithDetails>>;
  
  getJobs(filters?: JobFilters): Promise<ServiceResult<Job[]>>;
  
  getJobsByProducer(producerId: string): Promise<ServiceResult<Job[]>>;
  
  updateJob(id: string, updates: Partial<Job>): Promise<ServiceResult<Job>>;
  
  deleteJob(id: string): Promise<ServiceResult<void>>;
  
  createBid(data: CreateBidData): Promise<ServiceResult<Bid>>;
  
  getBidsForJob(jobId: string): Promise<ServiceResult<BidWithWorker[]>>;
  
  getBidsByWorker(workerId: string): Promise<ServiceResult<Bid[]>>;
  
  acceptBid(bidId: string): Promise<ServiceResult<Bid>>;
  
  rejectBid(bidId: string): Promise<ServiceResult<Bid>>;
  
  getServiceTypes(): Promise<ServiceResult<ServiceType[]>>;
}
