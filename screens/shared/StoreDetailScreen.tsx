import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Store, Product, StoreSignup } from '@/types';
import { getStoreById, getProductsByStore, addToCart, addStoreSignup, generateId } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';
import StoreSignupModal from '@/screens/shared/StoreSignupModal';

const PRIMARY_COLOR = '#F15A29';

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
      Alert.alert('Sucesso', 'Produto adicionado ao carrinho!');
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

  if (!store) {
    return (
      <ScreenScrollView>
        <ThemedText>Carregando...</ThemedText>
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
      <ScreenScrollView>
        <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.backgroundDefault, borderBottomColor: colors.border }]}>
          <View>
            <ThemedText type="h3">{store.name}</ThemedText>
            <View style={styles.ratingRow}>
              <Feather name="star" size={16} color={PRIMARY_COLOR} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                {store.rating.toFixed(1)} ({store.totalReviews})
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              {store.city}, {store.state}
            </ThemedText>
          </View>
          {store.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
              <Feather name="check-circle" size={20} color={colors.success} />
            </View>
          )}
        </View>

        {store.description && (
          <View style={styles.section}>
            <ThemedText type="small">{store.description}</ThemedText>
          </View>
        )}

        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: Spacing.md }]}>
          <ThemedText type="h5" style={{ marginBottom: Spacing.md }}>Contato</ThemedText>
          {store.phone && (
            <View style={styles.contactRow}>
              <Feather name="phone" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>{store.phone}</ThemedText>
            </View>
          )}
          {store.whatsapp && (
            <View style={styles.contactRow}>
              <Feather name="message-circle" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>WhatsApp: {store.whatsapp}</ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <ThemedText type="h5" style={{ marginBottom: Spacing.md }}>Produtos ({products.length})</ThemedText>
          {products.length === 0 ? (
            <ThemedText type="small" style={{ color: colors.textSecondary }}>Nenhum produto disponivel</ThemedText>
          ) : (
            products.map(product => (
              <View key={product.id} style={[styles.productItem, { borderBottomColor: colors.border }]}>
                <View>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{product.name}</ThemedText>
                  {product.description && (
                    <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                      {product.description}
                    </ThemedText>
                  )}
                  <View style={styles.priceRow}>
                    {product.discount ? (
                      <>
                        <ThemedText type="small" style={{ color: colors.textSecondary, textDecorationLine: 'line-through', marginRight: Spacing.sm }}>
                          R$ {product.price.toFixed(2)}
                        </ThemedText>
                        <View style={[styles.discountBadge, { backgroundColor: '#FF4444' }]}>
                          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                            -{product.discount}%
                          </ThemedText>
                        </View>
                        <ThemedText type="h5" style={{ color: PRIMARY_COLOR, marginLeft: Spacing.sm }}>
                          R$ {(product.price * (1 - product.discount / 100)).toFixed(2)}
                        </ThemedText>
                      </>
                    ) : (
                      <ThemedText type="h5" style={{ color: PRIMARY_COLOR }}>
                        R$ {product.price.toFixed(2)}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <Pressable 
                  style={[styles.addButton, { backgroundColor: PRIMARY_COLOR }]}
                  onPress={() => handleAddToCart(product)}
                >
                  <Feather name="plus" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  discountBadge: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  verifiedBadge: {
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  section: {
    marginVertical: Spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addButton: {
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
});
