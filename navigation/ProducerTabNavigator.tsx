import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Shadows } from '@/constants/theme';
import ProducerHomeScreen from '@/screens/producer/ProducerHomeScreen';
import CreateJobScreen from '@/screens/producer/CreateJobScreen';
import ProducerHistoryScreen from '@/screens/producer/ProducerHistoryScreen';
import ProducerProfileScreen from '@/screens/producer/ProducerProfileScreen';
import EducationScreen from '@/screens/education/EducationScreen';

export type ProducerTabParamList = {
  ProducerHome: undefined;
  ProducerEducation: undefined;
  ProducerCreate: undefined;
  ProducerHistory: undefined;
  ProducerProfile: undefined;
};

const Tab = createBottomTabNavigator<ProducerTabParamList>();

function CreateButtonIcon({ color, focused }: { color: string; focused: boolean }) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  return (
    <View style={[styles.createButton, { backgroundColor: focused ? colors.primary : colors.accent }, Shadows.fab]}>
      <Feather name="plus" size={28} color="#FFFFFF" />
    </View>
  );
}

export default function ProducerTabNavigator() {
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
            web: colors.backgroundRoot,
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
        name="ProducerHome"
        component={ProducerHomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProducerEducation"
        component={EducationScreen}
        options={{
          title: 'Capacitacao',
          tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProducerCreate"
        component={CreateJobScreen}
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => <CreateButtonIcon color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProducerHistory"
        component={ProducerHistoryScreen}
        options={{
          title: 'Historico',
          tabBarIcon: ({ color, size }) => <Feather name="clock" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProducerProfile"
        component={ProducerProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
