/**
 * LidaCacau - Factory de Serviços
 * 
 * Centraliza a criação de instâncias de serviços.
 * Para migrar para produção, altere as implementações aqui.
 * 
 * Exemplo de migração:
 * - Desenvolvimento: usa MockAuthService (AsyncStorage)
 * - Produção: usa ApiAuthService (chamadas HTTP)
 */

import { AppConfiguration } from '@/config';
import { IAuthService } from './interfaces/IAuthService';
import { IJobService } from './interfaces/IJobService';
import { IPropertyService } from './interfaces/IPropertyService';
import { ICommerceService } from './interfaces/ICommerceService';
import { ISocialService } from './interfaces/ISocialService';
import { MockAuthService } from './mock/MockAuthService';

class ServiceFactory {
  private authService: IAuthService | null = null;
  private jobService: IJobService | null = null;
  private propertyService: IPropertyService | null = null;
  private commerceService: ICommerceService | null = null;
  private socialService: ISocialService | null = null;

  /**
   * Obtém o serviço de autenticação
   * Para produção, substitua MockAuthService por ApiAuthService
   */
  getAuthService(): IAuthService {
    if (!this.authService) {
      if (AppConfiguration.features.enableMockData) {
        this.authService = new MockAuthService();
      } else {
        // TODO: Implementar ApiAuthService para produção
        // this.authService = new ApiAuthService(AppConfiguration.api.baseUrl);
        this.authService = new MockAuthService();
      }
    }
    return this.authService;
  }

  /**
   * Obtém o serviço de trabalhos/demandas
   * TODO: Implementar MockJobService e ApiJobService
   */
  getJobService(): IJobService {
    if (!this.jobService) {
      // TODO: Implementar quando necessário
      throw new Error('JobService não implementado. Use as funções legacy em utils/storage.ts');
    }
    return this.jobService;
  }

  /**
   * Obtém o serviço de propriedades
   * TODO: Implementar MockPropertyService e ApiPropertyService
   */
  getPropertyService(): IPropertyService {
    if (!this.propertyService) {
      // TODO: Implementar quando necessário
      throw new Error('PropertyService não implementado. Use as funções legacy em utils/storage.ts');
    }
    return this.propertyService;
  }

  /**
   * Obtém o serviço de comércio (LidaShop)
   * TODO: Implementar MockCommerceService e ApiCommerceService
   */
  getCommerceService(): ICommerceService {
    if (!this.commerceService) {
      // TODO: Implementar quando necessário
      throw new Error('CommerceService não implementado. Use as funções legacy em utils/storage.ts');
    }
    return this.commerceService;
  }

  /**
   * Obtém o serviço social (amizades, chat, esquadrões)
   * TODO: Implementar MockSocialService e ApiSocialService
   */
  getSocialService(): ISocialService {
    if (!this.socialService) {
      // TODO: Implementar quando necessário
      throw new Error('SocialService não implementado. Use as funções legacy em utils/storage.ts');
    }
    return this.socialService;
  }

  /**
   * Reseta todos os serviços (útil para testes ou troca de ambiente)
   */
  resetAll(): void {
    this.authService = null;
    this.jobService = null;
    this.propertyService = null;
    this.commerceService = null;
    this.socialService = null;
  }
}

export const serviceFactory = new ServiceFactory();
export default serviceFactory;
