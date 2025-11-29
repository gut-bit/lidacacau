import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import UnifiedTabNavigator from '@/navigation/UnifiedTabNavigator';
import ShopListScreen from '@/screens/shared/ShopListScreen';

type Section = 'marketplace' | 'shop';

export default function SectionTabNavigator() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [activeSection, setActiveSection] = useState<Section>('marketplace');

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionTabs, { backgroundColor: colors.backgroundDefault, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.sectionTab,
            {
              borderBottomWidth: activeSection === 'marketplace' ? 3 : 0,
              borderBottomColor: colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setActiveSection('marketplace')}
        >
          <ThemedText
            type="h5"
            style={{
              color: activeSection === 'marketplace' ? colors.primary : colors.textSecondary,
              fontWeight: activeSection === 'marketplace' ? '700' : '500',
            }}
          >
            Lida Cacau
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.sectionTab,
            {
              borderBottomWidth: activeSection === 'shop' ? 3 : 0,
              borderBottomColor: colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setActiveSection('shop')}
        >
          <ThemedText
            type="h5"
            style={{
              color: activeSection === 'shop' ? colors.primary : colors.textSecondary,
              fontWeight: activeSection === 'shop' ? '700' : '500',
            }}
          >
            LidaShop
          </ThemedText>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {activeSection === 'marketplace' ? (
          <UnifiedTabNavigator />
        ) : (
          <ShopListScreen />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
