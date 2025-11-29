import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert, Dimensions } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, ShopColors } from '@/constants/theme';
import { Store, Product, StoreSignup } from '@/types';
import { getStoreById, getProductsByStore, addToCart, addStoreSignup, generateId } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';
import StoreSignupModal from '@/screens/shared/StoreSignupModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

const CATEGORY_ICONS: Record<string, string> = {
  herbicida: 'droplet',
  fungicida: 'shield',
  inseticida: 'target',
  adubo: 'box',
  ferramenta: 'tool',
  fertilizante: 'package',
};

export default function StoreDetailScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'StoreDetail'>>();
  const colors = isDark ? Colors.dark : Colors.light;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [signupModalVisible, setSignupModalVisible] = useState(false);

  const { storeId } = route.params;

  useEffect(() => {
    if (store?.id === 'cacauprodutos-test') {
      setSignupModalVisible(true);
    }
  }, [store?.id]);

  useEffect(() => {
    loadStoreDetails();
  }, [storeId]);

  const loadStoreDetails = async () => {
    try {
      const storeData = await getStoreById(storeId);
      const productsData = await getProductsByStore(storeId);
      setStore(storeData);
      setProducts(productsData.filter(p => p.active));
    } catch (error) {
      console.error('Error loading store:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar os detalhes da loja');
    } finally {
      setLoading(false);
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
          <ThemedText type="caption" style={styles.reviewCount}>
            ({store?.totalReviews} avaliacoes)
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={ShopColors.primary} />
          <ThemedText type="caption" style={styles.locationText}>
            {store?.city}, {store?.state}
          </ThemedText>
        </View>
        {store?.verified && (
          <View style={styles.verifiedTag}>
            <Feather name="check-circle" size={12} color="#FFFFFF" />
            <ThemedText type="caption" style={styles.verifiedText}>Loja Verificada</ThemedText>
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
      <View key={product.id} style={styles.productCard}>
        <View style={styles.productImageContainer}>
          <Feather name={iconName as any} size={36} color={ShopColors.primary} />
          {product.discount ? (
            <View style={styles.discountBadge}>
              <ThemedText type="caption" style={styles.discountText}>
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
              <ThemedText type="caption" style={styles.originalPrice}>
                R$ {product.price.toFixed(2)}
              </ThemedText>
            ) : null}
            <ThemedText type="h5" style={styles.finalPrice}>
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

  if (!store) {
    return (
      <ScreenScrollView style={{ backgroundColor: ShopColors.cream }}>
        <View style={styles.loadingContainer}>
          <ThemedText type="body">Carregando...</ThemedText>
        </View>
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
          <ThemedText type="h5" style={styles.sectionTitle}>Contato</ThemedText>
          <View style={styles.contactRow}>
            {store.phone ? (
              <View style={styles.contactItem}>
                <Feather name="phone" size={16} color={ShopColors.primary} />
                <ThemedText type="caption" style={styles.contactText}>{store.phone}</ThemedText>
              </View>
            ) : null}
            {store.whatsapp ? (
              <View style={styles.contactItem}>
                <Feather name="message-circle" size={16} color={ShopColors.secondary} />
                <ThemedText type="caption" style={styles.contactText}>{store.whatsapp}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Produtos
            </ThemedText>
            <ThemedText type="caption" style={styles.productCount}>
              {products.length} {products.length === 1 ? 'item' : 'itens'}
            </ThemedText>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Feather name="package" size={40} color="#BDBDBD" />
              <ThemedText type="body" style={styles.emptyText}>
                Nenhum produto disponível
              </ThemedText>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  storeHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: ShopColors.cardBg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    elevation: 2,
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
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: ShopColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
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
