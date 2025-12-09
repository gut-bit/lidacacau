/**
 * Cacau Para SDK
 * 
 * Modulo de integracao para consultar e enviar precos de cacau
 * Integra o Lidacacau com a plataforma Cacau Para (https://cacaupara.replit.app)
 * e com a API local do LidaCacau para persistencia
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@lidacacau_cacau_prices_cache';
const CACHE_TIMESTAMP_KEY = '@lidacacau_cacau_prices_timestamp';
const PENDING_SUBMISSIONS_KEY = '@lidacacau_cacau_pending_submissions';
const METRICS_CACHE_KEY = '@lidacacau_cacau_metrics_cache';

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

export interface AddNoteInput {
  userId: string;
  noteType: 'correction' | 'context' | 'concern';
  content: string;
}

export interface SDKConfig {
  baseUrl: string;
  localApiUrl?: string;
  authToken?: string;
  timeout?: number;
}

export interface CachedData<T> {
  data: T;
  timestamp: string;
  source: 'api' | 'cache';
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

function getLocalApiUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export class CacauParaClient {
  private externalBaseUrl: string;
  private localApiUrl: string;
  private authToken?: string;
  private timeout: number;

  constructor(config: string | SDKConfig) {
    if (typeof config === 'string') {
      this.externalBaseUrl = config.replace(/\/$/, '');
      this.localApiUrl = getLocalApiUrl();
      this.timeout = 10000;
    } else {
      this.externalBaseUrl = config.baseUrl.replace(/\/$/, '');
      this.localApiUrl = config.localApiUrl || getLocalApiUrl();
      this.authToken = config.authToken;
      this.timeout = config.timeout || 10000;
    }
  }

  setAuthToken(token: string | undefined) {
    this.authToken = token;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    useLocalApi = false
  ): Promise<T> {
    const baseUrl = useLocalApi ? this.localApiUrl : this.externalBaseUrl;
    const url = `${baseUrl}${endpoint}`;
    
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
      const data = await this.request<PriceSubmission[]>('GET', '/api/prices');
      await this.cachePrices(data);
      return data;
    } catch (error) {
      console.log('[CacauParaSDK] External API failed, trying local API...');
      try {
        const response = await this.request<{ success: boolean; data: PriceSubmission[] }>(
          'GET', '/api/cacau-precos', undefined, true
        );
        if (response.success && response.data.length > 0) {
          await this.cachePrices(response.data);
          return response.data;
        }
      } catch (localError) {
        console.log('[CacauParaSDK] Local API also failed');
      }
      
      const cached = await this.getCachedPrices();
      if (cached.length > 0) {
        console.log('[CacauParaSDK] Returning cached prices');
        return cached;
      }
      throw error;
    }
  }

  async listLocalPrices(): Promise<PriceSubmission[]> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission[] }>(
        'GET', '/api/cacau-precos', undefined, true
      );
      return response.data || [];
    } catch (error) {
      console.error('[CacauParaSDK] Error fetching local prices:', error);
      return [];
    }
  }

  async submitPrice(input: SubmitPriceInput): Promise<{ success: boolean; data?: PriceSubmission; message?: string; pending?: boolean }> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission; message: string }>(
        'POST', '/api/cacau-precos', input, true
      );
      return response;
    } catch (error) {
      console.log('[CacauParaSDK] Submit failed, saving offline...');
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
        'GET', '/api/cacau-precos/metrics', undefined, true
      );
      if (response.success) {
        await this.cacheMetrics(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.log('[CacauParaSDK] Metrics fetch failed, returning cached...');
      return this.getCachedMetrics();
    }
  }

  async getMySubmissions(): Promise<PriceSubmission[]> {
    try {
      const response = await this.request<{ success: boolean; data: PriceSubmission[] }>(
        'GET', '/api/cacau-precos/my-submissions', undefined, true
      );
      return response.data || [];
    } catch (error) {
      console.error('[CacauParaSDK] Error fetching my submissions:', error);
      return [];
    }
  }

  async getPriceNotes(priceId: string): Promise<CommunityNote[]> {
    return this.request<CommunityNote[]>('GET', `/api/prices/${priceId}/notes`);
  }

  async addPriceNote(priceId: string, input: AddNoteInput): Promise<CommunityNote> {
    return this.request<CommunityNote>('POST', `/api/prices/${priceId}/notes`, input);
  }

  private async cachePrices(prices: PriceSubmission[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(prices));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('[CacauParaSDK] Cache write error:', error);
    }
  }

  async getCachedPrices(): Promise<PriceSubmission[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[CacauParaSDK] Cache read error:', error);
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
      console.error('[CacauParaSDK] Metrics cache write error:', error);
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
    } catch {
      return null;
    }
  }

  private async savePendingSubmission(input: SubmitPriceInput): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
      const pending: PendingSubmission[] = existing ? JSON.parse(existing) : [];
      
      pending.push({
        id: `pending_${Date.now()}`,
        input,
        timestamp: new Date().toISOString(),
        retries: 0,
      });

      await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('[CacauParaSDK] Save pending error:', error);
    }
  }

  async getPendingSubmissions(): Promise<PendingSubmission[]> {
    try {
      const pending = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch {
      return [];
    }
  }

  async syncPendingSubmissions(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingSubmissions();
      const remaining: PendingSubmission[] = [];

      for (const submission of pending) {
        try {
          await this.request<{ success: boolean }>(
            'POST', '/api/cacau-precos', submission.input, true
          );
          synced++;
        } catch {
          submission.retries++;
          if (submission.retries < 5) {
            remaining.push(submission);
          }
          failed++;
        }
      }

      await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(remaining));
    } catch (error) {
      console.error('[CacauParaSDK] Sync error:', error);
    }

    return { synced, failed };
  }

  generateWhatsAppShareLink(price: PriceSubmission, phoneNumber?: string): string {
    const message = [
      'Preco de cacau atualizado no LidaCacau:',
      `Comprador: ${price.buyerName}`,
      `Cidade: ${price.city}`,
      `Preco: R$ ${price.pricePerKg}/kg`,
      price.conditions ? `Condicoes: ${price.conditions}` : '',
      '',
      'Via LidaCacau - Cacau Para',
    ].filter(Boolean).join('\n');

    const encodedMessage = encodeURIComponent(message);
    
    if (phoneNumber) {
      return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }
    return `https://wa.me/?text=${encodedMessage}`;
  }

  findBestPrice(prices: PriceSubmission[]): PriceSubmission | null {
    if (prices.length === 0) return null;
    
    return prices.reduce((best, current) => {
      const bestPrice = parseFloat(best.pricePerKg);
      const currentPrice = parseFloat(current.pricePerKg);
      return currentPrice > bestPrice ? current : best;
    });
  }

  filterByCity(prices: PriceSubmission[], city: string): PriceSubmission[] {
    return prices.filter(p => p.city.toLowerCase() === city.toLowerCase());
  }

  filterByBuyer(prices: PriceSubmission[], buyerName: string): PriceSubmission[] {
    return prices.filter(p => 
      p.buyerName.toLowerCase().includes(buyerName.toLowerCase())
    );
  }

  calculateTrend(prices: PriceSubmission[], days: number = 7): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const midpoint = new Date(now.getTime() - (days / 2) * 24 * 60 * 60 * 1000);

    const recent = prices.filter(p => new Date(p.createdAt) > midpoint);
    const older = prices.filter(p => {
      const date = new Date(p.createdAt);
      return date <= midpoint && date > cutoff;
    });

    if (recent.length === 0 || older.length === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const avgRecent = recent.reduce((sum, p) => sum + parseFloat(p.pricePerKg), 0) / recent.length;
    const avgOlder = older.reduce((sum, p) => sum + parseFloat(p.pricePerKg), 0) / older.length;

    const change = ((avgRecent - avgOlder) / avgOlder) * 100;

    if (change > 2) return { direction: 'up', percentage: Math.round(change) };
    if (change < -2) return { direction: 'down', percentage: Math.round(Math.abs(change)) };
    return { direction: 'stable', percentage: 0 };
  }
}

export const SUPPORTED_CITIES = [
  'Uruara',
  'Medicilândia',
  'Altamira',
  'Brasil Novo',
  'Vitoria do Xingu',
  'Placas',
  'Ruropolis',
  'Pacaja',
  'Anapu',
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];

export const cacauParaClient = new CacauParaClient('https://cacaupara.replit.app');

export default CacauParaClient;
