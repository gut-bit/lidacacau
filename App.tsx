import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";

import RootNavigator from "@/navigation/RootNavigator";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider, AppConfiguration } from "@/config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors } from "@/constants/theme";
import { startSession } from "@/utils/analytics";
import { initializeMockData } from "@/data/MockDataProvider";
import { AppInitializer } from "@/components/AppInitializer";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      if (AppConfiguration.features.enableAnalytics) {
        startSession();
      }
      if (AppConfiguration.features.enableMockData) {
        initializeMockData();
      }
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>LidaCacau</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ConfigProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <AuthProvider>
                <AppInitializer>
                  <NavigationContainer>
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
