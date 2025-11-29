import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lidacacau_cocoa_prices';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface CocoaPrice {
  priceUSD: number;
  priceBRL: number;
  changePercent: number;
  changeValue: number;
  lastUpdated: string;
  source: string;
}

export interface LocalQuote {
  id: string;
  buyerName: string;
  buyerType: 'moageira' | 'exportador' | 'cooperativa' | 'intermediario';
  region: string;
  pricePerKg: number;
  premiumDiscount: number;
  qualityGrade: 'superior' | 'bom' | 'tipo' | 'abaixo';
  validUntil: string;
  notes?: string;
  lastUpdated: string;
}

export interface CocoaPriceData {
  global: CocoaPrice;
  fxRate: number;
  localQuotes: LocalQuote[];
  historicalPrices: { date: string; priceUSD: number; priceBRL: number }[];
  fetchedAt: string;
  isStale: boolean;
}

const MOCK_HISTORICAL_PRICES = [
  { date: '2025-11-22', priceUSD: 7850, priceBRL: 47100 },
  { date: '2025-11-23', priceUSD: 7920, priceBRL: 47520 },
  { date: '2025-11-24', priceUSD: 7880, priceBRL: 47280 },
  { date: '2025-11-25', priceUSD: 7950, priceBRL: 47700 },
  { date: '2025-11-26', priceUSD: 8020, priceBRL: 48120 },
  { date: '2025-11-27', priceUSD: 8100, priceBRL: 48600 },
  { date: '2025-11-28', priceUSD: 8150, priceBRL: 48900 },
  { date: '2025-11-29', priceUSD: 8200, priceBRL: 49200 },
];

const MOCK_LOCAL_QUOTES: LocalQuote[] = [
  {
    id: 'quote_1',
    buyerName: 'Cargill Cacau',
    buyerType: 'moageira',
    region: 'Uruara/PA',
    pricePerKg: 32.50,
    premiumDiscount: -2.5,
    qualityGrade: 'bom',
    validUntil: '2025-12-05',
    notes: 'Coleta na propriedade acima de 500kg',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'quote_2',
    buyerName: 'Barry Callebaut',
    buyerType: 'moageira',
    region: 'Altamira/PA',
    pricePerKg: 33.00,
    premiumDiscount: 0,
    qualityGrade: 'superior',
    validUntil: '2025-12-03',
    notes: 'Entrega em Altamira',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'quote_3',
    buyerName: 'Cooperativa Terra Firme',
    buyerType: 'cooperativa',
    region: 'Medicilândia/PA',
    pricePerKg: 31.80,
    premiumDiscount: -4.0,
    qualityGrade: 'tipo',
    validUntil: '2025-12-10',
    notes: 'Pagamento em 7 dias',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'quote_4',
    buyerName: 'Exportadora Amazonia',
    buyerType: 'exportador',
    region: 'Belem/PA',
    pricePerKg: 34.20,
    premiumDiscount: +3.5,
    qualityGrade: 'superior',
    validUntil: '2025-12-01',
    notes: 'Cacau fino de aroma, certificado',
    lastUpdated: new Date().toISOString(),
  },
];

const generateMockGlobalPrice = (): CocoaPrice => {
  const basePrice = 8200;
  const variation = (Math.random() - 0.5) * 200;
  const priceUSD = Math.round(basePrice + variation);
  const fxRate = 6.0 + (Math.random() - 0.5) * 0.2;
  const priceBRL = Math.round(priceUSD * fxRate);
  
  const previousPrice = MOCK_HISTORICAL_PRICES[MOCK_HISTORICAL_PRICES.length - 2].priceUSD;
  const changeValue = priceUSD - previousPrice;
  const changePercent = (changeValue / previousPrice) * 100;

  return {
    priceUSD,
    priceBRL,
    changePercent: Math.round(changePercent * 100) / 100,
    changeValue,
    lastUpdated: new Date().toISOString(),
    source: 'ICE Futures / ICCO',
  };
};

export const fetchCocoaPrices = async (forceRefresh = false): Promise<CocoaPriceData> => {
  if (forceRefresh) {
    return await fetchFreshPrices();
  }

  const cached = await getCachedPrices();
  
  if (cached && !cached.isStale) {
    return cached;
  }
  
  if (cached) {
    refreshPricesInBackground();
    return cached;
  }

  return await fetchFreshPrices();
};

const fetchFreshPrices = async (): Promise<CocoaPriceData> => {
  const globalPrice = generateMockGlobalPrice();
  const fxRate = globalPrice.priceBRL / globalPrice.priceUSD;

  const data: CocoaPriceData = {
    global: globalPrice,
    fxRate: Math.round(fxRate * 100) / 100,
    localQuotes: MOCK_LOCAL_QUOTES,
    historicalPrices: [
      ...MOCK_HISTORICAL_PRICES,
      { 
        date: new Date().toISOString().split('T')[0], 
        priceUSD: globalPrice.priceUSD, 
        priceBRL: globalPrice.priceBRL 
      },
    ],
    fetchedAt: new Date().toISOString(),
    isStale: false,
  };

  await cachePrices(data);
  return data;
};

const refreshPricesInBackground = (): void => {
  fetchFreshPrices().catch((error) => {
    console.error('Background price refresh failed:', error);
  });
};

export const getCachedPrices = async (): Promise<CocoaPriceData | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: CocoaPriceData = JSON.parse(stored);
    const fetchedAt = new Date(data.fetchedAt).getTime();
    const now = Date.now();
    const isStale = (now - fetchedAt) > CACHE_TTL_MS;

    return { ...data, isStale };
  } catch (error) {
    console.error('Error getting cached prices:', error);
    return null;
  }
};

const cachePrices = async (data: CocoaPriceData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching prices:', error);
  }
};

export const formatPriceUSD = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatPriceBRL = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatPricePerKg = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price) + '/kg';
};

export const formatPremiumDiscount = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export const getQualityGradeLabel = (grade: LocalQuote['qualityGrade']): string => {
  const labels = {
    superior: 'Superior',
    bom: 'Bom',
    tipo: 'Tipo',
    abaixo: 'Abaixo do Tipo',
  };
  return labels[grade];
};

export const getBuyerTypeLabel = (type: LocalQuote['buyerType']): string => {
  const labels = {
    moageira: 'Moageira',
    exportador: 'Exportador',
    cooperativa: 'Cooperativa',
    intermediario: 'Intermediario',
  };
  return labels[type];
};

export const getRelativeUpdateTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `ha ${diffMins} min`;
  if (diffHours < 24) return `ha ${diffHours}h`;
  return date.toLocaleDateString('pt-BR');
};
