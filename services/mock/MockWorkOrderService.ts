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
  async getWorkOrderByJobId(jobId: string): Promise<ServiceResult<WorkOrderWithDetails | null>> {
    try {
      const workOrders = await storageAdapter.getList<WorkOrder>(StorageKeys.WORK_ORDERS);
      const workOrder = workOrders.find(wo => wo.jobId === jobId);

      if (!workOrder) {
        return createSuccess(null);
      }

      return this.getWorkOrder(workOrder.id);
    } catch (error) {
      return createError('Erro ao buscar ordem de servico por Job ID');
    }
  }

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
        photoBefore: data.photoBefore,
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

      // Get Users for names if creating new contract
      const users = await storageAdapter.getList<User>(StorageKeys.USERS);
      const producer = users.find(u => u.id === workOrder.producerId);
      const worker = users.find(u => u.id === workOrder.workerId);

      // Create or Get Contract
      let contract: SignedContract = workOrder.signedContract || {
        id: storageAdapter.generateId(),
        text: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nENTRE:\nProdutor: ${producer?.name || 'N/A'}\nTrabalhador: ${worker?.name || 'N/A'}\n\nOBJETO:\nExecução de serviço conforme ordem ${workOrderId}.\nValor: R$ ${workOrder.finalPrice}\n\nTERMOS:\n1. O serviço deve ser executado com qualidade.\n2. O pagamento será realizado conforme combinado.`,
        producerName: producer?.name || '',
        producerEmail: producer?.email || '',
        workerName: worker?.name || '',
        workerEmail: worker?.email || '',
        serviceType: '', // Should fetch job service type if needed
        totalValue: workOrder.finalPrice,
        paymentTermsType: workOrder.paymentTerms?.type || 'full_after',
        createdAt: new Date().toISOString(),
      };

      // Sign
      const now = new Date().toISOString();
      if (role === 'producer') {
        contract.producerSignedAt = now;
      } else {
        contract.workerSignedAt = now;
      }

      // Update WorkOrder
      const updatedWorkOrder = await storageAdapter.updateInList<WorkOrder>(StorageKeys.WORK_ORDERS, workOrderId, {
        signedContract: contract,
        negotiationStatus: 'accepted'
      });

      if (!updatedWorkOrder) {
        return createError('Erro ao atualizar contrato na ordem de servico');
      }

      // Check if both signed -> Save History
      if (contract.producerSignedAt && contract.workerSignedAt) {
        // Mimic saveContractToHistory
        // In a real app, this might go to a separate 'contracts' collection
        // For now, we assume the WorkOrder holding the signed contract is sufficient Source of Truth
        // But we can verify if we need to push to a separate list if specific history screen requirement exists.
        // Based on legacy storage, it pushed to STORAGE_KEYS.CONTRACT_HISTORY.
        // Let's replicate that for safety.

        const historyItem = {
          id: storageAdapter.generateId(),
          workOrderId,
          jobId: workOrder.jobId,
          contract,
          userId: role === 'producer' ? workOrder.producerId : workOrder.workerId, // This logic in legacy was saving TWO records, one for each user.
          userRole: role,
          otherPartyId: role === 'producer' ? workOrder.workerId : workOrder.producerId,
          otherPartyName: role === 'producer' ? (worker?.name || '') : (producer?.name || ''),
          serviceType: 'Serviço', // Simplified
          totalValue: contract.totalValue,
          status: 'signed',
          savedAt: now
        };
        // We might need to handle saving for BOTH parties if this is the final signature? 
        // Legacy saved for both. Let's just save for the current signer to keep it simple, or replicate full behavior.
        // Given this is a mock, simple update of WorkOrder is usually enough, but let's be safe.
        await storageAdapter.addToList('CONTRACT_HISTORY' as any, historyItem); // Using string cast if key not in enum
      }

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
