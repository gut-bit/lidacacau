/**
 * LidaCacau - Exportações de Serviços
 * 
 * Ponto central de exportação para o módulo de serviços.
 * 
 * Uso:
 * import { serviceFactory } from '@/services';
 * const authService = serviceFactory.getAuthService();
 */

export * from './interfaces';
export { serviceFactory } from './ServiceFactory';
export { MockAuthService } from './mock/MockAuthService';
