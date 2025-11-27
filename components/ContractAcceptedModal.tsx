import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
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
import { SignedContract } from '@/types';
import { formatCurrency } from '@/utils/format';

interface ContractAcceptedModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  contract: SignedContract | null;
  isProducer: boolean;
  loading?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ContractAcceptedModal({
  visible,
  onClose,
  onAccept,
  contract,
  isProducer,
  loading = false,
}: ContractAcceptedModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [hasAccepted, setHasAccepted] = useState(false);
  
  const checkScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setHasAccepted(false);
      checkScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 200 }));
      contentOpacity.value = withDelay(200, withSpring(1));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      checkScale.value = 0;
      contentOpacity.value = 0;
    }
  }, [visible]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleToggleAccept = () => {
    Haptics.selectionAsync();
    setHasAccepted(!hasAccepted);
  };

  const handleAccept = () => {
    if (!hasAccepted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    onAccept();
  };

  if (!contract) return null;

  const bothSigned = contract.producerSignedAt && contract.workerSignedAt;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
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
              <Feather name="check-circle" size={48} color={colors.success} />
            </Animated.View>
            
            <ThemedText type="h3" style={styles.title}>
              {bothSigned ? 'Contrato Assinado!' : 'Novo Contrato'}
            </ThemedText>
            
            <ThemedText type="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
              {bothSigned 
                ? 'Ambas as partes assinaram. O trabalho pode comecar!'
                : 'Revise e aceite os termos do contrato'}
            </ThemedText>
          </View>

          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            <View style={[styles.contractSummary, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Servico
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {contract.serviceType}
                </ThemedText>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Valor Total
                </ThemedText>
                <ThemedText type="h4" style={{ color: colors.accent }}>
                  {formatCurrency(contract.totalValue)}
                </ThemedText>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Produtor
                </ThemedText>
                <View style={styles.signatureStatus}>
                  <ThemedText type="body">{contract.producerName}</ThemedText>
                  {contract.producerSignedAt ? (
                    <Feather name="check-circle" size={16} color={colors.success} style={styles.checkIcon} />
                  ) : (
                    <Feather name="clock" size={16} color={colors.textSecondary} style={styles.checkIcon} />
                  )}
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  Trabalhador
                </ThemedText>
                <View style={styles.signatureStatus}>
                  <ThemedText type="body">{contract.workerName}</ThemedText>
                  {contract.workerSignedAt ? (
                    <Feather name="check-circle" size={16} color={colors.success} style={styles.checkIcon} />
                  ) : (
                    <Feather name="clock" size={16} color={colors.textSecondary} style={styles.checkIcon} />
                  )}
                </View>
              </View>
            </View>

            <ScrollView 
              style={[styles.contractTextBox, { backgroundColor: colors.backgroundSecondary }]}
              nestedScrollEnabled
            >
              <ThemedText type="small" style={[styles.contractText, { color: colors.text }]}>
                {contract.text}
              </ThemedText>
            </ScrollView>

            {!bothSigned && (
              <Pressable
                style={[
                  styles.acceptanceBox,
                  {
                    backgroundColor: hasAccepted ? colors.primary + '15' : colors.backgroundSecondary,
                    borderColor: hasAccepted ? colors.primary : colors.border,
                  },
                ]}
                onPress={handleToggleAccept}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.primary,
                      backgroundColor: hasAccepted ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {hasAccepted && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
                <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.md }}>
                  Eu li e aceito os termos do contrato
                </ThemedText>
              </Pressable>
            )}
          </Animated.View>

          <View style={styles.footer}>
            {bothSigned ? (
              <AnimatedButton
                onPress={onClose}
                title="Fechar"
                icon="check"
                variant="success"
                showSuccessAnimation
              />
            ) : (
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <ThemedText type="body" style={{ color: colors.textSecondary }}>
                    Cancelar
                  </ThemedText>
                </Pressable>
                
                <AnimatedButton
                  onPress={handleAccept}
                  title="Aceitar e Assinar"
                  icon="edit-3"
                  disabled={!hasAccepted}
                  loading={loading}
                  showSuccessAnimation
                  style={{ flex: 1, marginLeft: Spacing.md }}
                />
              </View>
            )}
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
    paddingBottom: Spacing.lg,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
  contractSummary: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  contractTextBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: 150,
    marginBottom: Spacing.md,
  },
  contractText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  acceptanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});
