import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { 
  fetchCocoaPrices, 
  CocoaPriceData, 
  formatPriceUSD, 
  formatPriceBRL,
  getRelativeUpdateTime,
} from '@/utils/cocoaPriceService';

interface PriceTickerProps {
  compact?: boolean;
  showLocalQuotes?: boolean;
}

export function PriceTicker({ 
  compact = false,
  showLocalQuotes = false,
}: PriceTickerProps) {
  const { theme: colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [priceData, setPriceData] = useState<CocoaPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCocoaPrices(forceRefresh);
      setPriceData(data);
    } catch (err) {
      setError('Erro ao carregar precos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    
    const interval = setInterval(() => {
      loadPrices();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadPrices]);

  const handlePress = () => {
    navigation.navigate('CacauPrices');
  };

  const handleRefresh = () => {
    loadPrices(true);
  };

  if (loading && !priceData) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando precos...</ThemedText>
      </View>
    );
  }

  if (error && !priceData) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.card }]}>
        <Feather name="alert-circle" size={20} color={colors.error} />
        <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
        <Pressable onPress={handleRefresh} style={styles.retryButton}>
          <ThemedText style={[styles.retryText, { color: colors.primary }]}>Tentar novamente</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!priceData) return null;

  const { global, isStale } = priceData;
  const isPositive = global.changePercent >= 0;
  const changeColorValue = isPositive ? colors.success : colors.error;

  if (compact) {
    return (
      <Pressable onPress={handlePress}>
        <View style={[styles.compactContainer, { backgroundColor: colors.card }]}>
          <View style={styles.compactLeft}>
            <View style={[styles.cacaoIcon, { backgroundColor: '#8B4513' }]}>
              <ThemedText style={styles.cacaoIconText}>C</ThemedText>
            </View>
            <View>
              <ThemedText style={styles.compactLabel}>Cacau NY</ThemedText>
              <ThemedText style={[styles.compactPrice, { color: colors.text }]}>
                {formatPriceUSD(global.priceUSD)}/t
              </ThemedText>
              <ThemedText style={[styles.compactDisclaimer, { color: colors.warning || '#F5A623' }]}>
                Precos ilustrativos
              </ThemedText>
            </View>
          </View>
          <View style={styles.compactRight}>
            <View style={[
              styles.changeBadge, 
              { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Feather 
                name={isPositive ? 'trending-up' : 'trending-down'} 
                size={14} 
                color={changeColorValue} 
              />
              <ThemedText style={[styles.changeText, { color: changeColorValue }]}>
                {isPositive ? '+' : ''}{global.changePercent.toFixed(2)}%
              </ThemedText>
            </View>
            {isStale ? (
              <ThemedText style={[styles.staleText, { color: colors.textSecondary }]}>
                Dados antigos
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.cacaoIconLarge, { backgroundColor: '#8B4513' }]}>
              <Feather name="coffee" size={20} color="#FFFFFF" />
            </View>
            <View>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Preco do Cacau
              </ThemedText>
              <ThemedText style={[styles.source, { color: colors.textSecondary }]}>
                {global.source}
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={handleRefresh} hitSlop={8}>
            <Feather 
              name="refresh-cw" 
              size={18} 
              color={loading ? colors.textSecondary : colors.primary} 
            />
          </Pressable>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceMain}>
            <ThemedText style={[styles.priceUSD, { color: colors.text }]}>
              {formatPriceUSD(global.priceUSD)}
            </ThemedText>
            <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>
              /tonelada
            </ThemedText>
          </View>
          <View style={[
            styles.changeBadgeLarge, 
            { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Feather 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={18} 
              color={changeColorValue} 
            />
            <ThemedText style={[styles.changeTextLarge, { color: changeColorValue }]}>
              {isPositive ? '+' : ''}{global.changePercent.toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.priceBRLRow}>
          <ThemedText style={[styles.priceBRL, { color: colors.textSecondary }]}>
            {formatPriceBRL(global.priceBRL)} (BRL)
          </ThemedText>
          <ThemedText style={[styles.updateTime, { color: colors.textSecondary }]}>
            {isStale ? 'Dados antigos - ' : ''}
            Atualizado {getRelativeUpdateTime(global.lastUpdated)}
          </ThemedText>
        </View>

        <View style={[styles.disclaimerRow, { borderTopColor: colors.border }]}>
          <Feather name="alert-circle" size={12} color={colors.warning || '#F5A623'} />
          <ThemedText style={[styles.disclaimerText, { color: colors.warning || '#F5A623' }]}>
            Obs: Tecnologia em construcao, precos ilustrativos.
          </ThemedText>
        </View>

        {showLocalQuotes && priceData.localQuotes.length > 0 ? (
          <View style={[styles.localQuotesSection, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.localQuotesTitle, { color: colors.text }]}>
              Cotacoes Locais (PA)
            </ThemedText>
            <View style={styles.localQuotesList}>
              {priceData.localQuotes.slice(0, 2).map((quote) => (
                <View key={quote.id} style={[styles.localQuoteItem, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.localQuoteLeft}>
                    <ThemedText style={[styles.localQuoteBuyer, { color: colors.text }]}>
                      {quote.buyerName}
                    </ThemedText>
                    <ThemedText style={[styles.localQuoteRegion, { color: colors.textSecondary }]}>
                      {quote.region}
                    </ThemedText>
                  </View>
                  <View style={styles.localQuoteRight}>
                    <ThemedText style={[styles.localQuotePrice, { color: colors.text }]}>
                      R$ {quote.pricePerKg.toFixed(2)}/kg
                    </ThemedText>
                    <ThemedText style={[
                      styles.localQuotePremium, 
                      { color: quote.premiumDiscount >= 0 ? colors.success : colors.error }
                    ]}>
                      {quote.premiumDiscount >= 0 ? '+' : ''}{quote.premiumDiscount.toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
            <ThemedText style={[styles.viewAllLink, { color: colors.primary }]}>
              Ver todas as cotacoes
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  retryButton: {
    marginTop: Spacing.sm,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cacaoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacaoIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  compactLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  compactPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  compactDisclaimer: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 2,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  staleText: {
    fontSize: 10,
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cacaoIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  source: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceUSD: {
    fontSize: 28,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  changeBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  changeTextLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceBRLRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  priceBRL: {
    fontSize: 14,
  },
  updateTime: {
    fontSize: 11,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  disclaimerText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  localQuotesSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  localQuotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  localQuotesList: {
    gap: Spacing.sm,
  },
  localQuoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  localQuoteLeft: {
    flex: 1,
  },
  localQuoteBuyer: {
    fontSize: 13,
    fontWeight: '500',
  },
  localQuoteRegion: {
    fontSize: 11,
  },
  localQuoteRight: {
    alignItems: 'flex-end',
  },
  localQuotePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  localQuotePremium: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
