import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import UnifiedTabNavigator from '@/navigation/UnifiedTabNavigator';
import ShopListScreen from '@/screens/shared/ShopListScreen';
import CacauPricesScreen from '@/screens/shared/CacauPricesScreen';

type Section = 'marketplace' | 'prices' | 'shop';

export default function SectionTabNavigator() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [activeSection, setActiveSection] = useState<Section>('marketplace');

  const sections: { id: Section; label: string }[] = [
    { id: 'marketplace', label: 'Lida Cacau' },
    { id: 'prices', label: 'Cacau Para' },
    { id: 'shop', label: 'LidaShop' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'marketplace':
        return <UnifiedTabNavigator />;
      case 'prices':
        return <CacauPricesScreen />;
      case 'shop':
        return <ShopListScreen />;
      default:
        return <UnifiedTabNavigator />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionTabs, { backgroundColor: colors.backgroundDefault, borderBottomColor: colors.border }]}>
        {sections.map((section) => (
          <Pressable
            key={section.id}
            style={({ pressed }) => [
              styles.sectionTab,
              {
                borderBottomWidth: activeSection === section.id ? 3 : 0,
                borderBottomColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setActiveSection(section.id)}
          >
            <ThemedText
              type="body"
              style={{
                color: activeSection === section.id ? colors.primary : colors.textSecondary,
                fontWeight: activeSection === section.id ? '700' : '500',
                fontSize: 14,
              }}
            >
              {section.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionTab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
