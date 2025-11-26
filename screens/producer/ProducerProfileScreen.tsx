import React from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SocialLinksDisplay, CommunityWhatsAppButton } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

export default function ProducerProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: 'file-text', label: 'Nota Fiscal Eletronica', onPress: () => navigation.navigate('NFSe'), highlight: true },
    { icon: 'clipboard', label: 'Modelo de Contrato', onPress: () => navigation.navigate('ContractTemplate', {}), color: colors.secondary },
    { icon: 'map-pin', label: 'Gerenciar Propriedades', onPress: () => navigation.navigate('ProducerProperties') },
    { icon: 'book-open', label: 'Capacitacao', onPress: () => navigation.navigate('Education'), color: colors.primary },
    { icon: 'share-2', label: 'Redes Sociais', onPress: () => navigation.navigate('SocialLinks'), color: '#25D366' },
    { icon: 'edit-3', label: 'Editar Perfil', onPress: () => {} },
    { icon: 'bell', label: 'Notificacoes', onPress: () => {} },
    { icon: 'help-circle', label: 'Ajuda', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing['2xl'] },
        ]}
      >
        <View style={styles.profileHeader}>
          <Image
            source={require('@/assets/avatars/producer.png')}
            style={styles.avatar}
            contentFit="cover"
          />
          <ThemedText type="h2" style={styles.name}>
            {user?.name}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="user" size={14} color={colors.primary} />
            <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
              Produtor
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            {user?.email}
          </ThemedText>

          <View style={styles.socialLinksContainer}>
            <SocialLinksDisplay socialLinks={user?.socialLinks} size="medium" />
          </View>
        </View>

        <View style={styles.communityContainer}>
          <CommunityWhatsAppButton />
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
                Shadows.card,
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Feather name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <ThemedText type="body" style={{ flex: 1 }}>
                {item.label}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: colors.error + '10', opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={colors.error} />
          <ThemedText type="body" style={{ color: colors.error, fontWeight: '600' }}>
            Sair da Conta
          </ThemedText>
        </Pressable>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  socialLinksContainer: {
    marginTop: Spacing.lg,
  },
  communityContainer: {
    marginBottom: Spacing['2xl'],
  },
  menuContainer: {
    gap: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing['2xl'],
  },
});
