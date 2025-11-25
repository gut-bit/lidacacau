import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/theme';
import ProducerHomeScreen from '@/screens/producer/ProducerHomeScreen';
import ProducerHistoryScreen from '@/screens/producer/ProducerHistoryScreen';
import ProducerProfileScreen from '@/screens/producer/ProducerProfileScreen';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export type ProducerTabParamList = {
  ProducerHome: undefined;
  ProducerCreate: undefined;
  ProducerHistory: undefined;
  ProducerProfile: undefined;
};

const Tab = createBottomTabNavigator<ProducerTabParamList>();

function PlaceholderScreen() {
  return null;
}

function CreateButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      onPress={() => navigation.navigate('CreateJob')}
      style={({ pressed }) => [
        styles.createButton,
        { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 },
        Shadows.fab,
      ]}
    >
      <Feather name="plus" size={28} color="#FFFFFF" />
    </Pressable>
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
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProducerCreate"
        component={PlaceholderScreen}
        options={{
          title: '',
          tabBarIcon: () => <CreateButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="ProducerHistory"
        component={ProducerHistoryScreen}
        options={{
          title: 'Histórico',
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
