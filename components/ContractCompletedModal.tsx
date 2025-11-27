import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { ThemedText } from './ThemedText';
import { AnimatedButton } from './AnimatedButton';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

interface ContractCompletedModalProps {
  visible: boolean;
  onClose: () => void;
  producerName: string;
  workerName: string;
  serviceType: string;
  totalValue: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ContractCompletedModal({
  visible,
  onClose,
  producerName,
  workerName,
  serviceType,
  totalValue,
}: ContractCompletedModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const checkScale = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 150 }));
      contentOpacity.value = withDelay(400, withSpring(1));
      pulseScale.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withSpring(1.05, { damping: 10 }),
            withSpring(1, { damping: 10 })
          ),
          3,
          false
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      checkScale.value = 0;
      contentOpacity.value = 0;
      pulseScale.value = 1;
    }
  }, [visible]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value * pulseScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={30} style={styles.overlay}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          style={[styles.modalContainer, { backgroundColor: colors.backgroundDefault }]}
        >
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.successIconContainer,
                { backgroundColor: colors.success + '20' },
                checkAnimatedStyle,
              ]}
            >
              <Feather name="check-circle" size={56} color={colors.success} />
            </Animated.View>
            
            <ThemedText type="h2" style={styles.title}>
              Contrato Assinado!
            </ThemedText>
            
            <ThemedText type="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ambas as partes assinaram. O trabalho pode comecar!
            </ThemedText>
          </View>

          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.summaryRow}>
                <Feather name="briefcase" size={18} color={colors.primary} />
                <View style={styles.summaryInfo}>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Servico
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {serviceType}
                  </ThemedText>
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.summaryRow}>
                <Feather name="dollar-sign" size={18} color={colors.accent} />
                <View style={styles.summaryInfo}>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Valor Total
                  </ThemedText>
                  <ThemedText type="h4" style={{ color: colors.accent }}>
                    {formatCurrency(totalValue)}
                  </ThemedText>
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.partiesRow}>
                <View style={styles.partyCard}>
                  <View style={[styles.partyIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Feather name="home" size={16} color={colors.primary} />
                  </View>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Produtor
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '500' }} numberOfLines={1}>
                    {producerName}
                  </ThemedText>
                  <View style={[styles.signedBadge, { backgroundColor: colors.success + '15' }]}>
                    <Feather name="check" size={12} color={colors.success} />
                    <ThemedText type="small" style={{ color: colors.success, marginLeft: 4 }}>
                      Assinado
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.partyCard}>
                  <View style={[styles.partyIcon, { backgroundColor: colors.secondary + '15' }]}>
                    <Feather name="user" size={16} color={colors.secondary} />
                  </View>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Trabalhador
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '500' }} numberOfLines={1}>
                    {workerName}
                  </ThemedText>
                  <View style={[styles.signedBadge, { backgroundColor: colors.success + '15' }]}>
                    <Feather name="check" size={12} color={colors.success} />
                    <ThemedText type="small" style={{ color: colors.success, marginLeft: 4 }}>
                      Assinado
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
              <Feather name="info" size={18} color={colors.primary} />
              <ThemedText type="small" style={{ color: colors.primary, flex: 1, marginLeft: Spacing.sm }}>
                O contrato foi salvo no seu historico. O trabalhador ja pode iniciar o servico.
              </ThemedText>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <AnimatedButton
              onPress={onClose}
              title="Continuar"
              icon="arrow-right"
              variant="success"
              showSuccessAnimation
            />
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  overlayPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  partiesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  partyCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  partyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});
