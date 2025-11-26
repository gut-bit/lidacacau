import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { VerificationStatus } from '@/types';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function VerifiedBadge({ status, size = 'medium', showLabel = false }: VerifiedBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  if (status !== 'approved') return null;

  const iconSizes = { small: 12, medium: 16, large: 20 };
  const iconSize = iconSizes[size];

  if (!showLabel) {
    return (
      <View style={[styles.badgeCircle, { backgroundColor: colors.success }]}>
        <Feather name="check" size={iconSize} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={[styles.badgeWithLabel, { backgroundColor: colors.success + '15' }]}>
      <Feather name="check-circle" size={iconSize} color={colors.success} />
      <ThemedText type="small" style={[styles.label, { color: colors.success }]}>
        Verificado
      </ThemedText>
    </View>
  );
}

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
}

export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const config = {
    none: { icon: 'shield-off' as const, color: colors.textSecondary, label: 'Nao verificado' },
    pending: { icon: 'clock' as const, color: colors.accent, label: 'Em analise' },
    approved: { icon: 'check-circle' as const, color: colors.success, label: 'Verificado' },
    rejected: { icon: 'x-circle' as const, color: colors.error, label: 'Rejeitado' },
  };

  const { icon, color, label } = config[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
      <Feather name={icon} size={14} color={color} />
      <ThemedText type="small" style={[styles.statusLabel, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statusLabel: {
    fontWeight: '600',
  },
});
