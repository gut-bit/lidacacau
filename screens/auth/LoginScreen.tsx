import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { UserRole } from '@/types';

type AuthMode = 'login' | 'register';

type ErrorType = 'validation' | 'credentials' | 'network' | 'exists' | 'server' | null;

interface ErrorState {
  type: ErrorType;
  message: string;
}

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { login, register, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('producer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = isDark ? Colors.dark : Colors.light;

  const clearError = () => setError(null);

  const getErrorIcon = (type: ErrorType): string => {
    switch (type) {
      case 'credentials': return 'x-circle';
      case 'network': return 'wifi-off';
      case 'exists': return 'user-x';
      case 'server': return 'alert-triangle';
      default: return 'alert-circle';
    }
  };

  const parseErrorMessage = (errorMsg: string): ErrorState => {
    const lowerMsg = errorMsg.toLowerCase();
    
    if (lowerMsg.includes('senha') || lowerMsg.includes('password') || lowerMsg.includes('incorreta') || lowerMsg.includes('invalid')) {
      return { type: 'credentials', message: 'Email ou senha incorretos' };
    }
    if (lowerMsg.includes('usuario nao encontrado') || lowerMsg.includes('not found') || lowerMsg.includes('nao existe')) {
      return { type: 'credentials', message: 'Usuario nao encontrado. Verifique o email ou crie uma conta.' };
    }
    if (lowerMsg.includes('ja existe') || lowerMsg.includes('already exists') || lowerMsg.includes('ja cadastrado')) {
      return { type: 'exists', message: 'Este email ja esta cadastrado. Tente fazer login.' };
    }
    if (lowerMsg.includes('network') || lowerMsg.includes('conexao') || lowerMsg.includes('internet')) {
      return { type: 'network', message: 'Erro de conexao. Verifique sua internet.' };
    }
    if (lowerMsg.includes('server') || lowerMsg.includes('servidor')) {
      return { type: 'server', message: 'Erro no servidor. Tente novamente em alguns minutos.' };
    }
    
    return { type: 'validation', message: errorMsg };
  };

  const handleClearSession = async () => {
    try {
      await logout();
      setError(null);
      setPassword('');
    } catch (e) {
      console.log('Error clearing session:', e);
    }
  };

  const handleSubmit = async () => {
    clearError();

    if (!email.trim() || !password.trim()) {
      setError({ type: 'validation', message: 'Preencha todos os campos obrigatorios' });
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError({ type: 'validation', message: 'Preencha seu nome' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        console.log('[LoginScreen] Attempting login for:', email.trim());
        await login(email.trim(), password);
        console.log('[LoginScreen] Login succeeded');
      } else {
        console.log('[LoginScreen] Attempting register for:', email.trim());
        await register(email.trim(), password, name.trim(), role);
        console.log('[LoginScreen] Register succeeded');
      }
    } catch (err: any) {
      console.log('[LoginScreen] Auth error caught:', err.message);
      const errorMsg = err.message || 'Ocorreu um erro inesperado';
      const parsedError = parseErrorMessage(errorMsg);
      console.log('[LoginScreen] Setting error state:', parsedError);
      setError(parsedError);
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setPassword('');
    setName('');
  };

  const ScrollComponent = Platform.OS === 'web' ? ScrollView : KeyboardAwareScrollView;

  return (
    <ThemedView style={styles.container}>
      <ScrollComponent
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="h1" style={styles.appName}>
            LidaCacau
          </ThemedText>
          <ThemedText type="body" style={[styles.tagline, { color: colors.textSecondary }]}>
            Confianca de quem e da Lida
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <ThemedText type="h2" style={styles.title}>
            {mode === 'login' ? 'Bora pra Lida!' : 'Entre pra comunidade'}
          </ThemedText>

          {error ? (
            <Pressable 
              style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
              onPress={clearError}
            >
              <View style={styles.errorContent}>
                <Feather name={getErrorIcon(error.type) as any} size={20} color={colors.error} />
                <ThemedText type="body" style={[styles.errorText, { color: colors.error }]}>
                  {error.message}
                </ThemedText>
              </View>
              <Feather name="x" size={18} color={colors.error} />
            </Pressable>
          ) : null}

          {mode === 'register' && (
            <>
              <View style={styles.roleSelector}>
                <Pressable
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === 'producer' ? colors.primary : colors.backgroundDefault,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setRole('producer')}
                >
                  <Feather
                    name="home"
                    size={28}
                    color={role === 'producer' ? '#FFFFFF' : colors.text}
                  />
                  <ThemedText
                    type="body"
                    style={{ color: role === 'producer' ? '#FFFFFF' : colors.text, fontWeight: '600' }}
                  >
                    Sou Produtor
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: role === 'producer' ? '#FFFFFF' : colors.textSecondary, textAlign: 'center' }}
                  >
                    Preciso de mao de obra
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === 'worker' ? colors.primary : colors.backgroundDefault,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setRole('worker')}
                >
                  <Feather
                    name="tool"
                    size={28}
                    color={role === 'worker' ? '#FFFFFF' : colors.text}
                  />
                  <ThemedText
                    type="body"
                    style={{ color: role === 'worker' ? '#FFFFFF' : colors.text, fontWeight: '600' }}
                  >
                    Sou Trabalhador
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: role === 'worker' ? '#FFFFFF' : colors.textSecondary, textAlign: 'center' }}
                  >
                    Quero pegar lida
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="small" style={styles.label}>
                  Nome Completo
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
                  ]}
                >
                  <Feather name="user" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Seu nome"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <ThemedText type="body" style={styles.label}>
              Seu Email
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
              ]}
            >
              <Feather name="mail" size={24} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Digite seu email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText type="body" style={styles.label}>
              Sua Senha
            </ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
              ]}
            >
              <Feather name="lock" size={24} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Button onPress={handleSubmit} disabled={isSubmitting} style={styles.submitButton}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : mode === 'login' ? (
              'Entrar'
            ) : (
              'Criar Conta'
            )}
          </Button>

          <View style={styles.toggleContainer}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {mode === 'login' ? 'Nao tem uma conta?' : 'Ja tem uma conta?'}
            </ThemedText>
            <Pressable onPress={toggleMode}>
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                {mode === 'login' ? ' Criar conta' : ' Entrar'}
              </ThemedText>
            </Pressable>
          </View>

          <Pressable onPress={handleClearSession} style={styles.clearSessionButton}>
            <Feather name="log-out" size={16} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Limpar sessao anterior
            </ThemedText>
          </Pressable>
        </View>
      </ScrollComponent>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  appName: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  tagline: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  roleButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    minHeight: 100,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 18,
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  errorText: {
    flex: 1,
    fontWeight: '500',
  },
  clearSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
});
