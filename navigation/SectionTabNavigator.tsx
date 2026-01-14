import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UnifiedTabNavigator from '@/navigation/UnifiedTabNavigator';
import ShopListScreen from '@/screens/shared/ShopListScreen';
import CacauParaStackNavigator from '@/navigation/CacauParaStackNavigator';
import CommunityHomeScreen from '@/screens/community/CommunityHomeScreen';

type Section = 'marketplace' | 'prices' | 'shop' | 'community';

export default function SectionTabNavigator() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;
  const [activeSection, setActiveSection] = useState<Section>('marketplace');

  const sections: { id: Section; label: string }[] = [
    { id: 'marketplace', label: 'Lida Cacau' },
    { id: 'prices', label: 'Precos' },
    { id: 'community', label: 'Comunidade' },
    { id: 'shop', label: 'LidaShop' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'marketplace':
        return <UnifiedTabNavigator />;
      case 'prices':
        return <CacauParaStackNavigator />;
      case 'community':
        return <CommunityHomeScreen />;
      case 'shop':
        return <ShopListScreen />;
      default:
        return <UnifiedTabNavigator />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDefault }}>
      <View style={{ paddingTop: insets.top }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.sectionTabs, { backgroundColor: colors.backgroundDefault, borderBottomColor: colors.border }]}
          contentContainerStyle={styles.sectionTabsContent}
        >
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
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTabs: {
    borderBottomWidth: 1,
  },
  sectionTabsContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  sectionTab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
