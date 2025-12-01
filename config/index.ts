/**
 * LidaCacau - Exportações de Configuração
 * 
 * Ponto central de exportação para módulo de configuração.
 */

export { 
  default as AppConfiguration, 
  CONFIG_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  isProductionHost,
  shouldUseMockData,
  shouldUseDevFallback,
} from './app.config';
export type { AppConfig, Environment } from './app.config';

export { ConfigProvider, useConfig, useFeatureFlag } from './ConfigContext';
