/**
 * LidaCacau - Common Service Types
 * 
 * Tipos compartilhados por todos os serviços.
 * Padrão Result para tratamento de erros consistente.
 */

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type EntityId = string;

export function createSuccess<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function createError<T>(error: string, code?: string): ServiceResult<T> {
  return { success: false, error, code };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
