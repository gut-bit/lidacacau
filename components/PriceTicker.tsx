import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

interface PriceTickerProps {
  compact?: boolean;
  showLocalQuotes?: boolean;
}

export function PriceTicker({ 
  compact = false,
}: PriceTickerProps) {
  const { theme: colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate('CacauPrices');
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress}>
        <View style={[styles.compactContainer, { backgroundColor: colors.card }]}>
          <View style={styles.compactLeft}>
            <View style={[styles.cacaoIcon, { backgroundColor: '#8B4513' }]}>
              <Feather name="tool" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.compactContent}>
              <ThemedText style={[styles.compactLabel, { color: colors.text }]}>
                Preco do Cacau
              </ThemedText>
              <ThemedText style={[styles.constructionText, { color: colors.warning || '#F5A623' }]}>
                Em construcao
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.constructionContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#8B4513' }]}>
            <Feather name="tool" size={28} color="#FFFFFF" />
          </View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Cotacao do Cacau
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: colors.warning + '20' || '#F5A62320' }]}>
            <Feather name="clock" size={14} color={colors.warning || '#F5A623'} />
            <ThemedText style={[styles.badgeText, { color: colors.warning || '#F5A623' }]}>
              Em construcao
            </ThemedText>
          </View>
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            Estamos trabalhando para trazer precos em tempo real do cacau. Em breve disponivel!
          </ThemedText>
          <View style={styles.tapHint}>
            <ThemedText style={[styles.tapHintText, { color: colors.primary }]}>
              Toque para saber mais
            </ThemedText>
            <Feather name="arrow-right" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  constructionContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cacaoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    gap: 2,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  constructionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
