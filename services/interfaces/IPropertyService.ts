/**
 * LidaCacau - Interface de Serviço de Propriedades Rurais
 * 
 * Define o contrato para gerenciamento de propriedades e talhões.
 */

import { PropertyDetail, Talhao, PropertyDocument, TalhaoServiceTag, PolygonGeometry } from '@/types';

export interface CreatePropertyData {
  name: string;
  ownerId: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  coverPhoto?: string;
  photos?: string[];
  size?: number;
  description?: string;
}

export interface CreateTalhaoData {
  propertyId: string;
  name: string;
  cropType: string;
  area?: number;
  geometry?: PolygonGeometry;
  status?: 'active' | 'fallow' | 'planted' | 'harvesting';
}

export interface CreateDocumentData {
  propertyId: string;
  type: 'car' | 'titulo' | 'licenca_ambiental' | 'outros';
  name: string;
  url: string;
  uploadedBy: string;
}

export interface PropertyFilters {
  ownerId?: string;
  verified?: boolean;
  hasCAR?: boolean;
  location?: string;
}

export interface IPropertyService {
  // Propriedades
  getProperties(filters?: PropertyFilters): Promise<PropertyDetail[]>;
  getPropertyById(id: string): Promise<PropertyDetail | null>;
  getPropertiesByOwner(ownerId: string): Promise<PropertyDetail[]>;
  createProperty(data: CreatePropertyData): Promise<PropertyDetail>;
  updateProperty(propertyId: string, updates: Partial<PropertyDetail>): Promise<PropertyDetail | null>;
  deleteProperty(propertyId: string): Promise<boolean>;
  
  // Talhões
  getTalhoesByProperty(propertyId: string): Promise<Talhao[]>;
  getTalhaoById(id: string): Promise<Talhao | null>;
  createTalhao(data: CreateTalhaoData): Promise<Talhao>;
  updateTalhao(talhaoId: string, updates: Partial<Talhao>): Promise<Talhao | null>;
  deleteTalhao(talhaoId: string): Promise<boolean>;
  
  // Service Tags
  addServiceTag(talhaoId: string, tag: Omit<TalhaoServiceTag, 'id' | 'createdAt'>): Promise<TalhaoServiceTag>;
  removeServiceTag(talhaoId: string, tagId: string): Promise<boolean>;
  
  // Documentos
  getDocumentsByProperty(propertyId: string): Promise<PropertyDocument[]>;
  addDocument(data: CreateDocumentData): Promise<PropertyDocument>;
  updateDocumentStatus(documentId: string, status: 'pending' | 'verified' | 'rejected'): Promise<PropertyDocument | null>;
  deleteDocument(documentId: string): Promise<boolean>;
  
  // Polygon/Mapa
  updatePropertyBoundary(propertyId: string, boundary: PolygonGeometry): Promise<PropertyDetail | null>;
  updateTalhaoGeometry(talhaoId: string, geometry: PolygonGeometry): Promise<Talhao | null>;
}
