/**
 * LidaCacau - Mock WorkOrder Service
 * 
 * Implementação mock usando AsyncStorage para ordens de trabalho.
 */

import { WorkOrder, WorkOrderWithDetails, Review, SignedContract, Job, User, ServiceType } from '@/types';
import { 
  IWorkOrderService, 
  WorkOrderFilters,
  CheckInData,
  CheckOutData,
  CreateReviewData
} from '../interfaces/IWorkOrderService';
import { ServiceResult, createSuccess, createError } from '../common/types';
import storageAdapter, { StorageKeys } from '../common/AsyncStorageAdapter';

export class MockWorkOrderService implements IWorkOrderService {
  async getWorkOrder(id: string): Promise<ServiceResult<WorkOrderWithDetails>> {
    try {
      const workOrder = await storageAdapter.findById<WorkOrder>(StorageKeys.WORK_ORDERS, id);
      if (!workOrder) {
        return createError('Ordem de servico nao encontrada', 'NOT_FOUND');
      }

      const job = await storageAdapter.findById<Job>(StorageKeys.JOBS, workOrder.jobId);
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);
      const worker = users.find(u => u.id === workOrder.workerId);
      const producer = users.find(u => u.id === workOrder.producerId);
      const reviews = await storageAdapter.getList<Review>(StorageKeys.REVIEWS);

      const details: WorkOrderWithDetails = {
        ...workOrder,
        job: job!,
        serviceType: { id: job?.serviceTypeId || '', name: '', unit: '', basePrice: 0, minLevel: 1, icon: 'tool' },
        worker: worker!,
        producer: producer!,
        producerReview: reviews.find(r => r.workOrderId === id && r.reviewerRole === 'producer'),
        workerReview: reviews.find(r => r.workOrderId === id && r.reviewerRole === 'worker'),
      };

      return createSuccess(details);
    } catch (error) {
      return createError('Erro ao buscar ordem de servico');
    }
  }

  async getWorkOrders(filters?: WorkOrderFilters): Promise<ServiceResult<WorkOrder[]>> {
    try {
      let workOrders = await storageAdapter.getList<WorkOrder>(StorageKeys.WORK_ORDERS);

      if (filters) {
        if (filters.status) {
          workOrders = workOrders.filter(wo => wo.status === filters.status);
        }
        if (filters.workerId) {
          workOrders = workOrders.filter(wo => wo.workerId === filters.workerId);
        }
        if (filters.producerId) {
          workOrders = workOrders.filter(wo => wo.producerId === filters.producerId);
        }
      }

      workOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return createSuccess(workOrders);
    } catch (error) {
      return createError('Erro ao listar ordens de servico');
    }
  }

  async getWorkOrdersByWorker(workerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>> {
    try {
      const result = await this.getWorkOrders({ workerId });
      if (!result.success) return createError(result.error!);

      const detailedOrders = await Promise.all(
        result.data!.map(async wo => {
          const detail = await this.getWorkOrder(wo.id);
          return detail.data!;
        })
      );

      return createSuccess(detailedOrders.filter(Boolean));
    } catch (error) {
      return createError('Erro ao buscar ordens do trabalhador');
    }
  }

  async getWorkOrdersByProducer(producerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>> {
    try {
      const result = await this.getWorkOrders({ producerId });
      if (!result.success) return createError(result.error!);

      const detailedOrders = await Promise.all(
        result.data!.map(async wo => {
          const detail = await this.getWorkOrder(wo.id);
          return detail.data!;
        })
      );

      return createSuccess(detailedOrders.filter(Boolean));
    } catch (error) {
      return createError('Erro ao buscar ordens do produtor');
    }
  }

  async checkIn(workOrderId: string, data: CheckInData): Promise<ServiceResult<WorkOrder>> {
    try {
      const updated = await storageAdapter.updateInList<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId, {
        status: 'checked_in',
        checkInTime: new Date().toISOString(),
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        photoBefore: data.photoBefore,
      });

      if (!updated) {
        return createError('Ordem de servico nao encontrada', 'NOT_FOUND');
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao fazer check-in');
    }
  }

  async checkOut(workOrderId: string, data: CheckOutData): Promise<ServiceResult<WorkOrder>> {
    try {
      const updated = await storageAdapter.updateInList<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId, {
        status: 'checked_out',
        checkOutTime: new Date().toISOString(),
        checkOutLatitude: data.latitude,
        checkOutLongitude: data.longitude,
        photoAfter: data.photoAfter,
      });

      if (!updated) {
        return createError('Ordem de servico nao encontrada', 'NOT_FOUND');
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao fazer check-out');
    }
  }

  async complete(workOrderId: string): Promise<ServiceResult<WorkOrder>> {
    try {
      const updated = await storageAdapter.updateInList<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId, {
        status: 'completed',
      });

      if (!updated) {
        return createError('Ordem de servico nao encontrada', 'NOT_FOUND');
      }

      await storageAdapter.updateInList<Job>(StorageKeys.JOBS, updated.jobId, {
        status: 'closed',
      });

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao concluir ordem de servico');
    }
  }

  async signContract(workOrderId: string, role: 'producer' | 'worker'): Promise<ServiceResult<SignedContract>> {
    try {
      const workOrder = await storageAdapter.findById<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId);
      if (!workOrder) {
        return createError('Ordem de servico nao encontrada', 'NOT_FOUND');
      }

      const users = await storageAdapter.getList<User>(StorageKeys.USERS);
      const producer = users.find(u => u.id === workOrder.producerId);
      const worker = users.find(u => u.id === workOrder.workerId);

      const contract: SignedContract = workOrder.signedContract || {
        id: storageAdapter.generateId(),
        text: 'Contrato de prestacao de servicos...',
        producerName: producer?.name || '',
        producerEmail: producer?.email || '',
        workerName: worker?.name || '',
        workerEmail: worker?.email || '',
        serviceType: '',
        totalValue: workOrder.finalPrice,
        paymentTermsType: workOrder.paymentTerms?.type || 'full_after',
        createdAt: new Date().toISOString(),
      };

      if (role === 'producer') {
        contract.producerSignedAt = new Date().toISOString();
      } else {
        contract.workerSignedAt = new Date().toISOString();
      }

      await storageAdapter.updateInList<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId, {
        signedContract: contract,
      });

      return createSuccess(contract);
    } catch (error) {
      return createError('Erro ao assinar contrato');
    }
  }

  async createReview(data: CreateReviewData): Promise<ServiceResult<Review>> {
    try {
      const existingReviews = await storageAdapter.getList<Review>(StorageKeys.REVIEWS);
      const alreadyReviewed = existingReviews.find(
        r => r.workOrderId === data.workOrderId && r.reviewerId === data.reviewerId
      );

      if (alreadyReviewed) {
        return createError('Voce ja avaliou esta ordem de servico');
      }

      const review: Review = {
        id: storageAdapter.generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };

      await storageAdapter.addToList(StorageKeys.REVIEWS, review);

      const userReviews = existingReviews.filter(r => r.revieweeId === data.revieweeId);
      userReviews.push(review);
      
      const avgRating = userReviews.reduce((sum, r) => {
        const avg = (r.quality + r.safety + r.punctuality + r.communication + r.fairness) / 5;
        return sum + avg;
      }, 0) / userReviews.length;

      await storageAdapter.updateInList<User>(StorageKeys.USERS, data.revieweeId, {
        totalReviews: userReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
      });

      return createSuccess(review);
    } catch (error) {
      return createError('Erro ao criar avaliacao');
    }
  }

  async getReviewsForUser(userId: string, asRole?: 'producer' | 'worker'): Promise<ServiceResult<Review[]>> {
    try {
      let reviews = await storageAdapter.getList<Review>(StorageKeys.REVIEWS);
      reviews = reviews.filter(r => r.revieweeId === userId);

      if (asRole) {
        reviews = reviews.filter(r => 
          asRole === 'producer' 
            ? r.reviewerRole === 'worker' 
            : r.reviewerRole === 'producer'
        );
      }

      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return createSuccess(reviews);
    } catch (error) {
      return createError('Erro ao buscar avaliacoes');
    }
  }
}

export const mockWorkOrderService = new MockWorkOrderService();
