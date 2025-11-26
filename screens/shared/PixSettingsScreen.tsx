import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { updateUser } from '@/utils/storage';

type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

interface PixKeyTypeOption {
  type: PixKeyType;
  label: string;
  icon: string;
  placeholder: string;
  keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  mask?: (value: string) => string;
}

const PIX_KEY_TYPES: PixKeyTypeOption[] = [
  {
    type: 'cpf',
    label: 'CPF',
    icon: 'credit-card',
    placeholder: '000.000.000-00',
    keyboardType: 'numeric',
    mask: (value: string) => {
      const cleaned = value.replace(/\D/g, '').slice(0, 11);
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    },
  },
  {
    type: 'email',
    label: 'E-mail',
    icon: 'mail',
    placeholder: 'seu@email.com',
    keyboardType: 'email-address',
  },
  {
    type: 'phone',
    label: 'Telefone',
    icon: 'phone',
    placeholder: '(00) 00000-0000',
    keyboardType: 'phone-pad',
    mask: (value: string) => {
      const cleaned = value.replace(/\D/g, '').slice(0, 11);
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    },
  },
  {
    type: 'random',
    label: 'Chave Aleatoria',
    icon: 'key',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyboardType: 'default',
  },
];

export default function PixSettingsScreen() {
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const isWorker = user?.activeRole === 'worker';
  const currentProfile = isWorker ? user?.workerProfile : user?.producerProfile;

  const [selectedType, setSelectedType] = useState<PixKeyType>(currentProfile?.pixKeyType || 'cpf');
  const [pixKey, setPixKey] = useState(currentProfile?.pixKey || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentProfile?.pixKey) {
      setPixKey(currentProfile.pixKey);
      setSelectedType(currentProfile.pixKeyType || 'cpf');
    }
  }, [currentProfile]);

  const selectedOption = PIX_KEY_TYPES.find((t) => t.type === selectedType) || PIX_KEY_TYPES[0];

  const handleKeyChange = (value: string) => {
    if (selectedOption.mask) {
      setPixKey(selectedOption.mask(value));
    } else {
      setPixKey(value);
    }
  };

  const validatePixKey = (): boolean => {
    const cleanedKey = pixKey.replace(/\D/g, '');
    
    switch (selectedType) {
      case 'cpf':
        if (cleanedKey.length !== 11) {
          Alert.alert('Erro', 'CPF deve conter 11 digitos');
          return false;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKey)) {
          Alert.alert('Erro', 'Digite um e-mail valido');
          return false;
        }
        break;
      case 'phone':
        if (cleanedKey.length < 10 || cleanedKey.length > 11) {
          Alert.alert('Erro', 'Telefone deve conter 10 ou 11 digitos');
          return false;
        }
        break;
      case 'random':
        if (pixKey.trim().length < 32) {
          Alert.alert('Erro', 'Chave aleatoria deve ter pelo menos 32 caracteres');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSave = async () => {
    if (!pixKey.trim()) {
      Alert.alert('Erro', 'Digite sua chave PIX');
      return;
    }

    if (!validatePixKey()) return;

    if (!user) return;

    setSaving(true);
    try {
      const profileKey = isWorker ? 'workerProfile' : 'producerProfile';
      await updateUser(user.id, {
        [profileKey]: {
          ...currentProfile,
          pixKey: pixKey.trim(),
          pixKeyType: selectedType,
        },
      });
      
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Sua chave PIX foi salva com sucesso!');
    } catch (error: any) {
      console.error('Error saving pix key:', error);
      Alert.alert('Erro', error.message || 'Nao foi possivel salvar a chave PIX');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (!currentProfile?.pixKey) return;

    Alert.alert(
      'Remover Chave PIX',
      'Tem certeza que deseja remover sua chave PIX? Voce nao podera receber pagamentos ate cadastrar uma nova.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setSaving(true);
            try {
              const profileKey = isWorker ? 'workerProfile' : 'producerProfile';
              const updatedProfile = { ...currentProfile };
              delete updatedProfile.pixKey;
              delete updatedProfile.pixKeyType;
              
              await updateUser(user.id, { [profileKey]: updatedProfile });
              await refreshUser();
              setPixKey('');
              setSelectedType('cpf');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Removido', 'Sua chave PIX foi removida');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Nao foi possivel remover');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="info" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
              Chave PIX para Recebimentos
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.primary, marginTop: Spacing.xs }}>
              Configure sua chave PIX para receber pagamentos dos servicos realizados
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Tipo de Chave
          </ThemedText>
          <View style={styles.typeGrid}>
            {PIX_KEY_TYPES.map((type) => (
              <Pressable
                key={type.type}
                style={({ pressed }) => [
                  styles.typeCard,
                  { 
                    backgroundColor: colors.card,
                    borderColor: selectedType === type.type ? colors.primary : colors.border,
                    borderWidth: selectedType === type.type ? 2 : 1,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedType(type.type);
                  setPixKey('');
                }}
              >
                <Feather 
                  name={type.icon as any} 
                  size={24} 
                  color={selectedType === type.type ? colors.primary : colors.textSecondary} 
                />
                <ThemedText 
                  type="small" 
                  style={{ 
                    marginTop: Spacing.sm,
                    fontWeight: selectedType === type.type ? '600' : '400',
                    color: selectedType === type.type ? colors.primary : colors.text,
                  }}
                >
                  {type.label}
                </ThemedText>
                {selectedType === type.type && (
                  <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Sua Chave PIX
          </ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name={selectedOption.icon as any} size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={selectedOption.placeholder}
              placeholderTextColor={colors.textSecondary}
              value={pixKey}
              onChangeText={handleKeyChange}
              keyboardType={selectedOption.keyboardType}
              autoCapitalize={selectedType === 'email' ? 'none' : 'characters'}
              autoCorrect={false}
            />
          </View>
        </View>

        {currentProfile?.pixKey && (
          <View style={[styles.currentKeyCard, { backgroundColor: colors.success + '15' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText type="small" style={{ color: colors.success }}>
                Chave PIX Cadastrada
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.xs }}>
                {currentProfile.pixKey}
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="save" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                Salvar Chave PIX
              </>
            )}
          </Button>

          {currentProfile?.pixKey && (
            <Pressable
              style={({ pressed }) => [
                styles.removeButton,
                { backgroundColor: colors.error + '15', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleRemove}
              disabled={saving}
            >
              <Feather name="trash-2" size={18} color={colors.error} />
              <ThemedText type="body" style={{ color: colors.error, marginLeft: Spacing.sm }}>
                Remover Chave
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View style={[styles.securityNote, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="shield" size={16} color={colors.textSecondary} />
          <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
            Sua chave PIX e armazenada de forma segura e sera utilizada apenas para receber pagamentos na plataforma.
          </ThemedText>
        </View>
      </ScreenKeyboardAwareScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  section: {},
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    position: 'relative',
  },
  checkMark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  currentKeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
