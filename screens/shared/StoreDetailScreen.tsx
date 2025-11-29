import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, ShopColors } from '@/constants/theme';
import { Store, Product, StoreSignup } from '@/types';
import { getStoreById, getProductsByStore, addToCart, addStoreSignup, generateId } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';
import StoreSignupModal from '@/screens/shared/StoreSignupModal';

const CATEGORY_ICONS: Record<string, string> = {
  herbicida: 'droplet',
  fungicida: 'shield',
  inseticida: 'target',
  adubo: 'box',
  ferramenta: 'tool',
  fertilizante: 'package',
};

type LoadingState = 'loading' | 'success' | 'error' | 'not_found';

export default function StoreDetailScreen() {
  const { isDark } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'StoreDetail'>>();
  const navigation = useNavigation();
  const colors = isDark ? Colors.dark : Colors.light;
  const { width: screenWidth } = useWindowDimensions();
  
  const productCardWidth = (screenWidth - Spacing.lg * 3) / 2;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [signupModalVisible, setSignupModalVisible] = useState(false);

  const { storeId } = route.params;

  useEffect(() => {
    loadStoreDetails();
  }, [storeId]);

  useEffect(() => {
    if (store?.id === 'cacauprodutos-test') {
      setSignupModalVisible(true);
    }
  }, [store?.id]);

  const loadStoreDetails = async () => {
    try {
      setLoadingState('loading');
      const storeData = await getStoreById(storeId);
      
      if (!storeData) {
        setLoadingState('not_found');
        return;
      }
      
      const productsData = await getProductsByStore(storeId);
      setStore(storeData);
      setProducts(productsData.filter(p => p.active));
      setLoadingState('success');
    } catch (error) {
      console.error('Error loading store:', error);
      setLoadingState('error');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, product.storeId, 1);
      Alert.alert('Adicionado!', `${product.name} foi adicionado ao carrinho`);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel adicionar ao carrinho');
    }
  };

  const handleStoreSignupSubmit = async (formData: {
    name: string;
    storeName: string;
    email: string;
    whatsapp: string;
    city: string;
    state: string;
    businessType?: string;
  }) => {
    const signup: StoreSignup = {
      id: generateId(),
      name: formData.name,
      storeName: formData.storeName,
      email: formData.email,
      whatsapp: formData.whatsapp,
      city: formData.city,
      state: formData.state,
      businessType: formData.businessType,
      createdAt: new Date().toISOString(),
    };
    await addStoreSignup(signup);
  };

  const renderStoreHeader = () => (
    <View style={styles.storeHeader}>
      <View style={styles.storeIconContainer}>
        <Feather name="shopping-bag" size={40} color={ShopColors.primary} />
      </View>
      <View style={styles.storeHeaderInfo}>
        <ThemedText type="h3" style={styles.storeName}>{store?.name}</ThemedText>
        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color="#FFB800" />
          <ThemedText type="body" style={styles.ratingValue}>
            {store?.rating.toFixed(1)}
          </ThemedText>
          <ThemedText type="small" style={styles.reviewCount}>
            ({store?.totalReviews} avaliacoes)
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={ShopColors.primary} />
          <ThemedText type="small" style={styles.locationText}>
            {store?.city}, {store?.state}
          </ThemedText>
        </View>
        {store?.verified && (
          <View style={styles.verifiedTag}>
            <Feather name="check-circle" size={12} color="#FFFFFF" />
            <ThemedText type="small" style={styles.verifiedText}>Loja Verificada</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  const renderProductCard = (product: Product) => {
    const finalPrice = product.discount 
      ? product.price * (1 - product.discount / 100) 
      : product.price;
    const iconName = CATEGORY_ICONS[product.category] || 'package';

    return (
      <View key={product.id} style={[styles.productCard, { width: productCardWidth }]}>
        <View style={styles.productImageContainer}>
          <Feather name={iconName as any} size={36} color={ShopColors.primary} />
          {product.discount ? (
            <View style={styles.discountBadge}>
              <ThemedText type="small" style={styles.discountText}>
                -{product.discount}%
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.productInfo}>
          <ThemedText type="body" style={styles.productName} numberOfLines={2}>
            {product.name}
          </ThemedText>
          <View style={styles.priceContainer}>
            {product.discount ? (
              <ThemedText type="small" style={styles.originalPrice}>
                R$ {product.price.toFixed(2)}
              </ThemedText>
            ) : null}
            <ThemedText type="h4" style={styles.finalPrice}>
              R$ {finalPrice.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <Pressable 
          style={({ pressed }) => [
            styles.addButton,
            { opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => handleAddToCart(product)}
        >
          <ThemedText type="body" style={styles.addButtonText}>Adicionar</ThemedText>
        </Pressable>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={ShopColors.primary} />
      <ThemedText type="body" style={styles.centerStateText}>
        Carregando loja...
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerState}>
      <View style={styles.errorIconContainer}>
        <Feather name="alert-circle" size={48} color="#D32F2F" />
      </View>
      <ThemedText type="h4" style={styles.errorTitle}>
        Erro ao carregar
      </ThemedText>
      <ThemedText type="body" style={styles.errorSubtitle}>
        Nao foi possivel carregar os detalhes da loja.
      </ThemedText>
      <Pressable style={styles.retryButton} onPress={loadStoreDetails}>
        <Feather name="refresh-cw" size={16} color="#FFFFFF" />
        <ThemedText type="body" style={styles.retryButtonText}>Tentar novamente</ThemedText>
      </Pressable>
    </View>
  );

  const renderNotFoundState = () => (
    <View style={styles.centerState}>
      <View style={styles.notFoundIconContainer}>
        <Feather name="search" size={48} color={ShopColors.primary} />
      </View>
      <ThemedText type="h4" style={styles.notFoundTitle}>
        Loja nao encontrada
      </ThemedText>
      <ThemedText type="body" style={styles.notFoundSubtitle}>
        Esta loja pode ter sido removida ou o link esta incorreto.
      </ThemedText>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={16} color="#FFFFFF" />
        <ThemedText type="body" style={styles.backButtonText}>Voltar para lojas</ThemedText>
      </Pressable>
    </View>
  );

  const renderEmptyProducts = () => (
    <View style={styles.emptyProducts}>
      <Feather name="package" size={40} color="#BDBDBD" />
      <ThemedText type="body" style={styles.emptyText}>
        Nenhum produto disponivel
      </ThemedText>
    </View>
  );

  if (loadingState === 'loading') {
    return (
      <ScreenScrollView style={{ backgroundColor: ShopColors.cream }}>
        {renderLoadingState()}
      </ScreenScrollView>
    );
  }

  if (loadingState === 'error') {
    return (
      <ScreenScrollView style={{ backgroundColor: ShopColors.cream }}>
        {renderErrorState()}
      </ScreenScrollView>
    );
  }

  if (loadingState === 'not_found' || !store) {
    return (
      <ScreenScrollView style={{ backgroundColor: ShopColors.cream }}>
        {renderNotFoundState()}
      </ScreenScrollView>
    );
  }

  return (
    <>
      <StoreSignupModal
        visible={signupModalVisible}
        onClose={() => setSignupModalVisible(false)}
        onSubmit={handleStoreSignupSubmit}
      />
      <ScreenScrollView 
        style={{ backgroundColor: ShopColors.cream }}
        contentContainerStyle={styles.container}
      >
        {renderStoreHeader()}

        {store.description ? (
          <View style={styles.descriptionSection}>
            <ThemedText type="body" style={styles.description}>
              {store.description}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.contactSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>Contato</ThemedText>
          <View style={styles.contactRow}>
            {store.phone ? (
              <View style={styles.contactItem}>
                <Feather name="phone" size={16} color={ShopColors.primary} />
                <ThemedText type="small" style={styles.contactText}>{store.phone}</ThemedText>
              </View>
            ) : null}
            {store.whatsapp ? (
              <View style={styles.contactItem}>
                <Feather name="message-circle" size={16} color={ShopColors.secondary} />
                <ThemedText type="small" style={styles.contactText}>{store.whatsapp}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Produtos
            </ThemedText>
            <ThemedText type="small" style={styles.productCount}>
              {products.length} {products.length === 1 ? 'item' : 'itens'}
            </ThemedText>
          </View>

          {products.length === 0 ? (
            renderEmptyProducts()
          ) : (
            <View style={styles.productsGrid}>
              {products.map(renderProductCard)}
            </View>
          )}
        </View>
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing['4xl'],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  centerStateText: {
    color: ShopColors.primary,
    marginTop: Spacing.md,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtitle: {
    color: '#757575',
    textAlign: 'center',
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
  notFoundIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  notFoundTitle: {
    color: ShopColors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  notFoundSubtitle: {
    color: '#757575',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  storeHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: ShopColors.cardBg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  storeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  storeHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  storeName: {
    color: ShopColors.primaryDark,
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    color: ShopColors.primaryDark,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
  reviewCount: {
    color: '#9E9E9E',
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  locationText: {
    color: '#757575',
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  description: {
    color: '#616161',
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: ShopColors.primaryDark,
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: Spacing.sm,
    color: '#616161',
  },
  productsSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productCount: {
    color: '#9E9E9E',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  productCard: {
    backgroundColor: ShopColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 100,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: '#D32F2F',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    color: ShopColors.primaryDark,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    minHeight: 36,
  },
  priceContainer: {
    marginTop: Spacing.sm,
  },
  originalPrice: {
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
    fontSize: 11,
  },
  finalPrice: {
    color: ShopColors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: ShopColors.buttonBg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: ShopColors.buttonText,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    color: '#9E9E9E',
    marginTop: Spacing.md,
  },
});
