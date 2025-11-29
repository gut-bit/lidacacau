import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Shadows } from '@/constants/theme';
import UnifiedHomeScreen from '@/screens/shared/UnifiedHomeScreen';
import ExploreScreen from '@/screens/shared/ExploreScreen';
import EducationScreen from '@/screens/education/EducationScreen';
import UnifiedProfileScreen from '@/screens/shared/UnifiedProfileScreen';
import { RootStackParamList } from '@/navigation/RootNavigator';

export type UnifiedTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Learn: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<UnifiedTabParamList>();

function CreateButtonIconComponent({ focused, isDark }: { focused: boolean; isDark: boolean }) {
  const colors = isDark ? Colors.dark : Colors.light;
  
  return (
    <View style={[styles.createButton, { backgroundColor: colors.primary }, Shadows.fab]}>
      <Feather name="plus" size={28} color="#FFFFFF" />
    </View>
  );
}

function PlaceholderScreen() {
  return <View style={{ flex: 1 }} />;
}

export default function UnifiedTabNavigator() {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
          height: Platform.select({ ios: 85, android: 65, web: 65 }),
          paddingBottom: Platform.select({ ios: 25, android: 10, web: 10 }),
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={UnifiedHomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={PlaceholderScreen}
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CreateButtonIconComponent focused={focused} isDark={isDark} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('QuickActions');
          },
        }}
      />
      <Tab.Screen
        name="Learn"
        component={EducationScreen}
        options={{
          title: 'Aprender',
          tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={UnifiedProfileScreen}
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
