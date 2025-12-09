import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/hooks/useTheme';
import { getCommonScreenOptions } from '@/navigation/screenOptions';
import CacauPricesScreen from '@/screens/shared/CacauPricesScreen';
import CacauPriceSubmitScreen from '@/screens/shared/CacauPriceSubmitScreen';
import CacauPriceHistoryScreen from '@/screens/shared/CacauPriceHistoryScreen';

export type CacauParaStackParamList = {
  CacauPricesMain: undefined;
  CacauPriceSubmit: undefined;
  CacauPriceHistory: undefined;
};

const Stack = createNativeStackNavigator<CacauParaStackParamList>();

export default function CacauParaStackNavigator() {
  const { isDark, theme: colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme: colors, isDark }),
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CacauPricesMain"
        component={CacauPricesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CacauPriceSubmit"
        component={CacauPriceSubmitScreen}
        options={{
          headerShown: true,
          title: 'Informar Preco',
          headerBackTitle: 'Voltar',
        }}
      />
      <Stack.Screen
        name="CacauPriceHistory"
        component={CacauPriceHistoryScreen}
        options={{
          headerShown: true,
          title: 'Historico',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack.Navigator>
  );
}
