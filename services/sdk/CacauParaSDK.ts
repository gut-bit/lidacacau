/**
 * Cacau Para SDK - Modulo Nativo LidaCacau
 * 
 * Sistema de precos de cacau integrado nativamente ao LidaCacau.
 * Funciona offline-first com sincronizacao automatica.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@lidacacau_cacau_prices_cache';
const CACHE_TIMESTAMP_KEY = '@lidacacau_cacau_prices_timestamp';
const PENDING_SUBMISSIONS_KEY = '@lidacacau_cacau_pending_submissions';
const METRICS_CACHE_KEY = '@lidacacau_cacau_metrics_cache';

// Cidades suportadas para precos de cacau na regiao
export const SUPPORTED_CITIES = [
  'Uruará',
  'Medicilândia',
  'Brasil Novo',
  'Altamira',
  'Placas',
  'Rurópolis',
  'Vitória do Xingu',
  'Senador José Porfírio',
  'Porto de Moz',
  'Anapu',
] as const;

export interface PriceSubmission {
  id: string;
  userId?: string | null;
  buyerName: string;
  city: string;
  region: string | null;
  pricePerKg: string;
  conditions: string | null;
  proofImageUrl?: string | null;
  proofPhotoUri?: string | null;
  source?: string;
  status?: string;
  submitterName?: string | null;
  createdAt: string;
}

export interface SubmitPriceInput {
  buyerName: string;
  city: string;
  pricePerKg: number;
  conditions?: string;
  proofPhotoUri?: string;
  submitterName?: string;
  submitterPhone?: string;
}

export interface PriceMetrics {
  thirtyDays: CityMetric[];
  sevenDays: CityMetric[];
  bestPrice: PriceSubmission | null;
  cities: string[];
}

export interface CityMetric {
  city: string;
  avgPrice: string;
  minPrice?: string;
  maxPrice?: string;
  count?: number;
}

export interface CommunityNote {
  id: string;
  priceSubmissionId: string;
  userId: string;
  noteType: 'correction' | 'context' | 'concern';
  content: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
}

export interface AddNoteInput {
  userId: string;
  noteType: 'correction' | 'context' | 'concern';
  content: string;
}

interface PendingSubmission {
  id: string;
  input: SubmitPriceInput;
  timestamp: string;
  retries: number;
}

export class CacauParaError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CacauParaError';
  }
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export class CacauParaClient {
  private apiUrl: string;
  private authToken?: string;
  private timeout: number;

  constructor() {
    this.apiUrl = getApiBaseUrl();
    this.timeout = 10000;
  }

  setAuthToken(token: string | undefined) {
    this.authToken = token;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CacauParaError(
          `Request failed: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof CacauParaError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CacauParaError('Request timeout', 408);
      }
      throw new CacauParaError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      );
    }
  }

  async listPrices(): Promise<PriceSubmission[]> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission[] }>(
        'GET', '/api/cacau-precos'
      );
      if (response.success && response.data) {
        await this.cachePrices(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.log('[CacauPara] API failed, returning cached prices...');
      const cached = await this.getCachedPrices();
      if (cached.length > 0) {
        return cached;
      }
      throw error;
    }
  }

  async submitPrice(input: SubmitPriceInput): Promise<{ success: boolean; data?: PriceSubmission; message?: string; pending?: boolean }> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission; message: string }>(
        'POST', '/api/cacau-precos', input
      );
      return response;
    } catch (error) {
      console.log('[CacauPara] Submit failed, saving offline...');
      await this.savePendingSubmission(input);
      return {
        success: true,
        pending: true,
        message: 'Preco salvo offline. Sera enviado quando houver conexao.',
      };
    }
  }

  async getMetrics(): Promise<PriceMetrics | null> {
    try {
      const response = await this.request<{ success: boolean; data: PriceMetrics }>(
        'GET', '/api/cacau-precos/metrics'
      );
      if (response.success) {
        await this.cacheMetrics(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.log('[CacauPara] Metrics fetch failed, returning cached...');
      return this.getCachedMetrics();
    }
  }

  async getMySubmissions(): Promise<PriceSubmission[]> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission[] }>(
        'GET', '/api/cacau-precos/my-submissions'
      );
      return response.data || [];
    } catch (error) {
      console.error('[CacauPara] Error fetching my submissions:', error);
      return [];
    }
  }

  private async cachePrices(prices: PriceSubmission[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(prices));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('[CacauPara] Cache write error:', error);
    }
  }

  async getCachedPrices(): Promise<PriceSubmission[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[CacauPara] Cache read error:', error);
      return [];
    }
  }

  async getCacheTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    } catch {
      return null;
    }
  }

  private async cacheMetrics(metrics: PriceMetrics): Promise<void> {
    try {
      await AsyncStorage.setItem(METRICS_CACHE_KEY, JSON.stringify({
        data: metrics,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[CacauPara] Metrics cache write error:', error);
    }
  }

  private async getCachedMetrics(): Promise<PriceMetrics | null> {
    try {
      const cached = await AsyncStorage.getItem(METRICS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('[CacauPara] Metrics cache read error:', error);
      return null;
    }
  }

  private async savePendingSubmission(input: SubmitPriceInput): Promise<void> {
    try {
      const pending = await this.getPendingSubmissions();
      const newSubmission: PendingSubmission = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        input,
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      pending.push(newSubmission);
      await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('[CacauPara] Error saving pending submission:', error);
    }
  }

  async getPendingSubmissions(): Promise<PendingSubmission[]> {
    try {
      const pending = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('[CacauPara] Error reading pending submissions:', error);
      return [];
    }
  }

  async syncPendingSubmissions(): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingSubmissions();
    let synced = 0;
    let failed = 0;
    const remaining: PendingSubmission[] = [];

    for (const submission of pending) {
      try {
        await this.request<{ success: boolean }>(
          'POST', '/api/cacau-precos', submission.input
        );
        synced++;
      } catch (error) {
        submission.retries++;
        if (submission.retries < 5) {
          remaining.push(submission);
        }
        failed++;
      }
    }

    await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(remaining));
    
    if (synced > 0) {
      console.log(`[CacauPara] Synced ${synced} pending submissions`);
    }
    
    return { synced, failed };
  }

  async hasPendingSubmissions(): Promise<boolean> {
    const pending = await this.getPendingSubmissions();
    return pending.length > 0;
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEY,
        CACHE_TIMESTAMP_KEY,
        METRICS_CACHE_KEY,
      ]);
    } catch (error) {
      console.error('[CacauPara] Error clearing cache:', error);
    }
  }

  // Utility methods
  findBestPrice(prices: PriceSubmission[]): PriceSubmission | null {
    if (prices.length === 0) return null;
    return prices.reduce((best, current) => {
      const bestPrice = parseFloat(best.pricePerKg);
      const currentPrice = parseFloat(current.pricePerKg);
      return currentPrice > bestPrice ? current : best;
    });
  }

  filterByCity(prices: PriceSubmission[], city: string): PriceSubmission[] {
    if (city === 'all') return prices;
    return prices.filter(p => p.city === city);
  }

  generateWhatsAppShareLink(price: PriceSubmission): string {
    const message = encodeURIComponent(
      `Preco do Cacau em ${price.city}: R$ ${price.pricePerKg}/kg - ${price.buyerName}\n\nVia LidaCacau`
    );
    return `https://wa.me/?text=${message}`;
  }
}

// Instancia singleton do cliente
export const cacauParaClient = new CacauParaClient();

// Funcao de inicializacao (para compatibilidade)
export function initCacauParaClient(authToken?: string): CacauParaClient {
  if (authToken) {
    cacauParaClient.setAuthToken(authToken);
  }
  return cacauParaClient;
}
