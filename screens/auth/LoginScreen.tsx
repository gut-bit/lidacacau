import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { UserRole } from '@/types';
import { biometricService } from '@/services/common/BiometricService';
import { sessionManager } from '@/services/common/SessionManager';

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
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);

  const colors = isDark ? Colors.dark : Colors.light;

  React.useEffect(() => {
    const checkBiometrics = async () => {
      const available = await biometricService.isAvailable();
      setIsBiometricsAvailable(available);

      const hasSession = await sessionManager.isSessionValid();
      setHasSavedSession(hasSession);

      // Auto-trigger biometrics if available and we have a session but auth context says we are on login screen
      // (This happens if token is valid but we want extra confirmation)
      // For now, let's just make the button available.
    };
    checkBiometrics();
  }, []);

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

    // Explicit server error patterns
    if (lowerMsg.includes('connect econnrefused')) {
      return { type: 'server', message: 'Erro de conexao com o banco de dados. O servidor esta em manutencao.' };
    }
    if (lowerMsg.includes('timeout')) {
      return { type: 'network', message: 'A conexao demorou muito. Verifique sua internet.' };
    }

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

    // If it's a direct message from server without standard pattern, show it explicitly
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

  const handleBiometricLogin = async () => {
    try {
      const success = await biometricService.authenticate('Acesse o LidaCacau com sua biometria');
      if (success) {
        setIsSubmitting(true);
        // If we have a valid token, AuthContext should handle it if we refresh.
        // But if we are on this screen, we might need to manually trigger the initialization.
        const token = await sessionManager.getToken();
        if (token) {
          // Re-initialize session via AuthContext or simply wait for it to pick up
          // For a better UX, we can show a success message or just let the navigator switch
          // Since AuthContext already checks it on mount, we might just need to refresh the user
          window.location?.reload(); // Simplest way to trigger re-init if on web, but on native we need a better way
        } else {
          setError({ type: 'credentials', message: 'Nenhuma sessao salva encontrada. Faca login com senha primeiro.' });
        }
      }
    } catch (err: any) {
      setError({ type: 'server', message: 'Erro na autenticacao biometrica' });
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

          {mode === 'login' && (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginHorizontal: Spacing.md }}>ou</ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <Button
                variant="outline"
                style={styles.googleButton}
                onPress={() => setError({ type: 'validation', message: 'Login com Google estara disponivel na versao final. Use email e senha por enquanto.' })}
              >
                <Feather name="log-in" size={20} color={colors.text} style={{ marginRight: 10 }} />
                Entrar com Google
              </Button>

              {isBiometricsAvailable && hasSavedSession && (
                <Button
                  variant="outline"
                  style={[styles.biometricButton, { borderColor: colors.primary }]}
                  onPress={handleBiometricLogin}
                >
                  <MaterialCommunityIcons name="fingerprint" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                  Entrar com Biometria
                </Button>
              )}

              <Pressable
                style={[styles.quickAccess, { backgroundColor: colors.primary + '15' }]}
                onPress={() => {
                  setEmail('heltongut@gmail.com');
                  setPassword('password123');
                }}
              >
                <Feather name="zap" size={16} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: '700', marginLeft: 8 }}>
                  Acesso Rapido (Teste)
                </ThemedText>
              </Pressable>
            </>
          )}

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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  googleButton: {
    marginBottom: Spacing.md,
  },
  quickAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
  biometricButton: {
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
});
