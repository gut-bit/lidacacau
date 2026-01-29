import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";

import RootNavigator, { RootStackParamList } from "@/navigation/RootNavigator";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider, AppConfiguration } from "@/config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConnectivityBar } from './components/ConnectivityBar';
import { useAuth } from './hooks/useAuth';
import { Colors } from "@/constants/theme";
import { startSession } from "@/utils/analytics";
import { initializeMockData } from "@/data/MockDataProvider";
import { AppInitializer } from "@/components/AppInitializer";

// Deep linking configuration for sharing cards via WhatsApp/social media
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'https://www.lidacacau.com',
    'https://lidacacau.com',
    'https://lidacacau.replit.app',
    'lidacacau://',
  ],
  config: {
    screens: {
      MainTabs: '',
      JobDetail: 'demand/:jobId',
      OtherUserProfile: 'user/:userId',
      ChatRoom: 'chat/:roomId',
    },
  },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  const [isFontTimeout, setIsFontTimeout] = useState(false);

  useEffect(() => {
    // Separate timer to handle font timeout
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timed out, proceeding with fallback fonts');
        setIsFontTimeout(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded || isFontTimeout) {
        try {
          if (AppConfiguration.features.enableAnalytics) {
            startSession();
          }
          if (AppConfiguration.features.enableMockData) {
            initializeMockData();
          }
        } catch (e) {
          console.error('[App] Initialization error:', e);
        } finally {
          await SplashScreen.hideAsync().catch(() => { });
        }
      }
    }

    prepare();
  }, [fontsLoaded, isFontTimeout]);

  // Removed blocking check to force render
  // const isReady = fontsLoaded || isFontTimeout;

  const handleError = (error: Error, stackTrace: string) => {
    console.error('[ErrorBoundary] App crashed:', error.message);
    console.error('[ErrorBoundary] Stack:', stackTrace);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ConfigProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <AuthProvider>
                <ConnectivityBar />
                <AppInitializer>
                  <NavigationContainer linking={linking}>
                    <RootNavigator />
                  </NavigationContainer>
                </AppInitializer>
              </AuthProvider>
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
