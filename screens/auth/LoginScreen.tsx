import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
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

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { login, register, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('producer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const colors = isDark ? Colors.dark : Colors.light;
  const autoLoginAttempted = useRef(false);

  // Auto-login in dev mode
  React.useEffect(() => {
    if (__DEV__ && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true;
      const autoLogin = async () => {
        try {
          await login('maria@demo.lidacacau.com', 'demo123');
          console.log('[DEV] Auto-login successful');
        } catch (error) {
          console.log('[DEV] Auto-login failed:', (error as any)?.message);
        }
      };
      autoLogin();
    }
  }, [login]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      Alert.alert('Erro', 'Preencha seu nome');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim(), role);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Ocorreu um erro');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setEmail('');
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

          <Button onPress={handleSubmit} disabled={isLoading} style={styles.submitButton}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : mode === 'login' ? (
              'Entrar'
            ) : (
              'Criar Conta'
            )}
          </Button>

          <View style={styles.toggleContainer}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </ThemedText>
            <Pressable onPress={toggleMode}>
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                {mode === 'login' ? ' Criar conta' : ' Entrar'}
              </ThemedText>
            </Pressable>
          </View>
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
});
