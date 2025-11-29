import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import {
  fetchCocoaPrices,
  CocoaPriceData,
  LocalQuote,
  formatPriceUSD,
  formatPriceBRL,
  formatPricePerKg,
  formatPremiumDiscount,
  getQualityGradeLabel,
  getBuyerTypeLabel,
  getRelativeUpdateTime,
} from '@/utils/cocoaPriceService';
import Svg, { Path, Line, Circle, Text as SvgText, G, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.lg * 2;
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 50 };

export default function CacauPricesScreen() {
  const { theme: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [priceData, setPriceData] = useState<CocoaPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'BRL'>('BRL');

  const loadPrices = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await fetchCocoaPrices(forceRefresh);
      setPriceData(data);
    } catch (error) {
      console.error('Error loading prices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const onRefresh = () => loadPrices(true);

  const renderChart = () => {
    if (!priceData || priceData.historicalPrices.length < 2) return null;

    const prices = priceData.historicalPrices;
    const values = prices.map(p => selectedCurrency === 'USD' ? p.priceUSD : p.priceBRL);
    const minValue = Math.min(...values) * 0.98;
    const maxValue = Math.max(...values) * 1.02;
    const valueRange = maxValue - minValue;

    const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    const getX = (index: number) => 
      CHART_PADDING.left + (index / (prices.length - 1)) * chartInnerWidth;
    
    const getY = (value: number) => 
      CHART_PADDING.top + chartInnerHeight - ((value - minValue) / valueRange) * chartInnerHeight;

    const pathData = prices
      .map((p, i) => {
        const x = getX(i);
        const y = getY(selectedCurrency === 'USD' ? p.priceUSD : p.priceBRL);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const areaPath = `${pathData} L ${getX(prices.length - 1)} ${CHART_HEIGHT - CHART_PADDING.bottom} L ${getX(0)} ${CHART_HEIGHT - CHART_PADDING.bottom} Z`;

    const formatAxisValue = (value: number) => {
      if (selectedCurrency === 'USD') {
        return `$${(value / 1000).toFixed(1)}k`;
      }
      return `R$${(value / 1000).toFixed(0)}k`;
    };

    const yAxisValues = [minValue, (minValue + maxValue) / 2, maxValue];

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
            Historico de Precos (7 dias)
          </ThemedText>
          <View style={styles.currencyToggle}>
            <Pressable
              onPress={() => setSelectedCurrency('BRL')}
              style={[
                styles.currencyButton,
                selectedCurrency === 'BRL' && { backgroundColor: colors.primary },
              ]}
            >
              <ThemedText
                style={[
                  styles.currencyButtonText,
                  { color: selectedCurrency === 'BRL' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                BRL
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setSelectedCurrency('USD')}
              style={[
                styles.currencyButton,
                selectedCurrency === 'USD' && { backgroundColor: colors.primary },
              ]}
            >
              <ThemedText
                style={[
                  styles.currencyButtonText,
                  { color: selectedCurrency === 'USD' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                USD
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Path
            d={areaPath}
            fill={colors.success + '20'}
          />
          <Path
            d={pathData}
            stroke={colors.success}
            strokeWidth={2.5}
            fill="none"
          />

          {yAxisValues.map((value, i) => (
            <G key={`y-${i}`}>
              <Line
                x1={CHART_PADDING.left}
                y1={getY(value)}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={getY(value)}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={CHART_PADDING.left - 5}
                y={getY(value) + 4}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="end"
              >
                {formatAxisValue(value)}
              </SvgText>
            </G>
          ))}

          {prices.map((p, i) => {
            if (i % 2 !== 0 && i !== prices.length - 1) return null;
            const date = new Date(p.date);
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            return (
              <SvgText
                key={`x-${i}`}
                x={getX(i)}
                y={CHART_HEIGHT - 10}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}

          {prices.map((p, i) => (
            <Circle
              key={`point-${i}`}
              cx={getX(i)}
              cy={getY(selectedCurrency === 'USD' ? p.priceUSD : p.priceBRL)}
              r={i === prices.length - 1 ? 5 : 3}
              fill={i === prices.length - 1 ? colors.success : '#FFFFFF'}
              stroke={colors.success}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>
    );
  };

  const renderLocalQuote = (quote: LocalQuote) => {
    const isPositive = quote.premiumDiscount >= 0;
    
    return (
      <View key={quote.id} style={[styles.quoteCard, { backgroundColor: colors.card }]}>
        <View style={styles.quoteHeader}>
          <View style={styles.quoteHeaderLeft}>
            <ThemedText style={[styles.quoteBuyerName, { color: colors.text }]}>
              {quote.buyerName}
            </ThemedText>
            <View style={[styles.buyerTypeBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText style={[styles.buyerTypeText, { color: colors.textSecondary }]}>
                {getBuyerTypeLabel(quote.buyerType)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.quoteHeaderRight}>
            <ThemedText style={[styles.quotePrice, { color: colors.text }]}>
              {formatPricePerKg(quote.pricePerKg)}
            </ThemedText>
            <View style={[
              styles.premiumBadge,
              { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Feather
                name={isPositive ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={isPositive ? colors.success : colors.error}
              />
              <ThemedText style={[
                styles.premiumText,
                { color: isPositive ? colors.success : colors.error }
              ]}>
                {formatPremiumDiscount(quote.premiumDiscount)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.quoteDetails}>
          <View style={styles.quoteDetailItem}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.quoteDetailText, { color: colors.textSecondary }]}>
              {quote.region}
            </ThemedText>
          </View>
          <View style={styles.quoteDetailItem}>
            <Feather name="star" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.quoteDetailText, { color: colors.textSecondary }]}>
              {getQualityGradeLabel(quote.qualityGrade)}
            </ThemedText>
          </View>
          <View style={styles.quoteDetailItem}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.quoteDetailText, { color: colors.textSecondary }]}>
              Valido ate {new Date(quote.validUntil).toLocaleDateString('pt-BR')}
            </ThemedText>
          </View>
        </View>

        {quote.notes ? (
          <ThemedText style={[styles.quoteNotes, { color: colors.textSecondary }]}>
            {quote.notes}
          </ThemedText>
        ) : null}
      </View>
    );
  };

  if (!priceData) {
    return (
      <ThemedView style={styles.loadingScreen}>
        <ThemedText>Carregando precos...</ThemedText>
      </ThemedView>
    );
  }

  const { global, fxRate, localQuotes, isStale } = priceData;
  const isPositive = global.changePercent >= 0;

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.globalPriceCard, { backgroundColor: '#8B4513' }]}>
        <View style={styles.globalPriceHeader}>
          <View style={styles.globalPriceIcon}>
            <Feather name="coffee" size={24} color="#FFFFFF" />
          </View>
          <View>
            <ThemedText style={styles.globalPriceLabel}>
              Preco Internacional do Cacau
            </ThemedText>
            <ThemedText style={styles.globalPriceSource}>
              {global.source}
            </ThemedText>
          </View>
        </View>

        <View style={styles.globalPriceMain}>
          <View>
            <ThemedText style={styles.globalPriceValue}>
              {formatPriceUSD(global.priceUSD)}
            </ThemedText>
            <ThemedText style={styles.globalPriceUnit}>
              por tonelada (USD)
            </ThemedText>
          </View>
          <View style={[
            styles.globalChangeBadge,
            { backgroundColor: isPositive ? 'rgba(255,255,255,0.2)' : 'rgba(255,100,100,0.3)' }
          ]}>
            <Feather
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={20}
              color="#FFFFFF"
            />
            <ThemedText style={styles.globalChangeText}>
              {isPositive ? '+' : ''}{global.changePercent.toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.globalPriceFooter}>
          <View style={styles.brlPriceRow}>
            <ThemedText style={styles.brlPriceValue}>
              {formatPriceBRL(global.priceBRL)}
            </ThemedText>
            <ThemedText style={styles.brlPriceLabel}>
              (BRL) | Cambio: R$ {fxRate.toFixed(2)}
            </ThemedText>
          </View>
          <ThemedText style={styles.updateTimeText}>
            {isStale ? 'Dados podem estar desatualizados - ' : ''}
            Atualizado {getRelativeUpdateTime(global.lastUpdated)}
          </ThemedText>
        </View>

        <View style={styles.disclaimerContainer}>
          <Feather name="alert-circle" size={14} color="rgba(255,200,0,0.9)" />
          <ThemedText style={styles.disclaimerText}>
            Obs: Tecnologia em construcao, precos ilustrativos.
          </ThemedText>
        </View>
      </View>

      {renderChart()}

      <View style={styles.localQuotesSection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Cotacoes Locais
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Precos praticados na regiao (PA)
          </ThemedText>
        </View>

        <View style={styles.premiumLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>
              Agio (acima da bolsa)
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>
              Desagio (abaixo da bolsa)
            </ThemedText>
          </View>
        </View>

        {localQuotes.map(renderLocalQuote)}

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="info" size={18} color={colors.primary} />
          <View style={styles.infoCardContent}>
            <ThemedText style={[styles.infoCardTitle, { color: colors.text }]}>
              Sobre as Cotacoes Locais
            </ThemedText>
            <ThemedText style={[styles.infoCardText, { color: colors.textSecondary }]}>
              Os precos locais variam de acordo com a qualidade do cacau, volume, 
              distancia de entrega e condicoes de pagamento. Entre em contato 
              diretamente com os compradores para negociar.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={{ height: Spacing['3xl'] }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalPriceCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  globalPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  globalPriceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  globalPriceSource: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  globalPriceMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  globalPriceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  globalPriceUnit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  globalChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  globalChangeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  globalPriceFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.md,
  },
  brlPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  brlPriceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  brlPriceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  updateTimeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.xs,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  disclaimerText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'rgba(255,200,0,0.9)',
  },
  chartContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  currencyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  currencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  localQuotesSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  premiumLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  quoteCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quoteHeaderLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  quoteBuyerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  buyerTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  buyerTypeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  quoteHeaderRight: {
    alignItems: 'flex-end',
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 4,
    gap: 2,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quoteDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteDetailText: {
    fontSize: 12,
  },
  quoteNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
