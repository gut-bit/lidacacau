/**
 * LidaCacau - Configuração de Ambiente
 * 
 * Este arquivo centraliza todas as configurações do app por ambiente.
 * Facilita a migração para produção alterando apenas o valor de CONFIG_ENV.
 * 
 * Para servidor próprio:
 * 1. Defina CONFIG_ENV = 'production'
 * 2. Configure API_BASE_URL com seu backend
 * 3. Ajuste as feature flags conforme necessário
 */

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  env: Environment;
  appName: string;
  appVersion: string;
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  
  // Feature Flags
  features: {
    enableMockData: boolean;
    enableAnalytics: boolean;
    enableDevTools: boolean;
    enableAutoLogin: boolean;
    enablePushNotifications: boolean;
    enableOfflineMode: boolean;
    enablePayments: boolean;
    enableMaps: boolean;
  };
  
  // Storage Configuration
  storage: {
    prefix: string;
    encryptSensitive: boolean;
  };
  
  // External Services
  services: {
    openPixAppId: string;
    mapsApiKey: string;
    analyticsId: string;
  };
  
  // App Metadata
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

const stagingConfig: AppConfig = {
  ...developmentConfig,
  env: 'staging',
  
  api: {
    baseUrl: 'https://staging-api.lidacacau.com.br/api',
    timeout: 30000,
    retryAttempts: 3,
  },
  
  features: {
    ...developmentConfig.features,
    enableMockData: false,
    enableDevTools: true,
    enablePayments: true,
  },
  
  storage: {
    prefix: '@lidacacau_staging_',
    encryptSensitive: true,
  },
};

const productionConfig: AppConfig = {
  ...developmentConfig,
  env: 'production',
  
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
  },
  
  storage: {
    prefix: '@lidacacau_',
    encryptSensitive: true,
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
  staging: stagingConfig,
  production: productionConfig,
};

/**
 * Determina o ambiente atual baseado em variáveis de ambiente ou __DEV__
 * Para alterar o ambiente, modifique esta função ou defina process.env.CONFIG_ENV
 */
function getCurrentEnvironment(): Environment {
  // Verifica variável de ambiente primeiro (para builds customizados)
  const envFromProcess = (typeof process !== 'undefined' && process.env?.CONFIG_ENV) as Environment | undefined;
  if (envFromProcess && configs[envFromProcess]) {
    return envFromProcess;
  }
  
  // Fallback para __DEV__ do React Native
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'development';
  }
  
  return 'production';
}

export const CONFIG_ENV: Environment = getCurrentEnvironment();
export const AppConfiguration: AppConfig = configs[CONFIG_ENV];

export default AppConfiguration;
