import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, ActivityIndicator, Linking, Share, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { cacauParaClient, PriceSubmission, SUPPORTED_CITIES } from '@/services/sdk/CacauParaSDK';

const CACHE_KEY = '@lidacacau_cacau_prices_cache';
const CACHE_TIMESTAMP_KEY = '@lidacacau_cacau_prices_timestamp';

type FilterCity = 'all' | typeof SUPPORTED_CITIES[number];

export default function CacauPricesScreen() {
  const { theme: colors } = useTheme();
  const [prices, setPrices] = useState<PriceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<FilterCity>('all');
  const [bestPrice, setBestPrice] = useState<PriceSubmission | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadCachedPrices = async (): Promise<PriceSubmission[]> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cached) {
        const data = JSON.parse(cached) as PriceSubmission[];
        if (timestamp) {
          const date = new Date(timestamp);
          setLastUpdated(date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
        return data;
      }
    } catch (err) {
      console.error('[CacauPrices] Cache load error:', err);
    }
    return [];
  };

  const savePricesToCache = async (data: PriceSubmission[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
      setLastUpdated(new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('[CacauPrices] Cache save error:', err);
    }
  };

  const fetchPrices = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await cacauParaClient.listPrices();
      setPrices(data);
      setBestPrice(cacauParaClient.findBestPrice(data));
      setIsFromCache(false);
      setError(null);
      await savePricesToCache(data);
    } catch (err) {
      console.error('[CacauPrices] API Error:', err);
      
      const cachedData = await loadCachedPrices();
      if (cachedData.length > 0) {
        setPrices(cachedData);
        setBestPrice(cacauParaClient.findBestPrice(cachedData));
        setIsFromCache(true);
        setError('Mostrando precos salvos. Puxe para atualizar.');
      } else {
        setError('Nao foi possivel carregar os precos. Verifique sua conexao e tente novamente.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      const cached = await loadCachedPrices();
      if (cached.length > 0) {
        setPrices(cached);
        setBestPrice(cacauParaClient.findBestPrice(cached));
        setIsFromCache(true);
        setLoading(false);
        fetchPrices();
      } else {
        fetchPrices();
      }
    };
    initData();
  }, [fetchPrices]);

  const filteredPrices = selectedCity === 'all' 
    ? prices 
    : cacauParaClient.filterByCity(prices, selectedCity);

  const handleShare = async (price: PriceSubmission) => {
    const message = `Preco do Cacau em ${price.city}: R$ ${price.pricePerKg}/kg - ${price.buyerName}\n\nVia Cacau Para`;
    
    if (Platform.OS === 'web') {
      const whatsappUrl = cacauParaClient.generateWhatsAppShareLink(price);
      Linking.openURL(whatsappUrl);
    } else {
      try {
        await Share.share({ message });
      } catch (err) {
        console.error('Share error:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `Ha ${diffHours}h`;
    if (diffDays < 7) return `Ha ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading && prices.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.backgroundRoot }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando precos...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchPrices(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.container}>
        {isFromCache && lastUpdated ? (
          <View style={[styles.cacheNotice, { backgroundColor: colors.warning + '20' }]}>
            <Feather name="clock" size={16} color={colors.warning || '#F5A623'} />
            <ThemedText style={[styles.cacheNoticeText, { color: colors.text }]}>
              Dados salvos de {lastUpdated}
            </ThemedText>
            <Pressable onPress={() => fetchPrices(true)}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        {bestPrice ? (
          <View style={[styles.bestPriceCard, { backgroundColor: '#7ED957' }]}>
            <View style={styles.bestPriceHeader}>
              <Feather name="award" size={24} color="#FFFFFF" />
              <ThemedText style={styles.bestPriceLabel}>Melhor Preco</ThemedText>
            </View>
            <ThemedText style={styles.bestPriceValue}>
              R$ {parseFloat(bestPrice.pricePerKg).toFixed(2)}/kg
            </ThemedText>
            <ThemedText style={styles.bestPriceLocation}>
              {bestPrice.buyerName} - {bestPrice.city}
            </ThemedText>
          </View>
        ) : null}

        {error && prices.length === 0 ? (
          <View style={[styles.errorCard, { backgroundColor: colors.error + '20' }]}>
            <Feather name="wifi-off" size={48} color={colors.error} />
            <ThemedText style={[styles.errorTitle, { color: colors.error }]}>
              Sem conexao
            </ThemedText>
            <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </ThemedText>
            <Pressable 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => fetchPrices()}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              <ThemedText style={styles.retryButtonText}>Tentar novamente</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.externalLinkSmall, { borderColor: colors.border }]}
              onPress={() => Linking.openURL('https://cacaupara.replit.app')}
            >
              <Feather name="external-link" size={14} color={colors.primary} />
              <ThemedText style={[styles.externalLinkSmallText, { color: colors.primary }]}>
                Abrir no navegador
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {prices.length > 0 ? (
          <>
            <View style={styles.filterSection}>
              <ThemedText style={[styles.filterLabel, { color: colors.text }]}>
                Filtrar por cidade:
              </ThemedText>
              <View style={styles.filterChips}>
                <Pressable
                  style={[
                    styles.filterChip,
                    { 
                      backgroundColor: selectedCity === 'all' ? colors.primary : colors.card,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedCity('all')}
                >
                  <ThemedText style={{ 
                    color: selectedCity === 'all' ? '#FFFFFF' : colors.text,
                    fontWeight: '500',
                    fontSize: 13,
                  }}>
                    Todas
                  </ThemedText>
                </Pressable>
                {SUPPORTED_CITIES.map((city) => (
                  <Pressable
                    key={city}
                    style={[
                      styles.filterChip,
                      { 
                        backgroundColor: selectedCity === city ? colors.primary : colors.card,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <ThemedText style={{ 
                      color: selectedCity === city ? '#FFFFFF' : colors.text,
                      fontWeight: '500',
                      fontSize: 13,
                    }}>
                      {city}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.pricesHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Precos Atuais ({filteredPrices.length})
              </ThemedText>
              <Pressable onPress={() => fetchPrices(true)}>
                <Feather name="refresh-cw" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {filteredPrices.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Feather name="inbox" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                  Nenhum preco para esta cidade
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nao ha precos registrados para {selectedCity}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.pricesList}>
                {filteredPrices.map((price) => (
                  <View 
                    key={price.id} 
                    style={[styles.priceCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.priceCardHeader}>
                      <View style={styles.priceCardLeft}>
                        <View style={[styles.buyerIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Feather name="shopping-bag" size={18} color={colors.primary} />
                        </View>
                        <View>
                          <ThemedText style={[styles.buyerName, { color: colors.text }]}>
                            {price.buyerName}
                          </ThemedText>
                          <View style={styles.locationRow}>
                            <Feather name="map-pin" size={12} color={colors.textSecondary} />
                            <ThemedText style={[styles.cityText, { color: colors.textSecondary }]}>
                              {price.city}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <View style={styles.priceCardRight}>
                        <ThemedText style={[styles.priceValue, { color: colors.success }]}>
                          R$ {parseFloat(price.pricePerKg).toFixed(2)}
                        </ThemedText>
                        <ThemedText style={[styles.priceUnit, { color: colors.textSecondary }]}>
                          por kg
                        </ThemedText>
                      </View>
                    </View>
                    
                    {price.conditions ? (
                      <View style={[styles.conditionsRow, { borderTopColor: colors.border }]}>
                        <Feather name="info" size={14} color={colors.textSecondary} />
                        <ThemedText style={[styles.conditionsText, { color: colors.textSecondary }]}>
                          {price.conditions}
                        </ThemedText>
                      </View>
                    ) : null}

                    <View style={[styles.priceCardFooter, { borderTopColor: colors.border }]}>
                      <ThemedText style={[styles.timeAgo, { color: colors.textSecondary }]}>
                        {formatDate(price.createdAt)}
                      </ThemedText>
                      <Pressable 
                        style={styles.shareButton}
                        onPress={() => handleShare(price)}
                      >
                        <Feather name="share-2" size={16} color={colors.primary} />
                        <ThemedText style={[styles.shareText, { color: colors.primary }]}>
                          Compartilhar
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="info" size={18} color={colors.textSecondary} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            Precos informados pela comunidade na regiao do Para. Os valores podem variar conforme qualidade e quantidade.
          </ThemedText>
        </View>

        <Pressable 
          style={[styles.externalLink, { borderColor: colors.border }]}
          onPress={() => Linking.openURL('https://cacaupara.replit.app')}
        >
          <Feather name="external-link" size={18} color={colors.primary} />
          <ThemedText style={[styles.externalLinkText, { color: colors.primary }]}>
            Abrir Cacau Para completo
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  cacheNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  cacheNoticeText: {
    flex: 1,
    fontSize: 13,
  },
  bestPriceCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  bestPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  bestPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bestPriceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bestPriceLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  errorCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  externalLinkSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  externalLinkSmallText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pricesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  pricesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  priceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  priceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  buyerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontSize: 13,
  },
  priceCardRight: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 12,
  },
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  conditionsText: {
    fontSize: 13,
    flex: 1,
  },
  priceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  timeAgo: {
    fontSize: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  externalLink: {
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
  externalLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
