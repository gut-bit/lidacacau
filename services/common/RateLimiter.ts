/**
 * LidaCacau - Rate Limiter
 * 
 * Utilitarios para controle de taxa de requisicoes.
 * Previne sobrecarga de APIs e protege contra abusos.
 */

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  minIntervalMs?: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetsIn: number;
}

export interface CanMakeRequestResult {
  allowed: boolean;
  waitMs?: number;
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private minIntervalMs: number;
  private requests: number[] = [];
  private lastRequestTime: number = 0;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.minIntervalMs = config.minIntervalMs ?? 0;
  }

  private cleanExpiredRequests(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
  }

  canMakeRequest(): CanMakeRequestResult {
    const now = Date.now();
    this.cleanExpiredRequests();

    if (this.minIntervalMs > 0 && this.lastRequestTime > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minIntervalMs) {
        return {
          allowed: false,
          waitMs: this.minIntervalMs - timeSinceLastRequest,
        };
      }
    }

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitMs = oldestRequest + this.windowMs - now;
      return {
        allowed: false,
        waitMs: Math.max(0, waitMs),
      };
    }

    return { allowed: true };
  }

  recordRequest(): void {
    const now = Date.now();
    this.cleanExpiredRequests();
    this.requests.push(now);
    this.lastRequestTime = now;
  }

  async throttle(): Promise<void> {
    const result = this.canMakeRequest();
    
    if (!result.allowed && result.waitMs !== undefined && result.waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, result.waitMs));
      return this.throttle();
    }
    
    this.recordRequest();
  }

  getStatus(): RateLimitStatus {
    this.cleanExpiredRequests();
    const now = Date.now();
    
    const remaining = Math.max(0, this.maxRequests - this.requests.length);
    const oldestRequest = this.requests[0];
    const resetsIn = oldestRequest 
      ? Math.max(0, oldestRequest + this.windowMs - now)
      : 0;

    return { remaining, resetsIn };
  }

  reset(): void {
    this.requests = [];
    this.lastRequestTime = 0;
  }
}

export const apiLimiter = new RateLimiter({ 
  maxRequests: 30, 
  windowMs: 60000,
  minIntervalMs: 500 
});

export const authLimiter = new RateLimiter({ 
  maxRequests: 5, 
  windowMs: 60000 
});

export const storageLimiter = new RateLimiter({ 
  maxRequests: 100, 
  windowMs: 60000 
});

export async function withRateLimit<T>(
  fn: () => Promise<T>,
  limiter: RateLimiter
): Promise<T> {
  await limiter.throttle();
  return fn();
}
