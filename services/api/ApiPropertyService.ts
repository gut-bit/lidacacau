import { 
  IPropertyService, 
  CreatePropertyData, 
  PropertyFilters,
  PropertyDetail,
  PolygonGeometry,
  Talhao,
  PropertyDocument
} from '../interfaces/IPropertyService';
import { getApiAdapter } from '../common/ApiAdapter';
import { ServiceResult, createSuccess, createError } from '../common/types';

interface PropertiesResponse {
  properties: PropertyDetail[];
}

interface PropertyResponse {
  property: PropertyDetail;
}

interface TalhaoResponse {
  talhao: Talhao;
}

interface DocumentResponse {
  document: PropertyDocument;
}

export class ApiPropertyService implements IPropertyService {
  private api = getApiAdapter();

  async createProperty(data: CreatePropertyData): Promise<ServiceResult<PropertyDetail>> {
    const result = await this.api.post<PropertyResponse>('/properties', data);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao criar propriedade', result.code);
    }

    return createSuccess(result.data.property);
  }

  async getProperty(id: string): Promise<ServiceResult<PropertyDetail>> {
    const result = await this.api.get<PropertyResponse>(`/properties/${id}`);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Propriedade não encontrada', result.code);
    }

    return createSuccess(result.data.property);
  }

  async getProperties(filters?: PropertyFilters): Promise<ServiceResult<PropertyDetail[]>> {
    const params: Record<string, any> = {};
    if (filters?.ownerId) params.ownerId = filters.ownerId;
    if (filters?.city) params.city = filters.city;
    if (filters?.state) params.state = filters.state;
    if (filters?.verificationStatus) params.verificationStatus = filters.verificationStatus;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const result = await this.api.get<PropertiesResponse>('/properties', params);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar propriedades', result.code);
    }

    return createSuccess(result.data.properties);
  }

  async getPropertiesByOwner(ownerId: string): Promise<ServiceResult<PropertyDetail[]>> {
    const result = await this.api.get<PropertiesResponse>('/properties', { ownerId });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao buscar propriedades do produtor', result.code);
    }

    return createSuccess(result.data.properties);
  }

  async updateProperty(id: string, updates: Partial<PropertyDetail>): Promise<ServiceResult<PropertyDetail>> {
    const result = await this.api.patch<PropertyResponse>(`/properties/${id}`, updates);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao atualizar propriedade', result.code);
    }

    return createSuccess(result.data.property);
  }

  async deleteProperty(id: string): Promise<ServiceResult<void>> {
    const result = await this.api.delete(`/properties/${id}`);
    
    if (!result.success) {
      return createError(result.error || 'Erro ao excluir propriedade', result.code);
    }

    return createSuccess(undefined);
  }

  async updatePolygonBoundary(propertyId: string, polygon: PolygonGeometry): Promise<ServiceResult<PropertyDetail>> {
    const result = await this.api.patch<PropertyResponse>(`/properties/${propertyId}/boundary`, { polygon });
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao atualizar limites da propriedade', result.code);
    }

    return createSuccess(result.data.property);
  }

  async addTalhao(propertyId: string, talhao: Omit<Talhao, 'id'>): Promise<ServiceResult<Talhao>> {
    const result = await this.api.post<TalhaoResponse>(`/properties/${propertyId}/talhoes`, talhao);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao adicionar talhão', result.code);
    }

    return createSuccess(result.data.talhao);
  }

  async updateTalhao(propertyId: string, talhaoId: string, updates: Partial<Talhao>): Promise<ServiceResult<Talhao>> {
    const result = await this.api.patch<TalhaoResponse>(`/properties/${propertyId}/talhoes/${talhaoId}`, updates);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao atualizar talhão', result.code);
    }

    return createSuccess(result.data.talhao);
  }

  async removeTalhao(propertyId: string, talhaoId: string): Promise<ServiceResult<void>> {
    const result = await this.api.delete(`/properties/${propertyId}/talhoes/${talhaoId}`);
    
    if (!result.success) {
      return createError(result.error || 'Erro ao remover talhão', result.code);
    }

    return createSuccess(undefined);
  }

  async addDocument(propertyId: string, document: Omit<PropertyDocument, 'id' | 'uploadedAt'>): Promise<ServiceResult<PropertyDocument>> {
    const result = await this.api.post<DocumentResponse>(`/properties/${propertyId}/documents`, document);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao adicionar documento', result.code);
    }

    return createSuccess(result.data.document);
  }

  async removeDocument(propertyId: string, documentId: string): Promise<ServiceResult<void>> {
    const result = await this.api.delete(`/properties/${propertyId}/documents/${documentId}`);
    
    if (!result.success) {
      return createError(result.error || 'Erro ao remover documento', result.code);
    }

    return createSuccess(undefined);
  }

  async requestVerification(propertyId: string): Promise<ServiceResult<PropertyDetail>> {
    const result = await this.api.post<PropertyResponse>(`/properties/${propertyId}/verify`);
    
    if (!result.success || !result.data) {
      return createError(result.error || 'Erro ao solicitar verificação', result.code);
    }

    return createSuccess(result.data.property);
  }
}
