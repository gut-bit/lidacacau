/**
 * LidaCacau - Session Manager
 * 
 * Gerencia sessões de usuário usando armazenamento seguro.
 * Tokens e IDs de usuário são armazenados de forma segura,
 * enquanto dados completos do usuário ficam no AsyncStorage regular.
 * 
 * Uso:
 * ```typescript
 * import { sessionManager } from '@/services/common';
 * 
 * // Salvar sessão após login
 * await sessionManager.saveSession(token, userId);
 * 
 * // Verificar se há sessão válida
 * if (await sessionManager.isSessionValid()) {
 *   const session = await sessionManager.getSession();
 * }
 * 
 * // Limpar sessão no logout
 * await sessionManager.clearSession();
 * ```
 */

import { secureStorageAdapter, SecureStorageKeys } from './SecureStorageAdapter';
import { storageAdapter, StorageKeys } from './AsyncStorageAdapter';

export interface Session {
  token: string;
  userId: string;
}

class SessionManager {
  async saveSession(token: string, userId: string): Promise<boolean> {
    try {
      const [tokenResult, userIdResult] = await Promise.all([
        secureStorageAdapter.setSecure(SecureStorageKeys.SESSION_TOKEN, token),
        secureStorageAdapter.setSecure(SecureStorageKeys.SESSION_USER_ID, userId),
      ]);

      return tokenResult && userIdResult;
    } catch {
      return false;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const [token, userId] = await Promise.all([
        secureStorageAdapter.getSecure(SecureStorageKeys.SESSION_TOKEN),
        secureStorageAdapter.getSecure(SecureStorageKeys.SESSION_USER_ID),
      ]);

      if (!token || !userId) {
        return null;
      }

      return { token, userId };
    } catch {
      return null;
    }
  }

  async clearSession(): Promise<boolean> {
    try {
      const results = await Promise.all([
        secureStorageAdapter.removeSecure(SecureStorageKeys.SESSION_TOKEN),
        secureStorageAdapter.removeSecure(SecureStorageKeys.SESSION_USER_ID),
        storageAdapter.remove(StorageKeys.CURRENT_USER),
      ]);

      return results.every(result => result);
    } catch {
      return false;
    }
  }

  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return session !== null && session.token.length > 0 && session.userId.length > 0;
    } catch {
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    return secureStorageAdapter.getSecure(SecureStorageKeys.SESSION_TOKEN);
  }

  async getUserId(): Promise<string | null> {
    return secureStorageAdapter.getSecure(SecureStorageKeys.SESSION_USER_ID);
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
