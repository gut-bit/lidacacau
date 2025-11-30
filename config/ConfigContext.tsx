/**
 * LidaCacau - Contexto de Configuração
 * 
 * Fornece acesso global à configuração do app via React Context.
 * Permite override de configurações em tempo de execução.
 */

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import AppConfiguration, { AppConfig, Environment } from './app.config';

interface ConfigContextValue {
  config: AppConfig;
  env: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  updateFeatureFlag: (key: keyof AppConfig['features'], value: boolean) => void;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  overrides?: Partial<AppConfig>;
}

export function ConfigProvider({ children, overrides }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(() => ({
    ...AppConfiguration,
    ...overrides,
    features: {
      ...AppConfiguration.features,
      ...overrides?.features,
    },
  }));

  const updateFeatureFlag = (key: keyof AppConfig['features'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  const value = useMemo<ConfigContextValue>(() => ({
    config,
    env: config.env,
    isDevelopment: config.env === 'development',
    isStaging: config.env === 'staging',
    isProduction: config.env === 'production',
    updateFeatureFlag,
  }), [config]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

export function useFeatureFlag(flag: keyof AppConfig['features']): boolean {
  const { config } = useConfig();
  return config.features[flag];
}

export default ConfigContext;
