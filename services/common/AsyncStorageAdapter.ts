/**
 * LidaCacau - AsyncStorage Adapter
 * 
 * Adaptador para AsyncStorage com tipagem forte e helpers.
 * Centraliza todas as operações de storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfiguration } from '@/config';
import { logWarning, createAppError, logError } from './ErrorHandler';

const PREFIX = AppConfiguration.storage.prefix;

export const StorageKeys = {
  CURRENT_USER: `${PREFIX}current_user`,
  USERS: `${PREFIX}users`,
  JOBS: `${PREFIX}jobs`,
  BIDS: `${PREFIX}bids`,
  WORK_ORDERS: `${PREFIX}work_orders`,
  REVIEWS: `${PREFIX}reviews`,
  SERVICE_OFFERS: `${PREFIX}service_offers`,
  PROPERTIES: `${PREFIX}properties`,
  FRIENDS: `${PREFIX}friends`,
  CHAT_ROOMS: `${PREFIX}chat_rooms`,
  PRESENCE: `${PREFIX}presence`,
  NOTIFICATIONS: `${PREFIX}notifications`,
  ANALYTICS: `${PREFIX}analytics`,
  USER_PREFERENCES: `${PREFIX}user_preferences`,
  SQUADS: `${PREFIX}squads`,
  SQUAD_INVITES: `${PREFIX}squad_invites`,
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];

export class AsyncStorageAdapter {
  async get<T>(key: StorageKey | string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to read from storage: ${key}`, {
        key,
        error: errorMessage,
        operation: 'get',
      });
      return null;
    }
  }

  async set<T>(key: StorageKey | string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(createAppError(
        'STORAGE_WRITE_ERROR',
        `Failed to write to storage: ${key}`,
        'storage',
        'warning',
        { key, error: errorMessage, operation: 'set' }
      ));
      return false;
    }
  }

  async remove(key: StorageKey | string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to remove from storage: ${key}`, {
        key,
        error: errorMessage,
        operation: 'remove',
      });
      return false;
    }
  }

  async getList<T>(key: StorageKey | string): Promise<T[]> {
    const data = await this.get<T[]>(key);
    return data || [];
  }

  async addToList<T extends { id: string }>(key: StorageKey | string, item: T): Promise<boolean> {
    try {
      const list = await this.getList<T>(key);
      list.push(item);
      return this.set(key, list);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to add item to list: ${key}`, {
        key,
        itemId: item.id,
        error: errorMessage,
        operation: 'addToList',
      });
      return false;
    }
  }

  async updateInList<T extends { id: string }>(
    key: StorageKey | string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    try {
      const list = await this.getList<T>(key);
      const index = list.findIndex(item => item.id === id);
      if (index === -1) {
        logWarning(`Item not found in list: ${key}`, {
          key,
          id,
          operation: 'updateInList',
        });
        return null;
      }
      
      list[index] = { ...list[index], ...updates };
      const success = await this.set(key, list);
      
      if (!success) {
        logWarning(`Failed to persist updated list: ${key}`, {
          key,
          id,
          operation: 'updateInList',
        });
        return null;
      }
      
      return list[index];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to update item in list: ${key}`, {
        key,
        id,
        error: errorMessage,
        operation: 'updateInList',
      });
      return null;
    }
  }

  async removeFromList<T extends { id: string }>(key: StorageKey | string, id: string): Promise<boolean> {
    try {
      const list = await this.getList<T>(key);
      const filtered = list.filter(item => item.id !== id);
      return this.set(key, filtered);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to remove item from list: ${key}`, {
        key,
        id,
        error: errorMessage,
        operation: 'removeFromList',
      });
      return false;
    }
  }

  async findById<T extends { id: string }>(key: StorageKey | string, id: string): Promise<T | null> {
    try {
      const list = await this.getList<T>(key);
      return list.find(item => item.id === id) || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logWarning(`Failed to find item by id: ${key}`, {
        key,
        id,
        error: errorMessage,
        operation: 'findById',
      });
      return null;
    }
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

export const storageAdapter = new AsyncStorageAdapter();
export default storageAdapter;
