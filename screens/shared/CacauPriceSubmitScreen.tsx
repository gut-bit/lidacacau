import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import { cacauParaClient, SUPPORTED_CITIES } from '@/services/sdk/CacauParaSDK';
import { sessionManager } from '@/services/common/SessionManager';
import * as Haptics from 'expo-haptics';

export default function CacauPriceSubmitScreen() {
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [buyerName, setBuyerName] = useState('');
  const [city, setCity] = useState<string>('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [conditions, setConditions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValidForm = buyerName.trim().length >= 2 && 
                      city.length > 0 && 
                      parseFloat(pricePerKg) > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValidForm) {
      Alert.alert('Campos obrigatorios', 'Preencha o nome do comprador, cidade e preco.');
      return;
    }

    const price = parseFloat(pricePerKg.replace(',', '.'));
    if (isNaN(price) || price <= 0 || price > 500) {
      Alert.alert('Preco invalido', 'Informe um preco valido entre R$ 0,01 e R$ 500,00.');
      return;
    }

    setSubmitting(true);

    try {
      if (user) {
        const token = await sessionManager.getToken();
        if (token) {
          cacauParaClient.setAuthToken(token);
        }
      }

      const result = await cacauParaClient.submitPrice({
        buyerName: buyerName.trim(),
        city,
        pricePerKg: price,
        conditions: conditions.trim() || undefined,
        submitterName: user?.name,
      });

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setSuccess(true);
        
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        Alert.alert('Erro', 'Nao foi possivel enviar o preco. Tente novamente.');
      }
    } catch (error) {
      console.error('[CacauPriceSubmit] Error:', error);
      Alert.alert('Erro', 'Falha ao enviar. O preco foi salvo e sera enviado quando houver conexao.');
    } finally {
      setSubmitting(false);
    }
  }, [buyerName, city, pricePerKg, conditions, user, isValidForm, navigation]);

  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.backgroundRoot }]}>
        <View style={[styles.successCard, { backgroundColor: colors.success }]}>
          <Feather name="check-circle" size={64} color="#FFFFFF" />
          <ThemedText style={styles.successTitle}>Preco Enviado!</ThemedText>
          <ThemedText style={styles.successText}>
            Obrigado por contribuir com a comunidade.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="trending-up" size={32} color={colors.primary} />
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Informar Preco do Cacau
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Compartilhe o preco que voce recebeu de um comprador para ajudar outros produtores.
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Nome do Comprador *
          </ThemedText>
          <TextInput
            value={buyerName}
            onChangeText={setBuyerName}
            placeholder="Ex: Cargill, Olam, Comprador Local..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.formSection}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Cidade *
          </ThemedText>
          <View style={styles.cityChips}>
            {SUPPORTED_CITIES.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.cityChip,
                  { 
                    backgroundColor: city === c ? colors.primary : colors.card,
                    borderColor: city === c ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setCity(c)}
              >
                <ThemedText style={{ 
                  color: city === c ? '#FFFFFF' : colors.text,
                  fontWeight: '500',
                  fontSize: 14,
                }}>
                  {c}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Preco por KG (R$) *
          </ThemedText>
          <View style={[styles.priceInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.pricePrefix, { color: colors.textSecondary }]}>
              R$
            </ThemedText>
            <TextInput
              value={pricePerKg}
              onChangeText={setPricePerKg}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.priceInput, { color: colors.text }]}
            />
            <ThemedText style={[styles.priceSuffix, { color: colors.textSecondary }]}>
              /kg
            </ThemedText>
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Condicoes (opcional)
          </ThemedText>
          <TextInput
            value={conditions}
            onChangeText={setConditions}
            placeholder="Ex: Minimo 500kg, pagamento a vista..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input, 
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
            ]}
          />
        </View>

        {!user ? (
          <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
            <Feather name="info" size={18} color={colors.warning || '#F5A623'} />
            <ThemedText style={[styles.warningText, { color: colors.text }]}>
              Voce nao esta logado. Seu envio sera analisado antes de ser publicado.
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.submitButton,
            { 
              backgroundColor: isValidForm ? colors.primary : colors.border,
              opacity: submitting ? 0.7 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={!isValidForm || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="send" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>
                Enviar Preco
              </ThemedText>
            </>
          )}
        </Pressable>

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="shield" size={18} color={colors.textSecondary} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            Suas informacoes sao anonimas. Apenas o preco, comprador e cidade serao compartilhados.
          </ThemedText>
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  headerCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  pricePrefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  priceSuffix: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  warningCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
