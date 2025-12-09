import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { BlurView } from 'expo-blur';

const BRAND_PRIMARY = '#F15A29';
const BRAND_SECONDARY = '#7ED957';

const INTRO_SEEN_KEY = '@lidacacau_intro_seen';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroVideoModalProps {
  onClose?: () => void;
}

const INTRO_SLIDES = [
  {
    title: 'Bem-vindo ao LidaCacau',
    description: 'O marketplace que conecta produtores rurais e trabalhadores da Transamazonica.',
    icon: 'home' as const,
  },
  {
    title: 'Para Produtores',
    description: 'Publique demandas de trabalho e encontre profissionais qualificados com avaliações verificadas.',
    icon: 'briefcase' as const,
  },
  {
    title: 'Para Trabalhadores',
    description: 'Encontre oportunidades de trabalho na sua regiao e construa sua reputacao.',
    icon: 'users' as const,
  },
  {
    title: 'Confianca da Lida',
    description: 'Sistema de avaliacoes, verificacao de identidade e historico de trabalhos realizados.',
    icon: 'shield' as const,
  },
  {
    title: 'Comece Agora',
    description: 'Explore demandas, conecte-se com a comunidade e faca parte da revolucao rural.',
    icon: 'zap' as const,
  },
];

export function IntroVideoModal({ onClose }: IntroVideoModalProps) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfIntroSeen();
  }, []);

  const checkIfIntroSeen = async () => {
    try {
      const seen = await AsyncStorage.getItem(INTRO_SEEN_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch (error) {
      console.log('[IntroVideoModal] Error checking intro status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
    } catch (error) {
      console.log('[IntroVideoModal] Error saving intro status:', error);
    }
    setVisible(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentSlide < INTRO_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (loading || !visible) {
    return null;
  }

  const slide = INTRO_SLIDES[currentSlide];
  const isLastSlide = currentSlide === INTRO_SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} style={styles.blurContainer}>
          <View style={[styles.content, isDark ? styles.contentDark : styles.contentLight]}>
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <ThemedText style={styles.skipText}>Pular</ThemedText>
            </Pressable>

            <View style={styles.slideContainer}>
              <View style={[styles.iconContainer, { backgroundColor: BRAND_PRIMARY }]}>
                <Feather name={slide.icon} size={48} color="white" />
              </View>
              
              <ThemedText style={styles.title}>{slide.title}</ThemedText>
              <ThemedText style={styles.description}>{slide.description}</ThemedText>
            </View>

            <View style={styles.dotsContainer}>
              {INTRO_SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentSlide ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            <Pressable
              style={[styles.nextButton, { backgroundColor: BRAND_PRIMARY }]}
              onPress={handleNext}
            >
              <ThemedText style={styles.nextButtonText}>
                {isLastSlide ? 'Comecar' : 'Proximo'}
              </ThemedText>
              <Feather
                name={isLastSlide ? 'check' : 'arrow-right'}
                size={20}
                color="white"
              />
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  contentLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  contentDark: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
    opacity: 0.7,
  },
  slideContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: BRAND_PRIMARY,
  },
  dotInactive: {
    backgroundColor: '#D7CCC8',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IntroVideoModal;
