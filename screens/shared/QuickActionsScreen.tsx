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
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { trackEvent } from '@/utils/analytics';

interface ActionItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

export default function QuickActionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { activeRole } = useAuth();
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

  const isProducer = activeRole === 'producer';

  const actions: ActionItem[] = [
    {
      id: 'create_card',
      icon: isProducer ? 'file-plus' : 'briefcase',
      title: isProducer ? 'Criar Demanda' : 'Criar Oferta',
      subtitle: isProducer 
        ? 'Publique um servico que voce precisa' 
        : 'Ofereca seus servicos para produtores',
      color: colors.primary,
      onPress: () => handleAction('create_card', () => navigation.replace('CreateJob')),
    },
    {
      id: 'search_people',
      icon: 'users',
      title: 'Buscar Pessoas',
      subtitle: 'Encontre produtores ou trabalhadores',
      color: colors.handshake,
      onPress: () => handleAction('search_people', () => navigation.replace('UserSearch')),
    },
  ];

  const ActionCard = ({ item }: { item: ActionItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        { 
          backgroundColor: colors.backgroundDefault,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={item.onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <Feather name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText type="h4" style={styles.actionTitle}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          {item.subtitle}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={24} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      
      {Platform.OS === 'ios' ? (
        <BlurView 
          intensity={80} 
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.xl }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <ThemedText type="h3" style={styles.title}>
              O que voce quer fazer?
            </ThemedText>
            <Pressable 
              style={[styles.closeButton, { backgroundColor: colors.backgroundDefault }]}
              onPress={handleClose}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <ActionCard key={action.id} item={action} />
            ))}
          </View>

          <View style={styles.roleIndicator}>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
              <Feather 
                name={isProducer ? 'home' : 'tool'} 
                size={14} 
                color={colors.primary} 
              />
              <ThemedText type="small" style={{ color: colors.primary }}>
                Modo: {isProducer ? 'Produtor' : 'Trabalhador'}
              </ThemedText>
            </View>
          </View>
        </BlurView>
      ) : (
        <View 
          style={[
            styles.content,
            { 
              backgroundColor: colors.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.xl 
            }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <ThemedText type="h3" style={styles.title}>
              O que voce quer fazer?
            </ThemedText>
            <Pressable 
              style={[styles.closeButton, { backgroundColor: colors.backgroundDefault }]}
              onPress={handleClose}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <ActionCard key={action.id} item={action} />
            ))}
          </View>

          <View style={styles.roleIndicator}>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
              <Feather 
                name={isProducer ? 'home' : 'tool'} 
                size={14} 
                color={colors.primary} 
              />
              <ThemedText type="small" style={{ color: colors.primary }}>
                Modo: {isProducer ? 'Produtor' : 'Trabalhador'}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
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
    marginBottom: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  actionTitle: {
    fontSize: 16,
  },
  roleIndicator: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
