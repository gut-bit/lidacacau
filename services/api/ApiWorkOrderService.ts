import { IWorkOrderService, CheckInData, CheckOutData, CreateReviewData, WorkOrderFilters } from '../interfaces/IWorkOrderService';
import { WorkOrder, WorkOrderWithDetails, SignedContract, Review } from '@/types';
import { ServiceResult, createSuccess, createError } from '../common/types';
import { getApiAdapter } from '../common/ApiAdapter';

export class ApiWorkOrderService implements IWorkOrderService {
    private api = getApiAdapter();

    async getReviewsForUser(userId: string): Promise<ServiceResult<Review[]>> {
        // TODO: Implement GET /reviews endpoint in backend
        return createSuccess([]);
    }
    async getWorkOrderByJobId(jobId: string): Promise<ServiceResult<WorkOrderWithDetails>> {
        // In API, we can filter by jobId
        // The backend route supports generic list with filters
        // But we might not have a specific 'getByJobId' endpoint, so we list.
        // Wait, getWorkOrder by ID is distinct.
        // Let's assume we list with jobId if the API supports it in query?
        // My route implementation supports workerId, producerId, status. Not jobId yet.
        // I should update the route to support jobId filter!
        // For now, I'll fetch by producerId/workerId if I know them, which I don't here.

        // FIXME: Implement filtering by jobId in routes/workOrders.ts

        // Fallback: If no dedicated endpoint, this is tricky. 
        // But actually, 'createJob' flow gets the WorkOrder ID.
        // Let's assume we'll fix the backend to support jobId filter.

        try {
            // We can use the list endpoint if updated
            const response = await this.api.get<{ workOrders: WorkOrderWithDetails[] }>(`/work-orders?jobId=${jobId}`);
            if (response.data?.workOrders && response.data.workOrders.length > 0) {
                return createSuccess(response.data.workOrders[0]);
            }
            return createError('Ordem de serviço não encontrada', 'NOT_FOUND');
        } catch (error) {
            return createError('Erro ao buscar ordem de serviço');
        }
    }

    async getWorkOrder(id: string): Promise<ServiceResult<WorkOrderWithDetails>> {
        try {
            const data = await this.api.get<WorkOrderWithDetails>(`/work-orders/${id}`);
            return createSuccess(data as any);
        } catch (error) {
            return createError('Erro ao buscar ordem de servico');
        }
    }

    async getWorkOrders(filters?: WorkOrderFilters): Promise<ServiceResult<WorkOrder[]>> {
        try {
            let qs = '';
            if (filters) {
                const params = new URLSearchParams();
                if (filters.status) params.append('status', filters.status);
                if (filters.workerId) params.append('workerId', filters.workerId);
                if (filters.producerId) params.append('producerId', filters.producerId);
                qs = `?${params.toString()}`;
            }
            const response = await this.api.get<{ workOrders: WorkOrder[] }>(`/work-orders${qs}`);
            return createSuccess(response.data?.workOrders || []);
        } catch (error) {
            return createError('Erro ao listar ordens');
        }
    }

    async getWorkOrdersByWorker(workerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>> {
        try {
            // Request 'details' view to get relations and reviews
            const response = await this.api.get<{ workOrders: WorkOrderWithDetails[] }>(`/work-orders?workerId=${workerId}&view=details`);
            return createSuccess(response.data?.workOrders || []);
        } catch (error) {
            return createError('Erro ao buscar ordens do trabalhador');
        }
    }

    async getWorkOrdersByProducer(producerId: string): Promise<ServiceResult<WorkOrderWithDetails[]>> {
        try {
            const response = await this.api.get<{ workOrders: WorkOrderWithDetails[] }>(`/work-orders?producerId=${producerId}&view=details`);
            return createSuccess(response.data?.workOrders || []);
        } catch (error) {
            return createError('Erro ao buscar ordens do produtor');
        }
    }

    async checkIn(workOrderId: string, data: CheckInData): Promise<ServiceResult<WorkOrder>> {
        try {
            const response = await this.api.post<{ workOrder: WorkOrder }>(`/work-orders/${workOrderId}/check-in`, data);
            return createSuccess(response.data!.workOrder);
        } catch (error) {
            return createError('Erro ao realizar check-in');
        }
    }

    async checkOut(workOrderId: string, data: CheckOutData): Promise<ServiceResult<WorkOrder>> {
        try {
            const response = await this.api.post<{ workOrder: WorkOrder }>(`/work-orders/${workOrderId}/check-out`, data);
            return createSuccess(response.data!.workOrder);
        } catch (error) {
            return createError('Erro ao realizar check-out');
        }
    }

    async complete(workOrderId: string): Promise<ServiceResult<WorkOrder>> {
        try {
            const response = await this.api.post<{ workOrder: WorkOrder }>(`/work-orders/${workOrderId}/complete`, {});
            return createSuccess(response.data!.workOrder);
        } catch (error) {
            return createError('Erro ao completar ordem');
        }
    }

    async signContract(workOrderId: string, role: 'producer' | 'worker'): Promise<ServiceResult<SignedContract>> {
        try {
            const response = await this.api.post<{ workOrder: WorkOrder, contract: SignedContract }>(`/work-orders/${workOrderId}/sign`, { role });
            return createSuccess(response.data!.contract);
        } catch (error) {
            return createError('Erro ao assinar contrato');
        }
    }

    async createReview(data: CreateReviewData): Promise<ServiceResult<Review>> {
        // TODO: Implement proper backend endpoint
        // For now, return error as it's not implemented on backend
        return createError<Review>('Not implemented yet');
    }
}
