/**
 * LidaCacau - AsyncStorage Adapter
 * 
 * Adaptador para AsyncStorage com tipagem forte e helpers.
 * Centraliza todas as operações de storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfiguration } from '@/config';

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
    } catch {
      return null;
    }
  }

  async set<T>(key: StorageKey | string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async remove(key: StorageKey | string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async getList<T>(key: StorageKey | string): Promise<T[]> {
    const data = await this.get<T[]>(key);
    return data || [];
  }

  async addToList<T extends { id: string }>(key: StorageKey | string, item: T): Promise<boolean> {
    const list = await this.getList<T>(key);
    list.push(item);
    return this.set(key, list);
  }

  async updateInList<T extends { id: string }>(
    key: StorageKey | string,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const list = await this.getList<T>(key);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    list[index] = { ...list[index], ...updates };
    await this.set(key, list);
    return list[index];
  }

  async removeFromList<T extends { id: string }>(key: StorageKey | string, id: string): Promise<boolean> {
    const list = await this.getList<T>(key);
    const filtered = list.filter(item => item.id !== id);
    return this.set(key, filtered);
  }

  async findById<T extends { id: string }>(key: StorageKey | string, id: string): Promise<T | null> {
    const list = await this.getList<T>(key);
    return list.find(item => item.id === id) || null;
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

export const storageAdapter = new AsyncStorageAdapter();
export default storageAdapter;
