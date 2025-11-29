import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Dimensions, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, ShopColors } from '@/constants/theme';
import { Store, Product } from '@/types';
import { getStores, getProductsByStore } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid' as const },
  { id: 'fertilizante', name: 'Fertilizantes', icon: 'package' as const },
  { id: 'ferramenta', name: 'Ferramentas', icon: 'tool' as const },
  { id: 'herbicida', name: 'Herbicidas', icon: 'droplet' as const },
  { id: 'fungicida', name: 'Fungicidas', icon: 'shield' as const },
  { id: 'inseticida', name: 'Inseticidas', icon: 'target' as const },
  { id: 'adubo', name: 'Adubos', icon: 'box' as const },
];

interface StoreWithProducts extends Store {
  products: Product[];
  productCategories: string[];
}

export default function ShopListScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = isDark ? Colors.dark : Colors.light;
  const { width: screenWidth } = useWindowDimensions();
  
  const cardWidth = (screenWidth - Spacing.lg * 3) / 2;

  const [stores, setStores] = useState<StoreWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadStoresWithProducts();
  }, []);

  const loadStoresWithProducts = async () => {
    try {
      setError(null);
      const storesData = await getStores();
      const activeStores = storesData.filter(s => s.status === 'active');
      
      const storesWithProducts: StoreWithProducts[] = await Promise.all(
        activeStores.map(async (store) => {
          const products = await getProductsByStore(store.id);
          const activeProducts = products.filter(p => p.active);
          const productCategories = [...new Set(activeProducts.map(p => p.category))];
          return {
            ...store,
            products: activeProducts,
            productCategories,
          };
        })
      );
      
      setStores(storesWithProducts);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('Nao foi possivel carregar as lojas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = useMemo(() => {
    if (selectedCategory === 'all') {
      return stores;
    }
    return stores.filter(store => 
      store.productCategories.includes(selectedCategory)
    );
  }, [stores, selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const renderHeroBanner = () => (
    <View style={styles.heroBanner}>
      <View style={styles.heroOverlay}>
        <View style={styles.heroContent}>
          <ThemedText type="h2" style={styles.heroTitle}>
            LidaShop
          </ThemedText>
          <ThemedText type="body" style={styles.heroSubtitle}>
            Seu Parceiro no Campo
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.categoryButton,
                isActive && styles.categoryButtonActive,
                { opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <View style={[
                styles.categoryIconContainer,
                isActive && styles.categoryIconContainerActive
              ]}>
                <Feather 
                  name={cat.icon} 
                  size={20} 
                  color={isActive ? '#FFFFFF' : ShopColors.primary} 
                />
              </View>
              <ThemedText 
                type="small" 
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderStoreCard = (store: StoreWithProducts) => (
    <Pressable
      key={store.id}
      style={({ pressed }) => [
        styles.storeCard,
        { width: cardWidth, opacity: pressed ? 0.9 : 1 }
      ]}
      onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
    >
      <View style={styles.storeImagePlaceholder}>
        <Feather name="shopping-bag" size={32} color={ShopColors.primary} />
        {store.products.length > 0 && (
          <View style={styles.productCountBadge}>
            <ThemedText type="small" style={styles.productCountText}>
              {store.products.length}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.storeInfo}>
        <ThemedText type="h4" style={styles.storeName} numberOfLines={1}>
          {store.name}
        </ThemedText>
        <View style={styles.ratingRow}>
          <Feather name="star" size={12} color="#FFB800" />
          <ThemedText type="small" style={styles.ratingText}>
            {store.rating.toFixed(1)}
          </ThemedText>
          <ThemedText type="small" style={styles.reviewsText}>
            ({store.totalReviews})
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={10} color={ShopColors.primary} />
          <ThemedText type="small" style={styles.locationText} numberOfLines={1}>
            {store.city}
          </ThemedText>
        </View>
        {store.verified && (
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={10} color="#FFFFFF" />
            <ThemedText type="small" style={styles.verifiedText}>Verificada</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderStoresGrid = () => {
    const displayCount = filteredStores.length;
    const totalCount = stores.length;
    const showingFiltered = selectedCategory !== 'all';

    return (
      <View style={styles.storesSection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4" style={{ color: ShopColors.primaryDark }}>
            {showingFiltered ? 'Lojas com ' + CATEGORIES.find(c => c.id === selectedCategory)?.name : 'Lojas Disponiveis'}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {displayCount} {displayCount === 1 ? 'loja' : 'lojas'}
            {showingFiltered && totalCount > displayCount ? ` de ${totalCount}` : ''}
          </ThemedText>
        </View>
        <View style={styles.storesGrid}>
          {filteredStores.map(renderStoreCard)}
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={ShopColors.primary} />
      <ThemedText type="body" style={styles.loadingText}>
        Carregando lojas...
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="alert-circle" size={48} color="#D32F2F" />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        Erro ao carregar
      </ThemedText>
      <ThemedText type="body" style={styles.emptySubtitle}>
        {error}
      </ThemedText>
      <Pressable 
        style={styles.retryButton} 
        onPress={() => {
          setLoading(true);
          loadStoresWithProducts();
        }}
      >
        <Feather name="refresh-cw" size={16} color="#FFFFFF" />
        <ThemedText type="body" style={styles.retryButtonText}>Tentar novamente</ThemedText>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="shopping-bag" size={48} color={ShopColors.primary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        {selectedCategory !== 'all' ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponivel'}
      </ThemedText>
      <ThemedText type="body" style={styles.emptySubtitle}>
        {selectedCategory !== 'all' 
          ? 'Nenhuma loja possui produtos nesta categoria. Tente outra categoria.'
          : 'Em breve teremos lojas parceiras na sua regiao'}
      </ThemedText>
      {selectedCategory !== 'all' && (
        <Pressable 
          style={styles.clearFilterButton} 
          onPress={() => setSelectedCategory('all')}
        >
          <ThemedText type="body" style={styles.clearFilterText}>Ver todas as lojas</ThemedText>
        </Pressable>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return renderLoadingState();
    }
    if (error) {
      return renderErrorState();
    }
    if (filteredStores.length === 0) {
      return renderEmptyState();
    }
    return renderStoresGrid();
  };

  return (
    <ScreenScrollView
      style={{ backgroundColor: ShopColors.cream }}
      contentContainerStyle={styles.container}
    >
      {renderHeroBanner()}
      {renderCategories()}
      {renderContent()}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing['3xl'],
  },
  heroBanner: {
    aspectRatio: 2.5,
    maxHeight: 160,
    minHeight: 120,
    backgroundColor: ShopColors.heroBg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: ShopColors.accent,
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  categoriesSection: {
    marginTop: Spacing.lg,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 72,
  },
  categoryButtonActive: {
    backgroundColor: ShopColors.beige,
    borderRadius: BorderRadius.md,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryIconContainerActive: {
    backgroundColor: ShopColors.categoryBg,
  },
  categoryText: {
    color: ShopColors.primary,
    fontSize: 11,
    textAlign: 'center',
  },
  categoryTextActive: {
    fontWeight: '600',
    color: ShopColors.categoryBg,
  },
  storesSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  storeCard: {
    backgroundColor: ShopColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  storeImagePlaceholder: {
    height: 100,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productCountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: ShopColors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  productCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  storeInfo: {
    padding: Spacing.md,
  },
  storeName: {
    color: ShopColors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  ratingText: {
    color: ShopColors.primaryDark,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  reviewsText: {
    color: '#9E9E9E',
    fontSize: 11,
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  locationText: {
    color: '#757575',
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    color: ShopColors.primary,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: ShopColors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: '#757575',
    textAlign: 'center',
    fontSize: 14,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearFilterButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  clearFilterText: {
    color: ShopColors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
