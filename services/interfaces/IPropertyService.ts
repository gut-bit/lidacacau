/**
 * LidaCacau - Interface de Serviço de Propriedades
 * 
 * Define o contrato para operações de propriedades rurais.
 */

import { ServiceResult, ListFilters } from '../common/types';

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface ServiceTag {
  id: string;
  serviceTypeId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

export interface Talhao {
  id: string;
  name: string;
  areaHectares: number;
  cropType: 'cacau' | 'cafe' | 'banana' | 'pasto' | 'reserva' | 'outro';
  serviceTags: ServiceTag[];
  notes?: string;
}

export interface PropertyDocument {
  id: string;
  type: 'car' | 'matricula' | 'licenca_ambiental' | 'outro';
  name: string;
  fileUri: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface PropertyDetail {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  areaHectares?: number;
  latitude: number;
  longitude: number;
  polygonBoundary?: PolygonGeometry;
  talhoes?: Talhao[];
  documents?: PropertyDocument[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  coverPhotoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyData {
  ownerId: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  areaHectares?: number;
  coverPhotoUri?: string;
}

export interface PropertyFilters extends ListFilters {
  ownerId?: string;
  city?: string;
  state?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface IPropertyService {
  createProperty(data: CreatePropertyData): Promise<ServiceResult<PropertyDetail>>;
  
  getProperty(id: string): Promise<ServiceResult<PropertyDetail>>;
  
  getProperties(filters?: PropertyFilters): Promise<ServiceResult<PropertyDetail[]>>;
  
  getPropertiesByOwner(ownerId: string): Promise<ServiceResult<PropertyDetail[]>>;
  
  updateProperty(id: string, updates: Partial<PropertyDetail>): Promise<ServiceResult<PropertyDetail>>;
  
  deleteProperty(id: string): Promise<ServiceResult<void>>;
  
  updatePolygonBoundary(propertyId: string, polygon: PolygonGeometry): Promise<ServiceResult<PropertyDetail>>;
  
  addTalhao(propertyId: string, talhao: Omit<Talhao, 'id'>): Promise<ServiceResult<Talhao>>;
  
  updateTalhao(propertyId: string, talhaoId: string, updates: Partial<Talhao>): Promise<ServiceResult<Talhao>>;
  
  removeTalhao(propertyId: string, talhaoId: string): Promise<ServiceResult<void>>;
  
  addDocument(propertyId: string, document: Omit<PropertyDocument, 'id' | 'uploadedAt'>): Promise<ServiceResult<PropertyDocument>>;
  
  removeDocument(propertyId: string, documentId: string): Promise<ServiceResult<void>>;
  
  requestVerification(propertyId: string): Promise<ServiceResult<PropertyDetail>>;
}
