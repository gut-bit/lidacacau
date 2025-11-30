/**
 * LidaCacau - Factory de Serviços
 * 
 * Este é o ponto central para obter instâncias de serviços.
 * 
 * ## Estado Atual (MVP)
 * 
 * Apenas AuthService está implementado via interface. Os demais serviços
 * ainda usam as funções legacy em utils/storage.ts diretamente.
 * 
 * ## Para Migrar para Produção
 * 
 * 1. Crie implementações de API em services/api/
 * 2. Atualize os métodos get*Service() para retornar a implementação correta
 * 3. Configure AppConfiguration.api.baseUrl com a URL do servidor
 * 
 * ## Serviços Disponíveis
 * 
 * | Serviço | Status | Uso Atual |
 * |---------|--------|-----------|
 * | AuthService | Implementado | serviceFactory.getAuthService() |
 * | JobService | Legacy | utils/storage.ts (createJob, getJobs, etc) |
 * | PropertyService | Legacy | utils/storage.ts (createProperty, etc) |
 * | CommerceService | Não impl. | N/A |
 * | SocialService | Legacy | utils/storage.ts (friends, chat, etc) |
 */

import { AppConfiguration } from '@/config';
import { IAuthService } from './interfaces/IAuthService';
import { MockAuthService } from './mock/MockAuthService';

class ServiceFactory {
  private authService: IAuthService | null = null;

  /**
   * Obtém o serviço de autenticação
   * 
   * Este é o único serviço completamente abstraído.
   * Para produção, crie ApiAuthService e atualize aqui.
   */
  getAuthService(): IAuthService {
    if (!this.authService) {
      this.authService = new MockAuthService();
    }
    return this.authService;
  }

  /**
   * Indica se o serviço de Jobs está disponível via interface
   * @returns false - Use funções legacy em utils/storage.ts
   */
  isJobServiceAvailable(): boolean {
    return false;
  }

  /**
   * Indica se o serviço de Properties está disponível via interface
   * @returns false - Use funções legacy em utils/storage.ts
   */
  isPropertyServiceAvailable(): boolean {
    return false;
  }

  /**
   * Indica se o serviço de Commerce está disponível via interface
   * @returns false - Não implementado ainda
   */
  isCommerceServiceAvailable(): boolean {
    return false;
  }

  /**
   * Indica se o serviço Social está disponível via interface
   * @returns false - Use funções legacy em utils/storage.ts
   */
  isSocialServiceAvailable(): boolean {
    return false;
  }

  /**
   * Reseta todos os serviços (útil para testes ou logout)
   */
  resetAll(): void {
    this.authService = null;
  }

  /**
   * Obtém informações sobre o estado dos serviços
   */
  getServiceStatus(): Record<string, { available: boolean; source: string }> {
    return {
      auth: { available: true, source: 'MockAuthService' },
      jobs: { available: false, source: 'utils/storage.ts' },
      properties: { available: false, source: 'utils/storage.ts' },
      commerce: { available: false, source: 'N/A' },
      social: { available: false, source: 'utils/storage.ts' },
    };
  }
}

export const serviceFactory = new ServiceFactory();
export default serviceFactory;
