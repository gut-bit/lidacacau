/**
 * LidaCacau - Service Factory
 * 
 * Ponto central para obter instâncias de todos os serviços.
 * Suporta injeção de dependência e troca entre mock/API.
 * 
 * ## Uso
 * 
 * ```typescript
 * import { serviceFactory } from '@/services';
 * 
 * const authService = serviceFactory.getAuthService();
 * const jobService = serviceFactory.getJobService();
 * ```
 * 
 * ## Estado Atual (MVP)
 * 
 * Todas as implementações usam Mock (AsyncStorage) para o MVP.
 * O schema PostgreSQL está pronto em server/db/schema.sql.
 * 
 * ## Para Migrar para Produção
 * 
 * 1. Deploy backend API usando server/db/schema.sql
 * 2. Crie implementações em services/api/ (ex: ApiAuthService)
 *    - Use ApiAdapter de services/common/ApiAdapter.ts
 * 3. Atualize os métodos get*Service() abaixo
 * 4. Configure AppConfiguration.api.baseUrl
 * 
 * Exemplo de implementação API:
 * ```typescript
 * // services/api/ApiAuthService.ts
 * import { apiAdapter } from '../common/ApiAdapter';
 * 
 * export class ApiAuthService implements IAuthService {
 *   async login(credentials) {
 *     return apiAdapter.post('/auth/login', credentials);
 *   }
 * }
 * ```
 */

import { AppConfiguration } from '@/config';

import { IAuthService } from './interfaces/IAuthService';
import { IJobService } from './interfaces/IJobService';
import { IWorkOrderService } from './interfaces/IWorkOrderService';
import { IPropertyService } from './interfaces/IPropertyService';
import { ISocialService } from './interfaces/ISocialService';

import { MockAuthService } from './mock/MockAuthService';
import { MockJobService } from './mock/MockJobService';
import { MockWorkOrderService } from './mock/MockWorkOrderService';
import { MockPropertyService } from './mock/MockPropertyService';
import { MockSocialService } from './mock/MockSocialService';

export type ServiceProvider = 'mock' | 'api';

interface ServiceInstances {
  auth: IAuthService | null;
  job: IJobService | null;
  workOrder: IWorkOrderService | null;
  property: IPropertyService | null;
  social: ISocialService | null;
}

class ServiceFactory {
  private instances: ServiceInstances = {
    auth: null,
    job: null,
    workOrder: null,
    property: null,
    social: null,
  };

  private provider: ServiceProvider = 'mock';

  constructor() {
    this.provider = AppConfiguration.api.baseUrl ? 'api' : 'mock';
  }

  /**
   * Define o provedor de serviços (mock ou api)
   */
  setProvider(provider: ServiceProvider): void {
    if (this.provider !== provider) {
      this.provider = provider;
      this.resetAll();
    }
  }

  /**
   * Obtém o provedor atual
   */
  getProvider(): ServiceProvider {
    return this.provider;
  }

  /**
   * Serviço de Autenticação
   * TODO: Criar ApiAuthService e trocar quando provider === 'api'
   */
  getAuthService(): IAuthService {
    if (!this.instances.auth) {
      this.instances.auth = new MockAuthService();
    }
    return this.instances.auth;
  }

  /**
   * Serviço de Demandas (Jobs)
   * TODO: Criar ApiJobService e trocar quando provider === 'api'
   */
  getJobService(): IJobService {
    if (!this.instances.job) {
      this.instances.job = new MockJobService();
    }
    return this.instances.job;
  }

  /**
   * Serviço de Ordens de Trabalho
   * TODO: Criar ApiWorkOrderService e trocar quando provider === 'api'
   */
  getWorkOrderService(): IWorkOrderService {
    if (!this.instances.workOrder) {
      this.instances.workOrder = new MockWorkOrderService();
    }
    return this.instances.workOrder;
  }

  /**
   * Serviço de Propriedades Rurais
   * TODO: Criar ApiPropertyService e trocar quando provider === 'api'
   */
  getPropertyService(): IPropertyService {
    if (!this.instances.property) {
      this.instances.property = new MockPropertyService();
    }
    return this.instances.property;
  }

  /**
   * Serviço Social (Amigos, Chat, Presença)
   * TODO: Criar ApiSocialService e trocar quando provider === 'api'
   */
  getSocialService(): ISocialService {
    if (!this.instances.social) {
      this.instances.social = new MockSocialService();
    }
    return this.instances.social;
  }

  /**
   * Reseta todas as instâncias de serviço
   */
  resetAll(): void {
    this.instances = {
      auth: null,
      job: null,
      workOrder: null,
      property: null,
      social: null,
    };
  }

  /**
   * Obtém status de todos os serviços
   */
  getServiceStatus(): Record<string, { available: boolean; provider: ServiceProvider }> {
    return {
      auth: { available: true, provider: this.provider },
      job: { available: true, provider: this.provider },
      workOrder: { available: true, provider: this.provider },
      property: { available: true, provider: this.provider },
      social: { available: true, provider: this.provider },
    };
  }

  /**
   * Verifica se a API está configurada
   */
  isApiConfigured(): boolean {
    return Boolean(AppConfiguration.api.baseUrl);
  }
}

export const serviceFactory = new ServiceFactory();
export default serviceFactory;
