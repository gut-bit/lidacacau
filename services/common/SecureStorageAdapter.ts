/**
 * LidaCacau - SecureStorage Adapter
 * 
 * Wrapper para expo-secure-store com tratamento de erros.
 * Fornece armazenamento seguro para dados sensíveis como tokens.
 * 
 * Limitações:
 * - SecureStore não está disponível na web (fallback para AsyncStorage)
 * - Limite de 2048 bytes por valor
 * - Apenas strings são suportadas
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AppConfiguration } from '@/config';

const PREFIX = AppConfiguration.storage.prefix;

export const SecureStorageKeys = {
  SESSION_TOKEN: `${PREFIX}session_token`,
  SESSION_USER_ID: `${PREFIX}session_user_id`,
} as const;

export type SecureStorageKey = typeof SecureStorageKeys[keyof typeof SecureStorageKeys];

const isWeb = Platform.OS === 'web';
const isDev = AppConfiguration.env === 'development';

class SecureStorageAdapter {
  private hasWarnedAboutWeb = false;

  private warnAboutWebFallback(): void {
    if (isWeb && isDev && !this.hasWarnedAboutWeb) {
      console.warn(
        '[SecureStorageAdapter] SecureStore is not available on web. ' +
        'Using AsyncStorage as fallback. This is less secure and should only be used in development.'
      );
      this.hasWarnedAboutWeb = true;
    }
  }

  async setSecure(key: SecureStorageKey | string, value: string): Promise<boolean> {
    try {
      if (isWeb) {
        this.warnAboutWebFallback();
        await AsyncStorage.setItem(key, value);
        return true;
      }

      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      return true;
    } catch (error) {
      if (isDev) {
        console.error('[SecureStorageAdapter] Error setting secure value:', error);
      }
      return false;
    }
  }

  async getSecure(key: SecureStorageKey | string): Promise<string | null> {
    try {
      if (isWeb) {
        this.warnAboutWebFallback();
        return await AsyncStorage.getItem(key);
      }

      return await SecureStore.getItemAsync(key);
    } catch (error) {
      if (isDev) {
        console.error('[SecureStorageAdapter] Error getting secure value:', error);
      }
      return null;
    }
  }

  async removeSecure(key: SecureStorageKey | string): Promise<boolean> {
    try {
      if (isWeb) {
        this.warnAboutWebFallback();
        await AsyncStorage.removeItem(key);
        return true;
      }

      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      if (isDev) {
        console.error('[SecureStorageAdapter] Error removing secure value:', error);
      }
      return false;
    }
  }

  isSecureStorageAvailable(): boolean {
    return !isWeb;
  }
}

export const secureStorageAdapter = new SecureStorageAdapter();
export default secureStorageAdapter;
