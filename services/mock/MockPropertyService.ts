/**
 * LidaCacau - Mock Property Service
 * 
 * Implementação mock usando AsyncStorage para propriedades rurais.
 */

import { 
  IPropertyService,
  PropertyDetail,
  CreatePropertyData,
  PropertyFilters,
  PolygonGeometry,
  Talhao,
  PropertyDocument
} from '../interfaces/IPropertyService';
import { ServiceResult, createSuccess, createError } from '../common/types';
import storageAdapter, { StorageKeys } from '../common/AsyncStorageAdapter';

export class MockPropertyService implements IPropertyService {
  async createProperty(data: CreatePropertyData): Promise<ServiceResult<PropertyDetail>> {
    try {
      const now = new Date().toISOString();
      const property: PropertyDetail = {
        id: storageAdapter.generateId(),
        ...data,
        city: data.city || 'Uruara',
        state: data.state || 'PA',
        talhoes: [],
        documents: [],
        verificationStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await storageAdapter.addToList(StorageKeys.PROPERTIES, property);
      return createSuccess(property);
    } catch (error) {
      return createError('Erro ao criar propriedade');
    }
  }

  async getProperty(id: string): Promise<ServiceResult<PropertyDetail>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, id);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }
      return createSuccess(property);
    } catch (error) {
      return createError('Erro ao buscar propriedade');
    }
  }

  async getProperties(filters?: PropertyFilters): Promise<ServiceResult<PropertyDetail[]>> {
    try {
      let properties = await storageAdapter.getList<PropertyDetail>(StorageKeys.PROPERTIES);

      if (filters) {
        if (filters.ownerId) {
          properties = properties.filter(p => p.ownerId === filters.ownerId);
        }
        if (filters.city) {
          properties = properties.filter(p => p.city === filters.city);
        }
        if (filters.state) {
          properties = properties.filter(p => p.state === filters.state);
        }
        if (filters.verificationStatus) {
          properties = properties.filter(p => p.verificationStatus === filters.verificationStatus);
        }
      }

      properties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return createSuccess(properties);
    } catch (error) {
      return createError('Erro ao listar propriedades');
    }
  }

  async getPropertiesByOwner(ownerId: string): Promise<ServiceResult<PropertyDetail[]>> {
    return this.getProperties({ ownerId });
  }

  async updateProperty(id: string, updates: Partial<PropertyDetail>): Promise<ServiceResult<PropertyDetail>> {
    try {
      const updated = await storageAdapter.updateInList<PropertyDetail>(StorageKeys.PROPERTIES, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      if (!updated) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      return createSuccess(updated);
    } catch (error) {
      return createError('Erro ao atualizar propriedade');
    }
  }

  async deleteProperty(id: string): Promise<ServiceResult<void>> {
    try {
      await storageAdapter.removeFromList<PropertyDetail>(StorageKeys.PROPERTIES, id);
      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao excluir propriedade');
    }
  }

  async updatePolygonBoundary(propertyId: string, polygon: PolygonGeometry): Promise<ServiceResult<PropertyDetail>> {
    try {
      const coords = polygon.coordinates[0];
      let area = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1];
        area -= coords[i + 1][0] * coords[i][1];
      }
      area = Math.abs(area) / 2;
      const areaHectares = area * 111 * 111 * 100;

      return this.updateProperty(propertyId, {
        polygonBoundary: polygon,
        areaHectares: Math.round(areaHectares * 100) / 100,
      });
    } catch (error) {
      return createError('Erro ao atualizar poligono');
    }
  }

  async addTalhao(propertyId: string, talhaoData: Omit<Talhao, 'id'>): Promise<ServiceResult<Talhao>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, propertyId);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      const talhao: Talhao = {
        id: storageAdapter.generateId(),
        ...talhaoData,
      };

      const talhoes = [...(property.talhoes || []), talhao];
      await this.updateProperty(propertyId, { talhoes });

      return createSuccess(talhao);
    } catch (error) {
      return createError('Erro ao adicionar talhao');
    }
  }

  async updateTalhao(propertyId: string, talhaoId: string, updates: Partial<Talhao>): Promise<ServiceResult<Talhao>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, propertyId);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      const talhoes = property.talhoes || [];
      const index = talhoes.findIndex(t => t.id === talhaoId);
      if (index === -1) {
        return createError('Talhao nao encontrado', 'NOT_FOUND');
      }

      talhoes[index] = { ...talhoes[index], ...updates };
      await this.updateProperty(propertyId, { talhoes });

      return createSuccess(talhoes[index]);
    } catch (error) {
      return createError('Erro ao atualizar talhao');
    }
  }

  async removeTalhao(propertyId: string, talhaoId: string): Promise<ServiceResult<void>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, propertyId);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      const talhoes = (property.talhoes || []).filter(t => t.id !== talhaoId);
      await this.updateProperty(propertyId, { talhoes });

      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao remover talhao');
    }
  }

  async addDocument(propertyId: string, docData: Omit<PropertyDocument, 'id' | 'uploadedAt'>): Promise<ServiceResult<PropertyDocument>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, propertyId);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      const document: PropertyDocument = {
        id: storageAdapter.generateId(),
        ...docData,
        uploadedAt: new Date().toISOString(),
      };

      const documents = [...(property.documents || []), document];
      await this.updateProperty(propertyId, { documents });

      return createSuccess(document);
    } catch (error) {
      return createError('Erro ao adicionar documento');
    }
  }

  async removeDocument(propertyId: string, documentId: string): Promise<ServiceResult<void>> {
    try {
      const property = await storageAdapter.findById<PropertyDetail>(StorageKeys.PROPERTIES, propertyId);
      if (!property) {
        return createError('Propriedade nao encontrada', 'NOT_FOUND');
      }

      const documents = (property.documents || []).filter(d => d.id !== documentId);
      await this.updateProperty(propertyId, { documents });

      return createSuccess(undefined);
    } catch (error) {
      return createError('Erro ao remover documento');
    }
  }

  async requestVerification(propertyId: string): Promise<ServiceResult<PropertyDetail>> {
    return this.updateProperty(propertyId, { verificationStatus: 'pending' });
  }
}

export const mockPropertyService = new MockPropertyService();
