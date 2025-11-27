import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { PaymentTermType, PaymentTerms, User } from '@/types';
import { updateWorkOrder, getWorkOrderById } from '@/utils/storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  workOrderId: string;
  worker: User;
  producer: User;
  serviceName: string;
  price: number;
  isProducer: boolean;
}

interface PaymentOption {
  type: PaymentTermType;
  title: string;
  description: string;
  icon: string;
  popular?: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    type: 'full_after',
    title: '100% Ap\u00f3s Conclus\u00e3o',
    description: 'Pagamento integral ao finalizar o servi\u00e7o',
    icon: 'check-circle',
    popular: true,
  },
  {
    type: 'split_50_50',
    title: '50% Antes, 50% Depois',
    description: 'Metade adiantado, metade na conclus\u00e3o',
    icon: 'git-merge',
  },
  {
    type: 'split_30_70',
    title: '30% Antes, 70% Depois',
    description: 'Adiantamento menor, maior parte ao final',
    icon: 'trending-up',
  },
  {
    type: 'per_unit',
    title: 'Por Unidade',
    description: 'Pagamento por planta, saca ou hectare trabalhado',
    icon: 'layers',
  },
  {
    type: 'per_hour',
    title: 'Por Hora',
    description: 'Valor calculado por hora de trabalho',
    icon: 'clock',
  },
  {
    type: 'per_day',
    title: 'Por Di\u00e1ria',
    description: 'Valor fixo por dia de trabalho',
    icon: 'calendar',
  },
  {
    type: 'advance_custom',
    title: 'Adiantamento Personalizado',
    description: 'Defina a porcentagem de adiantamento',
    icon: 'sliders',
  },
];

export default function NegotiationTermsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = theme;

  const { workOrderId, worker, producer, serviceName, price, isProducer } = route.params;

  const [selectedType, setSelectedType] = useState<PaymentTermType>('full_after');
  const [advancePercentage, setAdvancePercentage] = useState('30');
  const [unitPrice, setUnitPrice] = useState('');
  const [estimatedUnits, setEstimatedUnits] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectOption = (type: PaymentTermType) => {
    Haptics.selectionAsync();
    setSelectedType(type);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateTotal = (): number => {
    switch (selectedType) {
      case 'per_unit':
        const units = parseFloat(estimatedUnits) || 0;
        const unitPriceVal = parseFloat(unitPrice) || 0;
        return units * unitPriceVal;
      case 'per_hour':
        return parseFloat(hourlyRate) || 0;
      case 'per_day':
        return parseFloat(dailyRate) || 0;
      default:
        return price;
    }
  };

  const getAdvanceAmount = (): number => {
    const total = calculateTotal();
    switch (selectedType) {
      case 'split_50_50':
        return total * 0.5;
      case 'split_30_70':
        return total * 0.3;
      case 'advance_custom':
        const pct = parseFloat(advancePercentage) || 0;
        return total * (pct / 100);
      default:
        return 0;
    }
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const paymentTerms: PaymentTerms = {
        type: selectedType,
        notes: notes || undefined,
      };

      switch (selectedType) {
        case 'advance_custom':
          paymentTerms.advancePercentage = parseFloat(advancePercentage) || 30;
          break;
        case 'per_unit':
          paymentTerms.unitPrice = parseFloat(unitPrice) || 0;
          paymentTerms.estimatedUnits = parseFloat(estimatedUnits) || 0;
          break;
        case 'per_hour':
          paymentTerms.hourlyRate = parseFloat(hourlyRate) || 0;
          break;
        case 'per_day':
          paymentTerms.dailyRate = parseFloat(dailyRate) || 0;
          break;
      }

      const existingWorkOrder = await getWorkOrderById(workOrderId);
      const existingHistory = existingWorkOrder?.negotiationHistory || [];

      const newProposal = {
        id: Date.now().toString(),
        proposerId: user?.id || '',
        proposerRole: (isProducer ? 'producer' : 'worker') as 'producer' | 'worker',
        paymentTerms,
        totalPrice: calculateTotal(),
        status: 'proposed' as const,
        createdAt: new Date().toISOString(),
      };

      await updateWorkOrder(workOrderId, {
        paymentTerms,
        finalPrice: calculateTotal(),
        negotiationStatus: 'accepted',
        negotiationHistory: [...existingHistory, newProposal],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Termos Definidos',
        'Os termos de pagamento foram definidos. Agora e hora de assinar o contrato de empreitada.',
        [
          {
            text: 'Assinar Contrato',
            onPress: () => {
              navigation.replace('ContractSigning', {
                workOrderId,
                isProducer,
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'N\u00e3o foi poss\u00edvel enviar a proposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentDetails = () => {
    const total = calculateTotal();
    const advance = getAdvanceAmount();
    const remainder = total - advance;

    return (
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.summaryHeader}>
            <Feather name="file-text" size={20} color={colors.primary} />
            <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
              Resumo do Pagamento
            </ThemedText>
          </View>

          {selectedType === 'per_unit' ? (
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Pre\u00e7o por Unidade
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundDefault, color: colors.text, borderColor: colors.border }]}
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    placeholder="R$ 0,00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1, marginLeft: Spacing.md }]}>
                  <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Qtd. Estimada
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundDefault, color: colors.text, borderColor: colors.border }]}
                    value={estimatedUnits}
                    onChangeText={setEstimatedUnits}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          ) : selectedType === 'per_hour' ? (
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Valor por Hora
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundDefault, color: colors.text, borderColor: colors.border }]}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="R$ 0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          ) : selectedType === 'per_day' ? (
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Valor por Di\u00e1ria
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundDefault, color: colors.text, borderColor: colors.border }]}
                value={dailyRate}
                onChangeText={setDailyRate}
                placeholder="R$ 0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          ) : selectedType === 'advance_custom' ? (
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Porcentagem de Adiantamento
              </ThemedText>
              <View style={styles.percentageRow}>
                <TextInput
                  style={[styles.input, styles.percentageInput, { backgroundColor: colors.backgroundDefault, color: colors.text, borderColor: colors.border }]}
                  value={advancePercentage}
                  onChangeText={setAdvancePercentage}
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>%</ThemedText>
              </View>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRows}>
            {advance > 0 ? (
              <>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: colors.textSecondary }}>
                    Adiantamento
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600', color: colors.accent }}>
                    {formatCurrency(advance)}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: colors.textSecondary }}>
                    Ap\u00f3s Conclus\u00e3o
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {formatCurrency(remainder)}
                  </ThemedText>
                </View>
              </>
            ) : null}
            <View style={styles.summaryRow}>
              <ThemedText type="h4">
                Total
              </ThemedText>
              <ThemedText type="h3" style={{ color: colors.success }}>
                {formatCurrency(total)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.notesSection}>
          <ThemedText type="small" style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Observa\u00e7\u00f5es (opcional)
          </ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Adicione detalhes sobre o pagamento..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="briefcase" size={24} color={colors.primary} />
            </View>
            <ThemedText type="h3" style={styles.serviceName}>{serviceName}</ThemedText>
            <ThemedText type="h2" style={{ color: colors.success }}>{formatCurrency(price)}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              Valor acordado na proposta
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Forma de Pagamento
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.lg }}>
              Escolha como o pagamento ser\u00e1 realizado
            </ThemedText>

            {PAYMENT_OPTIONS.map((option, index) => (
              <Animated.View key={option.type} entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: selectedType === option.type 
                        ? colors.primary + '15' 
                        : colors.backgroundSecondary,
                      borderColor: selectedType === option.type 
                        ? colors.primary 
                        : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                  onPress={() => handleSelectOption(option.type)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Feather name={option.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <ThemedText type="body" style={{ fontWeight: '600' }}>
                        {option.title}
                      </ThemedText>
                      {option.popular ? (
                        <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
                          <ThemedText type="small" style={{ color: '#000', fontWeight: '600', fontSize: 11 }}>
                            Popular
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {option.description}
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    { borderColor: selectedType === option.type ? colors.primary : colors.border }
                  ]}>
                    {selectedType === option.type ? (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {renderPaymentDetails()}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.8 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.submitButtonText}>
              {isSubmitting ? 'Enviando...' : 'Enviar Proposta de Pagamento'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  serviceName: {
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  popularBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputWrapper: {},
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageInput: {
    width: 80,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  summaryRows: {
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  textArea: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
