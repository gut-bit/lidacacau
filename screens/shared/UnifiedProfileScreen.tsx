import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getLevelLabel } from '@/utils/format';

interface ProfileActionProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
  showArrow?: boolean;
  value?: string;
}

function ProfileAction({ icon, title, subtitle, color, onPress, showArrow = true, value }: ProfileActionProps) {
  const { theme: colors } = useTheme();
  
  return (
    <Pressable
      style={[styles.actionItem, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <ThemedText type="body" style={{ fontWeight: '500' }}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: colors.textSecondary }}>{subtitle}</ThemedText>
        ) : null}
      </View>
      {value ? (
        <ThemedText type="body" style={{ color: colors.textSecondary }}>{value}</ThemedText>
      ) : showArrow ? (
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function UnifiedProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const [darkMode, setDarkMode] = useState(isDark);
  const { user, activeRole, logout, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const isWorker = activeRole === 'worker';
  const levelColor = user?.level ? LevelColors[`N${user.level}` as keyof typeof LevelColors] : colors.primary;

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateProfile({ avatar: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const profileCompletion = user?.profileCompletion?.percentage || 0;

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing['2xl'] }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <ThemedText type="h2">Meu Perfil</ThemedText>
        </View>

        <View style={styles.profileCard}>
          <Pressable style={styles.avatarSection} onPress={handlePickAvatar}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <ThemedText type="h1" style={{ color: '#FFFFFF' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </ThemedText>
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.link }]}>
                <Feather name="camera" size={14} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <ThemedText type="h2">{user?.name}</ThemedText>
              {user?.verification?.status === 'approved' ? (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              {user?.email}
            </ThemedText>
            
            <View style={styles.badges}>
              {isWorker && user?.level ? (
                <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                  <Feather name="award" size={14} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {getLevelLabel(user.level)}
                  </ThemedText>
                </View>
              ) : null}
              <View style={[styles.roleBadge, { backgroundColor: isWorker ? colors.secondary + '20' : colors.primary + '20' }]}>
                <Feather 
                  name={isWorker ? 'tool' : 'briefcase'} 
                  size={14} 
                  color={isWorker ? colors.secondary : colors.primary} 
                />
                <ThemedText 
                  type="small" 
                  style={{ color: isWorker ? colors.secondary : colors.primary, fontWeight: '600' }}
                >
                  {isWorker ? 'Trabalhador' : 'Produtor'}
                </ThemedText>
              </View>
            </View>
          </View>

          {profileCompletion < 100 ? (
            <View style={styles.completionSection}>
              <View style={styles.completionHeader}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Complete seu perfil
                </ThemedText>
                <ThemedText type="body" style={{ color: colors.primary, fontWeight: '700' }}>
                  {profileCompletion}%
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${profileCompletion}%`, backgroundColor: colors.primary }
                  ]} 
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="star" size={24} color={colors.accent} />
            <ThemedText type="h3" style={{ marginTop: 4 }}>
              {user?.averageRating?.toFixed(1) || '5.0'}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Avaliacao
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="check-circle" size={24} color={colors.success} />
            <ThemedText type="h3" style={{ marginTop: 4 }}>
              {user?.totalReviews || 0}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Servicos
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="zap" size={24} color={colors.primary} />
            <ThemedText type="h3" style={{ marginTop: 4 }}>
              {user?.referral?.totalXpEarned || 0}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              XP
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Comunidade</ThemedText>
          <View style={styles.actionList}>
            <ProfileAction
              icon="users"
              title="Amigos do Campo"
              subtitle="Conecte-se com a comunidade"
              color={colors.handshake}
              onPress={() => navigation.navigate('Friends')}
            />
            <ProfileAction
              icon="message-circle"
              title="Mensagens"
              subtitle="Conversas com amigos"
              color={colors.link}
              onPress={() => navigation.navigate('ChatList')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Conta</ThemedText>
          <View style={styles.actionList}>
            <ProfileAction
              icon="user"
              title="Editar Perfil"
              subtitle="Conte sua historia, fotos, certificados"
              color={colors.primary}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <ProfileAction
              icon="shield"
              title="Verificacao de Identidade"
              subtitle={user?.verification?.status === 'approved' ? 'Verificado' : 'Verificar agora'}
              color={colors.success}
              onPress={() => navigation.navigate('IdentityVerification')}
            />
            <ProfileAction
              icon="share-2"
              title="Redes Sociais"
              subtitle="WhatsApp, Instagram, Facebook"
              color={colors.link}
              onPress={() => navigation.navigate('SocialLinks')}
            />
            {isWorker ? (
              <ProfileAction
                icon="image"
                title="Portfolio"
                subtitle="Mostre seu trabalho"
                color="#8B5CF6"
                onPress={() => navigation.navigate('Portfolio')}
              />
            ) : (
              <ProfileAction
                icon="map-pin"
                title="Minhas Propriedades"
                subtitle="Gerenciar propriedades"
                color={colors.primary}
                onPress={() => navigation.navigate('PropertyList')}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Financeiro</ThemedText>
          <View style={styles.actionList}>
            <ProfileAction
              icon="dollar-sign"
              title="Configurar Chave PIX"
              subtitle="Para receber pagamentos"
              color={colors.accent}
              onPress={() => navigation.navigate('PixSettings')}
            />
            <ProfileAction
              icon="credit-card"
              title="Historico de Pagamentos"
              subtitle="Transacoes e recibos"
              color="#6366F1"
              onPress={() => navigation.navigate('PaymentHistory')}
            />
            <ProfileAction
              icon="file-text"
              title="Nota Fiscal (NFS-e)"
              subtitle="Emitir nota fiscal"
              color={colors.primary}
              onPress={() => navigation.navigate('NFSe')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Configuracoes</ThemedText>
          <View style={styles.actionList}>
            <Pressable
              style={[styles.actionItem, { backgroundColor: colors.card }]}
              onPress={() => setDarkMode(!darkMode)}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? '#FFB80020' : '#6B728020' }]}>
                <Feather name={isDark ? 'sun' : 'moon'} size={20} color={isDark ? '#FFB800' : '#6B7280'} />
              </View>
              <View style={styles.actionContent}>
                <ThemedText type="body" style={{ fontWeight: '500' }}>Tema</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {isDark ? 'Modo escuro' : 'Modo claro'}
                </ThemedText>
              </View>
              <View style={[styles.themeToggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
                <View style={[styles.themeToggleDot, { 
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: isDark ? 18 : 0 }]
                }]} />
              </View>
            </Pressable>
            <ProfileAction
              icon="help-circle"
              title="Ajuda e Suporte"
              subtitle="FAQ e contato"
              color="#6B7280"
              onPress={() => navigation.navigate('FAQSupport')}
            />
          </View>
        </View>

        <Pressable
          style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.error} />
          <ThemedText type="body" style={{ color: colors.error, fontWeight: '600' }}>
            Sair da conta
          </ThemedText>
        </Pressable>

        <ThemedText type="small" style={[styles.version, { color: colors.textSecondary }]}>
          LidaCacau v1.0.0
        </ThemedText>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  profileCard: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  completionSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  actionList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  themeToggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  themeToggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
});
