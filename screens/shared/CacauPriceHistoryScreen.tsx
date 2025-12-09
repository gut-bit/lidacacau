import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, ActivityIndicator, Linking, Share, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import { cacauParaClient, PriceSubmission, PriceMetrics, SUPPORTED_CITIES } from '@/services/sdk/CacauParaSDK';

type TabType = 'trends' | 'history' | 'my';

export default function CacauPriceHistoryScreen() {
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [metrics, setMetrics] = useState<PriceMetrics | null>(null);
  const [mySubmissions, setMySubmissions] = useState<PriceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [metricsData, submissions] = await Promise.all([
        cacauParaClient.getMetrics(),
        user ? cacauParaClient.getMySubmissions() : Promise.resolve([]),
      ]);

      setMetrics(metricsData);
      setMySubmissions(submissions);
    } catch (error) {
      console.error('[CacauPriceHistory] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleShare = async (price: PriceSubmission) => {
    const message = `Preco do Cacau em ${price.city}: R$ ${price.pricePerKg}/kg - ${price.buyerName}\n\nVia LidaCacau`;
    
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

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.backgroundRoot }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando historico...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tab,
              { 
                backgroundColor: activeTab === 'trends' ? colors.primary : colors.card,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setActiveTab('trends')}
          >
            <Feather 
              name="trending-up" 
              size={16} 
              color={activeTab === 'trends' ? '#FFFFFF' : colors.text} 
            />
            <ThemedText style={{ 
              color: activeTab === 'trends' ? '#FFFFFF' : colors.text,
              fontWeight: '600',
              fontSize: 14,
            }}>
              Tendencias
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              { 
                backgroundColor: activeTab === 'history' ? colors.primary : colors.card,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Feather 
              name="clock" 
              size={16} 
              color={activeTab === 'history' ? '#FFFFFF' : colors.text} 
            />
            <ThemedText style={{ 
              color: activeTab === 'history' ? '#FFFFFF' : colors.text,
              fontWeight: '600',
              fontSize: 14,
            }}>
              Historico
            </ThemedText>
          </Pressable>

          {user ? (
            <Pressable
              style={[
                styles.tab,
                { 
                  backgroundColor: activeTab === 'my' ? colors.primary : colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setActiveTab('my')}
            >
              <Feather 
                name="user" 
                size={16} 
                color={activeTab === 'my' ? '#FFFFFF' : colors.text} 
              />
              <ThemedText style={{ 
                color: activeTab === 'my' ? '#FFFFFF' : colors.text,
                fontWeight: '600',
                fontSize: 14,
              }}>
                Meus
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {activeTab === 'trends' ? (
          <View style={styles.trendsSection}>
            {metrics?.bestPrice ? (
              <View style={[styles.bestPriceCard, { backgroundColor: '#7ED957' }]}>
                <View style={styles.bestPriceHeader}>
                  <Feather name="award" size={24} color="#FFFFFF" />
                  <ThemedText style={styles.bestPriceLabel}>Melhor Preco - 7 dias</ThemedText>
                </View>
                <ThemedText style={styles.bestPriceValue}>
                  R$ {parseFloat(metrics.bestPrice.pricePerKg).toFixed(2)}/kg
                </ThemedText>
                <ThemedText style={styles.bestPriceLocation}>
                  {metrics.bestPrice.buyerName} - {metrics.bestPrice.city}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Media por Cidade - 30 dias
            </ThemedText>

            {metrics?.thirtyDays && metrics.thirtyDays.length > 0 ? (
              <View style={styles.metricsGrid}>
                {metrics.thirtyDays.map((metric) => (
                  <View 
                    key={metric.city} 
                    style={[styles.metricCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.metricHeader}>
                      <Feather name="map-pin" size={14} color={colors.primary} />
                      <ThemedText style={[styles.metricCity, { color: colors.text }]}>
                        {metric.city}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.metricPrice, { color: colors.success }]}>
                      R$ {parseFloat(metric.avgPrice).toFixed(2)}
                    </ThemedText>
                    <View style={styles.metricRange}>
                      {metric.minPrice && metric.maxPrice ? (
                        <ThemedText style={[styles.metricRangeText, { color: colors.textSecondary }]}>
                          Min: R$ {parseFloat(metric.minPrice).toFixed(2)} | Max: R$ {parseFloat(metric.maxPrice).toFixed(2)}
                        </ThemedText>
                      ) : null}
                    </View>
                    {metric.count ? (
                      <ThemedText style={[styles.metricCount, { color: colors.textSecondary }]}>
                        {metric.count} registros
                      </ThemedText>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Feather name="bar-chart-2" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                  Sem dados suficientes
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Envie precos para gerar estatisticas da regiao.
                </ThemedText>
              </View>
            )}

            <ThemedText style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
              Media por Cidade - 7 dias
            </ThemedText>

            {metrics?.sevenDays && metrics.sevenDays.length > 0 ? (
              <View style={styles.recentList}>
                {metrics.sevenDays.map((metric) => (
                  <View 
                    key={metric.city} 
                    style={[styles.recentItem, { borderBottomColor: colors.border }]}
                  >
                    <ThemedText style={[styles.recentCity, { color: colors.text }]}>
                      {metric.city}
                    </ThemedText>
                    <ThemedText style={[styles.recentPrice, { color: colors.success }]}>
                      R$ {parseFloat(metric.avgPrice).toFixed(2)}/kg
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptySmall, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.emptySmallText, { color: colors.textSecondary }]}>
                  Nenhum registro nos ultimos 7 dias
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'history' ? (
          <View style={styles.historySection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Cidades Monitoradas
            </ThemedText>
            <View style={styles.citiesList}>
              {SUPPORTED_CITIES.map((cityName) => (
                <View 
                  key={cityName} 
                  style={[styles.cityItem, { backgroundColor: colors.card }]}
                >
                  <View style={styles.cityItemLeft}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                    <ThemedText style={[styles.cityItemName, { color: colors.text }]}>
                      {cityName}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
              ))}
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Feather name="info" size={18} color={colors.textSecondary} />
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                Os precos sao informados pela comunidade e podem variar conforme qualidade, quantidade e forma de pagamento.
              </ThemedText>
            </View>
          </View>
        ) : null}

        {activeTab === 'my' && user ? (
          <View style={styles.mySection}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Seus Envios ({mySubmissions.length})
            </ThemedText>

            {mySubmissions.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                <Feather name="send" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                  Nenhum envio ainda
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Voce ainda nao enviou nenhum preco. Contribua com a comunidade!
                </ThemedText>
              </View>
            ) : (
              <View style={styles.submissionsList}>
                {mySubmissions.map((submission) => (
                  <View 
                    key={submission.id} 
                    style={[styles.submissionCard, { backgroundColor: colors.card }]}
                  >
                    <View style={styles.submissionHeader}>
                      <View>
                        <ThemedText style={[styles.submissionBuyer, { color: colors.text }]}>
                          {submission.buyerName}
                        </ThemedText>
                        <View style={styles.submissionLocation}>
                          <Feather name="map-pin" size={12} color={colors.textSecondary} />
                          <ThemedText style={[styles.submissionCity, { color: colors.textSecondary }]}>
                            {submission.city}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.submissionRight}>
                        <ThemedText style={[styles.submissionPrice, { color: colors.success }]}>
                          R$ {parseFloat(submission.pricePerKg).toFixed(2)}
                        </ThemedText>
                        <View style={[
                          styles.statusBadge, 
                          { backgroundColor: submission.status === 'approved' ? colors.success + '20' : colors.warning + '20' }
                        ]}>
                          <ThemedText style={[
                            styles.statusText, 
                            { color: submission.status === 'approved' ? colors.success : colors.warning }
                          ]}>
                            {submission.status === 'approved' ? 'Aprovado' : 'Pendente'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    
                    <View style={[styles.submissionFooter, { borderTopColor: colors.border }]}>
                      <ThemedText style={[styles.submissionDate, { color: colors.textSecondary }]}>
                        {formatDate(submission.createdAt)}
                      </ThemedText>
                      <Pressable 
                        style={styles.shareButton}
                        onPress={() => handleShare(submission)}
                      >
                        <Feather name="share-2" size={16} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  trendsSection: {
    paddingHorizontal: Spacing.lg,
  },
  bestPriceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    gap: Spacing.sm,
  },
  metricCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  metricCity: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricPrice: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricRange: {
    marginBottom: 4,
  },
  metricRangeText: {
    fontSize: 12,
  },
  metricCount: {
    fontSize: 11,
  },
  recentList: {
    gap: 0,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  recentCity: {
    fontSize: 15,
    fontWeight: '500',
  },
  recentPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
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
  emptySmall: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptySmallText: {
    fontSize: 13,
  },
  historySection: {
    paddingHorizontal: Spacing.lg,
  },
  citiesList: {
    gap: Spacing.sm,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cityItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
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
  mySection: {
    paddingHorizontal: Spacing.lg,
  },
  submissionsList: {
    gap: Spacing.sm,
  },
  submissionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  submissionBuyer: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  submissionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submissionCity: {
    fontSize: 13,
  },
  submissionRight: {
    alignItems: 'flex-end',
  },
  submissionPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  submissionDate: {
    fontSize: 12,
  },
  shareButton: {
    padding: 4,
  },
});
