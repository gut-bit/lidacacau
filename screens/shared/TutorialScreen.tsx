import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { updateUser, setCurrentUser } from '@/utils/storage';
import { trackEvent } from '@/utils/analytics';

interface TutorialCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
}

const TUTORIAL_CARDS: TutorialCard[] = [
  {
    id: '1',
    title: 'Bem-vindo ao LidaCacau!',
    description: 'Conectamos trabalhadores e produtores rurais em Uruara/PA',
    icon: 'heart',
    iconColor: '#F15A29',
  },
  {
    id: '2',
    title: 'Como Funciona',
    description: 'Produtores publicam demandas, trabalhadores enviam propostas',
    icon: 'briefcase',
    iconColor: '#7ED957',
  },
  {
    id: '3',
    title: 'Cards de Servico',
    description: 'Verde = Demandas | Azul = Ofertas. Deslize para ver mais',
    icon: 'layers',
    iconColor: '#0071BC',
  },
  {
    id: '4',
    title: 'Amigos do Campo',
    description: 'De a mao para outros usuarios e construa sua rede de confianca',
    icon: 'users',
    iconColor: '#43A047',
  },
  {
    id: '5',
    title: 'Pagamento Seguro',
    description: 'Pague com PIX. 90% para o trabalhador, 10% taxa da plataforma',
    icon: 'dollar-sign',
    iconColor: '#FFD100',
  },
  {
    id: '6',
    title: 'Seu Perfil',
    description: 'Complete seu perfil para receber mais propostas e oportunidades',
    icon: 'user',
    iconColor: '#4E342E',
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing['2xl'] * 2;
const CARD_MARGIN = Spacing.md;

export default function TutorialScreen({ onComplete }: { onComplete?: () => void }) {
  const { user, setUser } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < TUTORIAL_CARDS.length) {
      setCurrentIndex(index);
    }
  };

  const goToNextCard = () => {
    if (currentIndex < TUTORIAL_CARDS.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const goToCard = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  };

  const completeTutorial = async () => {
    if (!user) return;

    try {
      const updatedUser = { ...user, tutorialCompleted: true };
      await updateUser(user.id, { tutorialCompleted: true });
      await setCurrentUser(updatedUser);
      setUser(updatedUser);
      await trackEvent('tutorial_complete');
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  const isLastCard = currentIndex === TUTORIAL_CARDS.length - 1;

  const renderCard = (card: TutorialCard, index: number) => {
    const iconBgColor = card.iconColor + '20';

    return (
      <View key={card.id} style={[styles.cardWrapper, { width: SCREEN_WIDTH }]}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Feather name={card.icon} size={80} color={card.iconColor} />
          </View>

          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            {card.title}
          </ThemedText>

          <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
            {card.description}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {TUTORIAL_CARDS.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => goToCard(index)}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? theme.primary : theme.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={completeTutorial}
          style={({ pressed }) => [
            styles.skipButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ThemedText style={[styles.skipText, { color: theme.primary }]}>
            Pular
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="center"
          contentContainerStyle={styles.scrollContent}
        >
          {TUTORIAL_CARDS.map((card, index) => renderCard(card, index))}
        </ScrollView>
      </View>

      {renderDots()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={isLastCard ? completeTutorial : goToNextCard}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          {isLastCard ? (
            <>
              <Feather name="check" size={24} color="#FFFFFF" />
              <ThemedText style={styles.nextButtonText}>Comecar</ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.nextButtonText}>Proximo</ThemedText>
              <Feather name="chevron-right" size={24} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    minWidth: Spacing.touchTarget,
    minHeight: Spacing.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    ...Typography.body,
    fontFamily: 'Rubik_600SemiBold',
    fontWeight: '600',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  },
  cardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  card: {
    width: CARD_WIDTH,
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  cardTitle: {
    ...Typography.h1,
    fontSize: 28,
    fontFamily: 'Rubik_700Bold',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 36,
  },
  cardDescription: {
    ...Typography.body,
    fontSize: 18,
    fontFamily: 'Rubik_400Regular',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: Spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  nextButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextButtonText: {
    ...Typography.body,
    fontSize: 18,
    fontFamily: 'Rubik_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
