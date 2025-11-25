import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/theme';
import WorkerJobsScreen from '@/screens/worker/WorkerJobsScreen';
import WorkerActiveScreen from '@/screens/worker/WorkerActiveScreen';
import WorkerHistoryScreen from '@/screens/worker/WorkerHistoryScreen';
import WorkerProfileScreen from '@/screens/worker/WorkerProfileScreen';

export type WorkerTabParamList = {
  WorkerJobs: undefined;
  WorkerActive: undefined;
  WorkerHistory: undefined;
  WorkerProfile: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();

export default function WorkerTabNavigator() {
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: colors.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="WorkerJobs"
        component={WorkerJobsScreen}
        options={{
          title: 'Trabalhos',
          tabBarIcon: ({ color, size }) => <Feather name="briefcase" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerActive"
        component={WorkerActiveScreen}
        options={{
          title: 'Ativo',
          tabBarIcon: ({ color, size }) => <Feather name="activity" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerHistory"
        component={WorkerHistoryScreen}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
