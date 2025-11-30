/**
 * LidaCacau - Interface de Serviço de Trabalhos/Demandas
 * 
 * Define o contrato para gerenciamento de demandas e propostas.
 */

import { Job, Bid, WorkOrder, Review } from '@/types';

export interface CreateJobData {
  title: string;
  description: string;
  serviceTypeId: string;
  location: string;
  estimatedPrice: number;
  deadline?: string;
  producerId: string;
  propertyId?: string;
  photos?: string[];
}

export interface CreateBidData {
  jobId: string;
  workerId: string;
  price: number;
  message?: string;
  estimatedDays?: number;
}

export interface CreateReviewData {
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
}

export interface JobFilters {
  status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'closed';
  producerId?: string;
  serviceTypeId?: string;
  minWorkerLevel?: number;
  location?: string;
}

export interface IJobService {
  // Jobs/Demandas
  getJobs(filters?: JobFilters): Promise<Job[]>;
  getJobById(id: string): Promise<Job | null>;
  getJobsByProducer(producerId: string): Promise<Job[]>;
  getOpenJobs(workerLevel?: number): Promise<Job[]>;
  createJob(data: CreateJobData): Promise<Job>;
  updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null>;
  deleteJob(jobId: string): Promise<boolean>;
  
  // Propostas/Bids
  getBidsByJob(jobId: string): Promise<Bid[]>;
  getBidsByWorker(workerId: string): Promise<Bid[]>;
  createBid(data: CreateBidData): Promise<Bid>;
  updateBid(bidId: string, updates: Partial<Bid>): Promise<Bid | null>;
  acceptBid(bidId: string): Promise<WorkOrder>;
  
  // Ordens de Serviço
  getWorkOrderById(id: string): Promise<WorkOrder | null>;
  getWorkOrdersByWorker(workerId: string): Promise<WorkOrder[]>;
  getWorkOrdersByProducer(producerId: string): Promise<WorkOrder[]>;
  getActiveWorkOrder(workerId: string): Promise<WorkOrder | null>;
  updateWorkOrder(workOrderId: string, updates: Partial<WorkOrder>): Promise<WorkOrder | null>;
  
  // Avaliações
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReviewsByWorkOrder(workOrderId: string): Promise<Review[]>;
  createReview(data: CreateReviewData): Promise<Review>;
}
