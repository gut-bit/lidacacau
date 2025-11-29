import React from 'react';
import { StyleSheet, View, Linking, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function CacauPricesScreen() {
  const { theme: colors } = useTheme();

  const handleLearnMore = () => {
    Linking.openURL('https://www.icco.org/');
  };

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={[styles.heroCard, { backgroundColor: '#8B4513' }]}>
          <View style={styles.iconContainer}>
            <Feather name="tool" size={48} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.heroTitle}>
            Cotacao do Cacau
          </ThemedText>
          <View style={styles.constructionBadge}>
            <Feather name="clock" size={16} color="#FFFFFF" />
            <ThemedText style={styles.constructionBadgeText}>
              Funcionalidade em Construcao
            </ThemedText>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Feather name="info" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText style={[styles.infoTitle, { color: colors.text }]}>
              O que estamos construindo
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
              Estamos desenvolvendo uma integracao com fontes de dados de precos de cacau em tempo real. 
              Em breve voce podera acompanhar:
            </ThemedText>
          </View>
        </View>

        <View style={styles.featuresList}>
          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="trending-up" size={20} color={colors.success} />
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                Preco Internacional
              </ThemedText>
              <ThemedText style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Cotacao da Bolsa de Nova York (ICE Futures)
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="bar-chart-2" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                Historico de Precos
              </ThemedText>
              <ThemedText style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Grafico com evolucao dos precos ao longo do tempo
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.warning + '20' }]}>
              <Feather name="map-pin" size={20} color={colors.warning || '#F5A623'} />
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                Cotacoes Locais
              </ThemedText>
              <ThemedText style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Precos praticados por compradores da regiao do Para
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIcon, { backgroundColor: '#8B4513' + '20' }]}>
              <Feather name="dollar-sign" size={20} color="#8B4513" />
            </View>
            <View style={styles.featureContent}>
              <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
                Conversao Automatica
              </ThemedText>
              <ThemedText style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Precos em Real (BRL) e Dolar (USD) atualizados
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.noticeCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="bell" size={20} color={colors.text} />
          <ThemedText style={[styles.noticeText, { color: colors.textSecondary }]}>
            Voce sera notificado quando esta funcionalidade estiver disponivel.
          </ThemedText>
        </View>

        <Pressable 
          style={[styles.learnMoreButton, { borderColor: colors.border }]}
          onPress={handleLearnMore}
        >
          <Feather name="external-link" size={18} color={colors.primary} />
          <ThemedText style={[styles.learnMoreText, { color: colors.primary }]}>
            Saiba mais sobre precos de cacau (ICCO)
          </ThemedText>
        </Pressable>

        <View style={{ height: Spacing['3xl'] }} />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  constructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  constructionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
