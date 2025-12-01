/**
 * LidaCacau - Configuracao de Ambiente
 * 
 * Este arquivo centraliza todas as configuracoes do app por ambiente.
 * Detecta automaticamente o ambiente baseado em __DEV__ e window.location.
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

function isProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location?.hostname || '';
  return hostname === 'lidacacau.com' || 
         hostname === 'www.lidacacau.com' ||
         hostname.endsWith('.replit.app');
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
    enableMockData: false,
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
    baseUrl: '/api',
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

export default AppConfiguration;
