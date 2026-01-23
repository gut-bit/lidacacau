/**
 * LidaCacau - Configuracao de Ambiente
 * 
 * Este arquivo centraliza todas as configuracoes do app por ambiente.
 * IMPORTANTE: A detecção de ambiente acontece em RUNTIME para funcionar
 * corretamente em builds estáticos servidos de diferentes domínios.
 */

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  env: Environment;
  appName: string;
  appVersion: string;

  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  features: {
    enableMockData: boolean;
    enableAnalytics: boolean;
    enableDevTools: boolean;
    enableAutoLogin: boolean;
    enablePushNotifications: boolean;
    enableOfflineMode: boolean;
    enablePayments: boolean;
    enableMaps: boolean;
    enableDevFallback: boolean;
  };

  storage: {
    prefix: string;
    encryptSensitive: boolean;
  };

  services: {
    openPixAppId: string;
    mapsApiKey: string;
    analyticsId: string;
  };

  metadata: {
    region: string;
    defaultLocation: {
      latitude: number;
      longitude: number;
    };
    supportEmail: string;
    termsUrl: string;
    privacyUrl: string;
  };
}

/**
 * Check if we're running in a native environment (iOS/Android via Expo)
 */
function isNativeRuntime(): boolean {
  return typeof window === 'undefined' || !window.location?.hostname;
}

/**
 * Check if we're in development mode (__DEV__ is set by Expo/Metro)
 */
function isDevMode(): boolean {
  try {
    return typeof __DEV__ !== 'undefined' && __DEV__ === true;
  } catch {
    return false;
  }
}

/**
 * RUNTIME detection of production host
 * Called each time to ensure correct detection in static builds
 * 
 * For native builds: returns !__DEV__ (production builds have __DEV__ = false)
 * For web: checks hostname against production domains
 */
export function isProductionHost(): boolean {
  // Native runtime (iOS/Android): production is when __DEV__ is false
  if (isNativeRuntime()) {
    return !isDevMode();
  }

  const hostname = window.location?.hostname || '';
  // Production hosts: lidacacau.com, www.lidacacau.com, *.replit.app
  return hostname === 'lidacacau.com' ||
    hostname === 'www.lidacacau.com' ||
    hostname.endsWith('.replit.app');
}

/**
 * RUNTIME check if mock data should be used
 * 
 * For native builds:
 *   - __DEV__ true (development) -> use mock data
 *   - __DEV__ false (production) -> use real API
 * 
 * For web builds:
 *   - Production hosts (lidacacau.com, *.replit.app) -> use real API
 *   - Development hosts (localhost, *.replit.dev) -> use mock data
 */
export function shouldUseMockData(): boolean {
  // Native runtime: use mock only in dev mode
  if (isNativeRuntime()) {
    return isDevMode();
  }

  const hostname = window.location?.hostname || '';

  // Production hosts - use real API
  if (hostname === 'lidacacau.com' ||
    hostname === 'www.lidacacau.com' ||
    hostname.endsWith('.replit.app')) {
    return false;
  }

  // Development hosts - use mock data
  // Includes localhost, *.replit.dev (development preview)
  return true;
}

/**
 * RUNTIME check if dev fallback user should be used
 * Only for localhost development, NEVER in production or native builds
 */
export function shouldUseDevFallback(): boolean {
  // Native runtime: NEVER use dev fallback in production builds
  if (isNativeRuntime()) {
    return isDevMode(); // Only allow in Expo Go / dev client
  }

  const hostname = window.location?.hostname || '';

  // Only allow dev fallback on localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // Everywhere else (including replit.dev, replit.app, lidacacau.com) - no fallback
  return false;
}

const developmentConfig: AppConfig = {
  env: 'development',
  appName: 'LidaCacau',
  appVersion: '1.0.0',

  api: {
    baseUrl: '/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  features: {
    enableMockData: true,
    enableAnalytics: true,
    enableDevTools: true,
    enableAutoLogin: false,
    enablePushNotifications: false,
    enableOfflineMode: true,
    enablePayments: false,
    enableMaps: true,
    enableDevFallback: true,
  },

  storage: {
    prefix: '@lidacacau_',
    encryptSensitive: false,
  },

  services: {
    openPixAppId: '',
    mapsApiKey: '',
    analyticsId: '',
  },

  metadata: {
    region: 'Uruara/PA',
    defaultLocation: {
      latitude: -3.7167,
      longitude: -53.7333,
    },
    supportEmail: 'suporte@lidacacau.com.br',
    termsUrl: 'https://lidacacau.com.br/termos',
    privacyUrl: 'https://lidacacau.com.br/privacidade',
  },
};

const productionConfig: AppConfig = {
  env: 'production',
  appName: 'LidaCacau',
  appVersion: '1.0.0',

  api: {
    baseUrl: 'https://www.lidacacau.com/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  features: {
    enableMockData: false,
    enableAnalytics: true,
    enableDevTools: false,
    enableAutoLogin: false,
    enablePushNotifications: true,
    enableOfflineMode: true,
    enablePayments: true,
    enableMaps: true,
    enableDevFallback: false,
  },

  storage: {
    prefix: '@lidacacau_',
    encryptSensitive: true,
  },

  services: {
    openPixAppId: '',
    mapsApiKey: '',
    analyticsId: '',
  },

  metadata: {
    region: 'Uruara/PA',
    defaultLocation: {
      latitude: -3.7167,
      longitude: -53.7333,
    },
    supportEmail: 'suporte@lidacacau.com',
    termsUrl: 'https://lidacacau.com/termos',
    privacyUrl: 'https://lidacacau.com/privacidade',
  },
};

const configs: Record<Environment, AppConfig> = {
  development: developmentConfig,
  staging: productionConfig,
  production: productionConfig,
};

function getCurrentEnvironment(): Environment {
  try {
    if (isProductionHost()) {
      return 'production';
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return 'development';
    }
  } catch {
  }
  return 'production';
}

export const CONFIG_ENV: Environment = getCurrentEnvironment();
export const AppConfiguration: AppConfig = configs[CONFIG_ENV];
export const IS_PRODUCTION = isProductionHost();
export const IS_DEVELOPMENT = !IS_PRODUCTION;

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return AppConfiguration.api.baseUrl;
}

export default AppConfiguration;
