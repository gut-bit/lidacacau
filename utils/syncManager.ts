import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Job, WorkOrder, Review } from '@/types';

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingChanges: number;
  isOnline: boolean;
  syncInProgress: boolean;
}

export interface SyncableItem {
  id: string;
  localVersion: number;
  serverVersion?: number;
  lastModified: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface SyncQueue {
  items: SyncQueueItem[];
  lastProcessed: string | null;
}

export interface SyncQueueItem {
  id: string;
  type: 'user' | 'job' | 'workOrder' | 'review';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  retryCount: number;
}

const SYNC_KEYS = {
  SYNC_STATUS: '@lidacacau:sync_status',
  SYNC_QUEUE: '@lidacacau:sync_queue',
  LAST_SYNC: '@lidacacau:last_sync',
};

export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = await AsyncStorage.getItem(SYNC_KEYS.SYNC_STATUS);
    if (status) {
      return JSON.parse(status);
    }
  } catch (error) {
    console.error('Error getting sync status:', error);
  }
  
  return {
    lastSyncAt: null,
    pendingChanges: 0,
    isOnline: true,
    syncInProgress: false,
  };
}

export async function updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
  try {
    const current = await getSyncStatus();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_STATUS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

export async function getSyncQueue(): Promise<SyncQueue> {
  try {
    const queue = await AsyncStorage.getItem(SYNC_KEYS.SYNC_QUEUE);
    if (queue) {
      return JSON.parse(queue);
    }
  } catch (error) {
    console.error('Error getting sync queue:', error);
  }
  
  return {
    items: [],
    lastProcessed: null,
  };
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    
    queue.items.push(newItem);
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    
    const status = await getSyncStatus();
    await updateSyncStatus({ pendingChanges: queue.items.length });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

export async function removeFromSyncQueue(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    queue.items = queue.items.filter((item) => item.id !== itemId);
    queue.lastProcessed = new Date().toISOString();
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    await updateSyncStatus({ pendingChanges: queue.items.length });
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_QUEUE, JSON.stringify({ items: [], lastProcessed: new Date().toISOString() }));
    await updateSyncStatus({ pendingChanges: 0 });
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
}

export async function processSyncQueue(syncFn: (item: SyncQueueItem) => Promise<boolean>): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  await updateSyncStatus({ syncInProgress: true });

  for (const item of queue.items) {
    try {
      const result = await syncFn(item);
      if (result) {
        await removeFromSyncQueue(item.id);
        success++;
      } else {
        item.retryCount++;
        failed++;
      }
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      item.retryCount++;
      failed++;
    }
  }

  await updateSyncStatus({
    syncInProgress: false,
    lastSyncAt: new Date().toISOString(),
  });

  return { success, failed };
}

export function createSyncableWrapper<T extends { id: string }>(
  item: T,
  existingMeta?: SyncableItem
): T & SyncableItem {
  return {
    ...item,
    localVersion: (existingMeta?.localVersion || 0) + 1,
    serverVersion: existingMeta?.serverVersion,
    lastModified: new Date().toISOString(),
    syncStatus: 'pending' as const,
  };
}

export interface CloudSyncConfig {
  apiUrl: string;
  apiKey: string;
  userId: string;
}

export async function initializeCloudSync(config: CloudSyncConfig): Promise<boolean> {
  try {
    await AsyncStorage.setItem('@lidacacau:cloud_config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error initializing cloud sync:', error);
    return false;
  }
}

export async function getCloudSyncConfig(): Promise<CloudSyncConfig | null> {
  try {
    const config = await AsyncStorage.getItem('@lidacacau:cloud_config');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Error getting cloud sync config:', error);
    return null;
  }
}

export async function exportAllData(): Promise<{
  users: User[];
  jobs: Job[];
  workOrders: WorkOrder[];
  reviews: Review[];
  exportedAt: string;
}> {
  const AsyncStorageModule = AsyncStorage;
  
  const getData = async (key: string) => {
    const data = await AsyncStorageModule.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  return {
    users: await getData('@cacauserv:users'),
    jobs: await getData('@cacauserv:jobs'),
    workOrders: await getData('@cacauserv:work_orders'),
    reviews: await getData('@cacauserv:reviews'),
    exportedAt: new Date().toISOString(),
  };
}

export async function importData(data: {
  users?: User[];
  jobs?: Job[];
  workOrders?: WorkOrder[];
  reviews?: Review[];
}): Promise<{ imported: number; errors: number }> {
  let imported = 0;
  let errors = 0;

  try {
    if (data.users) {
      await AsyncStorage.setItem('@cacauserv:users', JSON.stringify(data.users));
      imported += data.users.length;
    }
    if (data.jobs) {
      await AsyncStorage.setItem('@cacauserv:jobs', JSON.stringify(data.jobs));
      imported += data.jobs.length;
    }
    if (data.workOrders) {
      await AsyncStorage.setItem('@cacauserv:work_orders', JSON.stringify(data.workOrders));
      imported += data.workOrders.length;
    }
    if (data.reviews) {
      await AsyncStorage.setItem('@cacauserv:reviews', JSON.stringify(data.reviews));
      imported += data.reviews.length;
    }
  } catch (error) {
    console.error('Error importing data:', error);
    errors++;
  }

  return { imported, errors };
}
