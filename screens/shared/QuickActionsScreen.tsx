import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { trackEvent } from '@/utils/analytics';

export default function QuickActionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleAction = (actionId: string, navigateTo: () => void) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackEvent('quick_action_tap', { action: actionId });
    navigateTo();
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'ios') {
      return (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl }
          ]}
        >
          {children}
        </BlurView>
      );
    }
    return (
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.xl
          }
        ]}
      >
        {children}
      </View>
    );
  };

  const PrimaryButton = ({
    title,
    subtitle,
    icon,
    color,
    onPress
  }: {
    title: string;
    subtitle: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: color,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...Shadows.card,
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.primaryIconContainer}>
        <Feather name={icon} size={32} color="#FFFFFF" />
      </View>
      <View style={styles.primaryTextContainer}>
        <ThemedText type="h4" style={{ color: '#FFFFFF', textAlign: 'center' }}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 2 }}>
          {subtitle}
        </ThemedText>
      </View>
    </Pressable>
  );

  const SecondaryButton = ({
    title,
    icon,
    color,
    onPress
  }: {
    title: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.secondaryIconContainer, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText type="body" style={{ fontWeight: '600' }}>{title}</ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <ContentWrapper>
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <ThemedText type="h3">O que voce quer fazer?</ThemedText>
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.backgroundDefault }]}
              onPress={handleClose}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {/* Primary Actions */}
          <View style={styles.row}>
            <PrimaryButton
              title="Quero Lida"
              subtitle="Oferecer servico"
              icon="tool"
              color={colors.handshake || '#2E7D32'} // Fallback if handshake not defined
              onPress={() => handleAction('offer_service', () =>
                navigation.replace('CreateCard', { type: 'offer' })
              )}
            />
            <PrimaryButton
              title="Preciso de Lida"
              subtitle="Contratar gente"
              icon="user-plus"
              color={colors.primary}
              onPress={() => handleAction('hire_service', () =>
                navigation.replace('CreateCard', { type: 'demand' })
              )}
            />
          </View>

          {/* Secondary Actions Row */}
          <View style={styles.row}>
            <SecondaryButton
              title="Buscar Gente"
              icon="users"
              color={colors.accent}
              onPress={() => handleAction('search_people', () => navigation.replace('UserSearch'))}
            />
            <SecondaryButton
              title="Montar Time"
              icon="shield"
              color={colors.secondary}
              onPress={() => handleAction('create_squad', () => navigation.replace('CreateSquad'))}
            />
          </View>

          {/* Tertiary Action */}
          <Pressable
            style={[styles.listButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleAction('register_property', () => navigation.replace('PropertyForm', {}))}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={[styles.secondaryIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Feather name="map-pin" size={20} color={colors.success} />
              </View>
              <ThemedText type="body" style={{ fontWeight: '600' }}>Cadastrar Propriedade</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>

        </View>
      </ContentWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  primaryIconContainer: {
    marginBottom: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTextContainer: {
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  secondaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
