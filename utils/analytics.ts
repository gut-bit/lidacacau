import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, AnalyticsEventType, AnalyticsSession } from '@/types';

const STORAGE_KEY = '@lidacacau_analytics';
const SESSION_KEY = '@lidacacau_analytics_session';
const MAX_EVENTS = 1000;

let currentSession: AnalyticsSession | null = null;

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getDeviceInfo = (): { platform: 'ios' | 'android' | 'web'; version?: string } => {
  const platformOS = Platform.OS;
  let platform: 'ios' | 'android' | 'web' = 'web';
  
  if (platformOS === 'ios') {
    platform = 'ios';
  } else if (platformOS === 'android') {
    platform = 'android';
  }
  
  return {
    platform,
    version: Platform.Version?.toString(),
  };
};

export const trackEvent = async (
  eventType: AnalyticsEventType,
  eventData?: Record<string, unknown>,
  screen?: string
): Promise<AnalyticsEvent | null> => {
  try {
    const event: AnalyticsEvent = {
      id: generateId(),
      eventType,
      eventData,
      screen,
      timestamp: new Date().toISOString(),
      sessionId: currentSession?.id,
      deviceInfo: getDeviceInfo(),
    };

    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    let events: AnalyticsEvent[] = existingData ? JSON.parse(existingData) : [];

    events.push(event);

    if (events.length > MAX_EVENTS) {
      events = events.slice(events.length - MAX_EVENTS);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    if (currentSession) {
      currentSession.events.push(event);
      if (screen && !currentSession.screens.includes(screen)) {
        currentSession.screens.push(screen);
      }
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
    }

    return event;
  } catch (error) {
    console.error('Error tracking event:', error);
    return null;
  }
};

export const startSession = async (userId?: string): Promise<AnalyticsSession> => {
  try {
    if (currentSession) {
      await endSession();
    }

    const session: AnalyticsSession = {
      id: generateId(),
      userId,
      startedAt: new Date().toISOString(),
      events: [],
      screens: [],
    };

    currentSession = session;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

    await trackEvent('app_open');

    return session;
  } catch (error) {
    console.error('Error starting session:', error);
    const fallbackSession: AnalyticsSession = {
      id: generateId(),
      startedAt: new Date().toISOString(),
      events: [],
      screens: [],
    };
    currentSession = fallbackSession;
    return fallbackSession;
  }
};

export const endSession = async (): Promise<AnalyticsSession | null> => {
  try {
    if (!currentSession) {
      return null;
    }

    currentSession.endedAt = new Date().toISOString();
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));

    const endedSession = { ...currentSession };
    currentSession = null;

    return endedSession;
  } catch (error) {
    console.error('Error ending session:', error);
    currentSession = null;
    return null;
  }
};

export const getAnalyticsEvents = async (limit?: number): Promise<AnalyticsEvent[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    let events: AnalyticsEvent[] = data ? JSON.parse(data) : [];

    if (limit && limit > 0) {
      events = events.slice(-limit);
    }

    return events;
  } catch (error) {
    console.error('Error getting analytics events:', error);
    return [];
  }
};

export const clearAnalyticsEvents = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing analytics events:', error);
    return false;
  }
};

export const getCurrentSession = (): AnalyticsSession | null => {
  return currentSession;
};

export const getSessionFromStorage = async (): Promise<AnalyticsSession | null> => {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting session from storage:', error);
    return null;
  }
};

export const setSessionUserId = async (userId: string): Promise<void> => {
  try {
    if (currentSession) {
      currentSession.userId = userId;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
    }
  } catch (error) {
    console.error('Error setting session user ID:', error);
  }
};

export const getEventsByType = async (
  eventType: AnalyticsEventType,
  limit?: number
): Promise<AnalyticsEvent[]> => {
  try {
    const allEvents = await getAnalyticsEvents();
    let filteredEvents = allEvents.filter((e) => e.eventType === eventType);

    if (limit && limit > 0) {
      filteredEvents = filteredEvents.slice(-limit);
    }

    return filteredEvents;
  } catch (error) {
    console.error('Error getting events by type:', error);
    return [];
  }
};

export const getEventsByScreen = async (
  screen: string,
  limit?: number
): Promise<AnalyticsEvent[]> => {
  try {
    const allEvents = await getAnalyticsEvents();
    let filteredEvents = allEvents.filter((e) => e.screen === screen);

    if (limit && limit > 0) {
      filteredEvents = filteredEvents.slice(-limit);
    }

    return filteredEvents;
  } catch (error) {
    console.error('Error getting events by screen:', error);
    return [];
  }
};

export const getEventsCount = async (): Promise<number> => {
  try {
    const events = await getAnalyticsEvents();
    return events.length;
  } catch (error) {
    console.error('Error getting events count:', error);
    return 0;
  }
};
