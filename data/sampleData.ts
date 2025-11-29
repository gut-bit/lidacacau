// LidaCacau - Marketplace Rural
// 
// NOTA: Dados fake/demonstração foram removidos para MVP real.
// Este arquivo mantido apenas para compatibilidade de imports.
// O aplicativo agora utiliza apenas dados reais criados pelos usuários.
//
// Para popular o app com dados de teste durante desenvolvimento,
// utilize as funções de criação em utils/storage.ts

import { User, Job, WorkOrder, Review, MapActivity } from '@/types';

export interface ActivityItem {
  id: string;
  type: 'job_posted' | 'job_started' | 'job_completed' | 'review_received';
  title: string;
  description: string;
  producerName: string;
  workerName?: string;
  serviceType: string;
  serviceIcon: string;
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  level?: number;
  timestamp: string;
  status?: 'open' | 'assigned' | 'closed' | 'in_progress';
}

export const SAMPLE_PRODUCERS: User[] = [];
export const SAMPLE_WORKERS: User[] = [];
export const SAMPLE_JOBS: Job[] = [];
export const SAMPLE_WORK_ORDERS: WorkOrder[] = [];
export const SAMPLE_REVIEWS: Review[] = [];
export const SAMPLE_ACTIVITY: ActivityItem[] = [];

export function getActivityItems(): ActivityItem[] {
  return [];
}

export function getOpenSampleJobs(): Job[] {
  return [];
}

export function getInProgressJobs(): ActivityItem[] {
  return [];
}

export function getMapActivities(radiusKm: number = 100): MapActivity[] {
  return [];
}
