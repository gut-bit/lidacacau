/**
 * Cacau Para SDK
 * 
 * Modulo de integracao para consultar precos de cacau ao vivo
 * Integra o Lidacacau com a plataforma Cacau Para (https://cacaupara.replit.app)
 */

export interface PriceSubmission {
  id: string;
  userId: string | null;
  buyerName: string;
  city: string;
  region: string | null;
  pricePerKg: string;
  conditions: string | null;
  proofImageUrl: string | null;
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
  pricePerKg: string;
  userId?: string;
  region?: string;
  conditions?: string;
  proofImageUrl?: string;
}

export interface AddNoteInput {
  userId: string;
  noteType: 'correction' | 'context' | 'concern';
  content: string;
}

export interface SDKConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
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

export class CacauParaClient {
  private baseUrl: string;
  private authToken?: string;
  private timeout: number;

  constructor(config: string | SDKConfig) {
    if (typeof config === 'string') {
      this.baseUrl = config.replace(/\/$/, '');
      this.timeout = 10000;
    } else {
      this.baseUrl = config.baseUrl.replace(/\/$/, '');
      this.authToken = config.authToken;
      this.timeout = config.timeout || 10000;
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
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

  async submitPrice(input: SubmitPriceInput): Promise<PriceSubmission> {
    return this.request<PriceSubmission>('POST', '/api/prices', input);
  }

  async listPrices(): Promise<PriceSubmission[]> {
    return this.request<PriceSubmission[]>('GET', '/api/prices');
  }

  async getPriceNotes(priceId: string): Promise<CommunityNote[]> {
    return this.request<CommunityNote[]>('GET', `/api/prices/${priceId}/notes`);
  }

  async addPriceNote(priceId: string, input: AddNoteInput): Promise<CommunityNote> {
    return this.request<CommunityNote>('POST', `/api/prices/${priceId}/notes`, input);
  }

  generateWhatsAppShareLink(price: PriceSubmission, phoneNumber?: string): string {
    const message = [
      'Preco de cacau atualizado no Cacau Para:',
      `Comprador: ${price.buyerName}`,
      `Cidade: ${price.city}`,
      `Preco: R$ ${price.pricePerKg}/kg`,
      '',
      `Veja mais: ${this.baseUrl}`,
    ].join('\n');

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
}

export const SUPPORTED_CITIES = [
  'Medicilândia',
  'Uruará',
  'Brasil Novo',
  'Altamira',
  'Pacajá',
  'Anapu',
  'Vitória do Xingu',
  'Senador José Porfírio',
] as const;

export type SupportedCity = typeof SUPPORTED_CITIES[number];

export const cacauParaClient = new CacauParaClient('https://cacaupara.replit.app');

export default CacauParaClient;
