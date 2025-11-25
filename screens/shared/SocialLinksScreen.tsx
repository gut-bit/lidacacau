import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedView } from '@/components/ThemedView';
import { SocialLinksEditor, CommunityWhatsAppButton } from '@/components/SocialLinks';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing } from '@/constants/theme';
import { updateUser } from '@/utils/storage';
import { SocialLinks } from '@/types';

export default function SocialLinksScreen() {
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleSaveSocialLinks = async (links: SocialLinks) => {
    if (!user) return;
    
    try {
      await updateUser(user.id, { socialLinks: links });
      await refreshUser();
      Alert.alert('Sucesso', 'Suas redes sociais foram atualizadas');
    } catch (error) {
      console.error('Error saving social links:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar suas redes sociais');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <SocialLinksEditor
          socialLinks={user?.socialLinks}
          onSave={handleSaveSocialLinks}
        />

        <View style={styles.communitySection}>
          <CommunityWhatsAppButton />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  communitySection: {
    marginTop: Spacing['2xl'],
  },
});
