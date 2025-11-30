import React, { useEffect, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { isLoading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      // Auth initialization is complete, hide the splash screen
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    }
  }, [isLoading]);

  // Keep splash visible while auth is initializing
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  return <>{children}</>;
}
