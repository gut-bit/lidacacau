/**
 * LidaCacau - API Adapter
 * 
 * Adaptador HTTP para conexao com backend PostgreSQL.
 * Em desenvolvimento no Replit, usa porta 8000 (mapeada da 5000).
 * Em producao, usa caminhos relativos.
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

function getBaseUrl(): string {
  try {
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    
    if (typeof window !== 'undefined' && window.location) {
      if (isDev) {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const devApiUrl = `${protocol}//${hostname}:8000/api`;
        console.log('[ApiAdapter] Development mode - API URL:', devApiUrl);
        return devApiUrl;
      }
      return '/api';
    }
    
    return '/api';
  } catch {
    return '/api';
  }
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
    console.log('[ApiAdapter] Initialized with base URL:', this.baseUrl);
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
      let url = `${this.baseUrl}${endpoint}`;
      
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      console.log('[ApiAdapter] GET', url);
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('[ApiAdapter] GET error:', error);
      return this.handleError<T>(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[ApiAdapter] POST', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('[ApiAdapter] POST error:', error);
      return this.handleError<T>(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[ApiAdapter] PUT', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('[ApiAdapter] PUT error:', error);
      return this.handleError<T>(error);
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ServiceResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[ApiAdapter] PATCH', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('[ApiAdapter] PATCH error:', error);
      return this.handleError<T>(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ServiceResult<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('[ApiAdapter] DELETE', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('[ApiAdapter] DELETE error:', error);
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
    console.log('[ApiAdapter] Response status:', response.status);
    
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

      console.error('[ApiAdapter] Error response:', errorMessage);
      return createError<T>(errorMessage, errorCode);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      console.log('[ApiAdapter] JSON response received');
      
      if (json.success === false) {
        return createError<T>(json.error || 'Erro desconhecido', json.code);
      }
      
      const responseData = json.data !== undefined ? json.data : json;
      return createSuccess<T>(responseData as T);
    }

    return createSuccess<T>(undefined as T);
  }

  private handleError<T>(error: any): ServiceResult<T> {
    const errorMessage = error?.message || 'Erro de conexao';
    const errorName = error?.name || 'Error';
    
    console.error('[ApiAdapter] Handle error:', errorName, errorMessage);
    
    if (errorName === 'AbortError') {
      return createError<T>('Tempo limite da requisicao excedido', 'TIMEOUT');
    }

    if (error instanceof TypeError && errorMessage.includes('Network')) {
      return createError<T>('Sem conexao com a internet', 'NETWORK_ERROR');
    }

    if (errorMessage.includes('Failed to fetch')) {
      return createError<T>('Servidor indisponivel. Verifique sua conexao.', 'CONNECTION_ERROR');
    }

    return createError<T>(errorMessage, 'CONNECTION_ERROR');
  }
}

let apiAdapterInstance: ApiAdapter | null = null;

export function getApiAdapter(): ApiAdapter {
  if (!apiAdapterInstance) {
    const baseUrl = getBaseUrl();
    apiAdapterInstance = new ApiAdapter({ baseUrl });
  }
  return apiAdapterInstance;
}

export function initializeApiAdapter(config: ApiConfig): ApiAdapter {
  apiAdapterInstance = new ApiAdapter(config);
  return apiAdapterInstance;
}
