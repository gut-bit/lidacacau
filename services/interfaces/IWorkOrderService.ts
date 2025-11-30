/**
 * LidaCacau - Interface de Serviço de Ordens de Trabalho
 * 
 * Define o contrato para operações de work orders.
 */

import { WorkOrder, WorkOrderWithDetails, Review, SignedContract } from '@/types';
import { ServiceResult, ListFilters } from '../common/types';

export interface WorkOrderFilters extends ListFilters {
  status?: 'assigned' | 'checked_in' | 'checked_out' | 'completed';
  workerId?: string;
  producerId?: string;
}

export interface CheckInData {
  latitude: number;
  longitude: number;
  photoBefore?: string;
}

export interface CheckOutData {
  latitude: number;
  longitude: number;
  photoAfter?: string;
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

export interface IWorkOrderService {
  getWorkOrder(id: string): Promise<ServiceResult<WorkOrderWithDetails>>;
  
  getWorkOrders(filters?: WorkOrderFilters): Promise<ServiceResult<WorkOrder[]>>;
  
  getWorkOrdersByWorker(workerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>>;
  
  getWorkOrdersByProducer(producerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>>;
  
  checkIn(workOrderId: string, data: CheckInData): Promise<ServiceResult<WorkOrder>>;
  
  checkOut(workOrderId: string, data: CheckOutData): Promise<ServiceResult<WorkOrder>>;
  
  complete(workOrderId: string): Promise<ServiceResult<WorkOrder>>;
  
  signContract(workOrderId: string, role: 'producer' | 'worker'): Promise<ServiceResult<SignedContract>>;
  
  createReview(data: CreateReviewData): Promise<ServiceResult<Review>>;
  
  getReviewsForUser(userId: string, asRole?: 'producer' | 'worker'): Promise<ServiceResult<Review[]>>;
}
