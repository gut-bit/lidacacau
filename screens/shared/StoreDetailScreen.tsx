import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Store, Product } from '@/types';
import { getStoreById, getProductsByStore, addToCart } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

const PRIMARY_COLOR = '#F15A29';

export default function StoreDetailScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'StoreDetail'>>();
  const colors = isDark ? Colors.dark : Colors.light;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { storeId } = route.params;

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

  if (!store) {
    return (
      <ScreenScrollView>
        <ThemedText>Carregando...</ThemedText>
      </ScreenScrollView>
    );
  }

  return (
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
                    <ThemedText type="h5" style={{ color: PRIMARY_COLOR }}>
                      R$ {product.price.toFixed(2)}
                    </ThemedText>
                    {product.discount && (
                      <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>
                        -{product.discount}%
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
  );
}

const styles = StyleSheet.create({
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
