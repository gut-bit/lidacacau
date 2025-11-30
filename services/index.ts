/**
 * LidaCacau - Services Index
 * 
 * Exporta todos os serviços e interfaces.
 * 
 * ## Uso Recomendado
 * 
 * Use sempre o ServiceFactory para obter instâncias de serviço:
 * 
 * ```typescript
 * import { serviceFactory } from '@/services';
 * 
 * const authService = serviceFactory.getAuthService();
 * const result = await authService.login({ email, password });
 * 
 * if (result.success) {
 *   console.log('Logged in:', result.user);
 * }
 * ```
 */

export { serviceFactory } from './ServiceFactory';
export type { ServiceProvider } from './ServiceFactory';

export * from './interfaces';

export * from './common/types';
export { storageAdapter, StorageKeys } from './common/AsyncStorageAdapter';
