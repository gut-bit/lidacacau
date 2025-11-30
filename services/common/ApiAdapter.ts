/**
 * LidaCacau - API Adapter
 * 
 * Adaptador HTTP para conexao com backend PostgreSQL.
 * Substitui AsyncStorageAdapter em ambiente de producao.
 * 
 * Configuracao:
 * - Defina API_BASE_URL no ambiente
 * - Use ServiceFactory.setMode('production') para ativar
 */

import { ServiceResult, createSuccess, createError } from './types';

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class ApiAdapter {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ServiceResult<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ServiceResult<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ServiceResult<T>> {
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = `HTTP_${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        errorCode = errorJson.code || errorCode;
      } catch {
        if (errorBody) {
          errorMessage = errorBody;
        }
      }

      return createError<T>(errorMessage, errorCode);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json: ApiResponse<T> = await response.json();
      if (json.success === false) {
        return createError<T>(json.error || 'Erro desconhecido', json.code);
      }
      return createSuccess<T>(json.data as T);
    }

    return createSuccess<T>(undefined as T);
  }

  private handleError<T>(error: any): ServiceResult<T> {
    if (error.name === 'AbortError') {
      return createError<T>('Tempo limite da requisicao excedido', 'TIMEOUT');
    }

    if (error instanceof TypeError && error.message.includes('Network')) {
      return createError<T>('Sem conexao com a internet', 'NETWORK_ERROR');
    }

    return createError<T>(
      error.message || 'Erro de conexao com o servidor',
      'CONNECTION_ERROR'
    );
  }
}

let apiAdapterInstance: ApiAdapter | null = null;

export function getApiAdapter(): ApiAdapter {
  if (!apiAdapterInstance) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';
    apiAdapterInstance = new ApiAdapter({ baseUrl });
  }
  return apiAdapterInstance;
}

export function initializeApiAdapter(config: ApiConfig): ApiAdapter {
  apiAdapterInstance = new ApiAdapter(config);
  return apiAdapterInstance;
}
