import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { updateUser, getUsers } from '@/utils/storage';

const REFERRAL_XP_REWARD = 50;

export default function ReferralScreen() {
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [referralCode, setReferralCode] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [referrals, setReferrals] = useState<string[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      const code = user.referral?.code || generateReferralCode(user.id);
      setReferralCode(code);
      setReferrals(user.referral?.referrals || []);
      setTotalXpEarned(user.referral?.totalXpEarned || 0);
      
      if (!user.referral?.code) {
        updateUser(user.id, {
          referral: {
            code,
            referrals: [],
            totalXpEarned: 0,
          },
        });
      }
    }
  }, [user]);

  const generateReferralCode = (userId: string): string => {
    const base = userId.slice(-4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `EMPL${base}${random}`;
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Junte-se ao Empleitapp! Use meu codigo de indicacao: ${referralCode}\n\nBaixe o app e ganhe bonus: https://empleitapp.app`,
        title: 'Convite Empleitapp',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleApplyReferral = async () => {
    if (!user || !referralInput.trim()) return;
    
    if (user.referral?.referredBy) {
      Alert.alert('Aviso', 'Voce ja utilizou um codigo de indicacao.');
      return;
    }

    if (referralInput.toUpperCase() === referralCode) {
      Alert.alert('Erro', 'Voce nao pode usar seu proprio codigo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allUsers = await getUsers();
      const referrer = allUsers.find(u => u.referral?.code === referralInput.toUpperCase());
      
      if (!referrer) {
        Alert.alert('Erro', 'Codigo de indicacao invalido.');
        return;
      }

      await updateUser(user.id, {
        referral: {
          ...user.referral,
          code: referralCode,
          referredBy: referrer.id,
          referrals: user.referral?.referrals || [],
          totalXpEarned: (user.referral?.totalXpEarned || 0) + REFERRAL_XP_REWARD,
        },
      });

      const referrerReferrals = referrer.referral?.referrals || [];
      await updateUser(referrer.id, {
        referral: {
          ...referrer.referral,
          code: referrer.referral?.code || '',
          referrals: [...referrerReferrals, user.id],
          totalXpEarned: (referrer.referral?.totalXpEarned || 0) + REFERRAL_XP_REWARD,
        },
      });

      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sucesso!', 
        `Codigo aplicado! Voce ganhou ${REFERRAL_XP_REWARD} XP de bonus.`
      );
      setReferralInput('');
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel aplicar o codigo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Feather name="gift" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.md }}>
            Indique e Ganhe
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.sm }}>
            Convide amigos para o Empleitapp e ganhe {REFERRAL_XP_REWARD} XP por cada indicacao!
          </ThemedText>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <ThemedText type="h2" style={{ color: colors.primary }}>
                {referrals.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Indicacoes
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h2" style={{ color: colors.accent }}>
                {totalXpEarned}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                XP Ganho
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.codeCard, { backgroundColor: colors.card }, Shadows.card]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Seu Codigo de Indicacao
          </ThemedText>
          
          <View style={[styles.codeContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText type="h3" style={{ letterSpacing: 2 }}>
              {referralCode}
            </ThemedText>
            <Pressable
              style={[styles.copyButton, { backgroundColor: copied ? colors.success : colors.primary }]}
              onPress={handleCopyCode}
            >
              <Feather name={copied ? 'check' : 'copy'} size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <Button
            onPress={handleShareCode}
            style={{ marginTop: Spacing.lg, width: '100%' }}
          >
            <View style={styles.shareButtonContent}>
              <Feather name="share-2" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                Compartilhar Codigo
              </ThemedText>
            </View>
          </Button>
        </View>

        {!user?.referral?.referredBy && (
          <View style={[styles.applyCard, { backgroundColor: colors.card }, Shadows.card]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
              Tem um Codigo?
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary, marginBottom: Spacing.lg }}>
              Insira o codigo de quem te indicou e ganhe {REFERRAL_XP_REWARD} XP de bonus!
            </ThemedText>
            
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Digite o codigo aqui"
              placeholderTextColor={colors.textSecondary}
              value={referralInput}
              onChangeText={(text) => setReferralInput(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={12}
            />

            <Button
              onPress={handleApplyReferral}
              disabled={!referralInput.trim() || isSubmitting}
              style={{ marginTop: Spacing.md, width: '100%' }}
              variant="secondary"
            >
              {isSubmitting ? 'Aplicando...' : 'Aplicar Codigo'}
            </Button>
          </View>
        )}

        {user?.referral?.referredBy && (
          <View style={[styles.appliedCard, { backgroundColor: colors.success + '15' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <ThemedText type="body" style={{ color: colors.success, marginLeft: Spacing.sm }}>
              Voce foi indicado por um amigo!
            </ThemedText>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Como Funciona
          </ThemedText>
          {[
            { step: '1', text: 'Compartilhe seu codigo com amigos' },
            { step: '2', text: 'Seu amigo se cadastra e aplica o codigo' },
            { step: '3', text: `Voces dois ganham ${REFERRAL_XP_REWARD} XP cada!` },
          ].map((item, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {item.step}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
                {item.text}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  codeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  input: {
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
