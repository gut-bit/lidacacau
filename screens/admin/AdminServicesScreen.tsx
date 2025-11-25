import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { ServiceType } from '@/types';
import { formatCurrency, getLevelLabel } from '@/utils/format';

export default function AdminServicesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const renderServiceItem = ({ item }: { item: ServiceType }) => {
    return (
      <View style={[styles.serviceCard, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.serviceHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Feather name={item.icon as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.serviceInfo}>
            <ThemedText type="h4">{item.name}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              ID: {item.id}
            </ThemedText>
          </View>
        </View>

        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Unidade
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {item.unit}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Preço Base
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.accent, fontWeight: '600' }}>
              {formatCurrency(item.basePrice)}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Nível Mínimo
            </ThemedText>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: LevelColors[`N${item.minLevel}` as keyof typeof LevelColors] },
              ]}
            >
              <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {getLevelLabel(item.minLevel)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={SERVICE_TYPES}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <Feather name="info" size={16} color={colors.primary} />
            <ThemedText type="small" style={{ color: colors.primary, flex: 1 }}>
              Estes são os tipos de serviço padrão do sistema. Em versões futuras você poderá adicionar novos serviços.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(45, 80, 22, 0.1)',
    marginBottom: Spacing.md,
  },
  serviceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
