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

  const actions: ActionItem[] = [
    {
      id: 'offer_service',
      icon: 'tool',
      title: 'Quero fazer um servico',
      subtitle: 'Ofereca seus servicos para produtores',
      color: colors.handshake,
      onPress: () => handleAction('offer_service', () => 
        navigation.replace('CreateCard', { type: 'offer' })
      ),
    },
    {
      id: 'hire_service',
      icon: 'user-plus',
      title: 'Quero contratar um servico',
      subtitle: 'Publique uma demanda de trabalho',
      color: colors.primary,
      onPress: () => handleAction('hire_service', () => 
        navigation.replace('CreateCard', { type: 'demand' })
      ),
    },
    {
      id: 'search_people',
      icon: 'users',
      title: 'Buscar Pessoas',
      subtitle: 'Encontre produtores ou trabalhadores',
      color: colors.accent,
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

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      
      <ContentWrapper>
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
});
