import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, ShopColors } from '@/constants/theme';
import { Store } from '@/types';
import { getStores } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

const CATEGORIES = [
  { id: 'fertilizante', name: 'Fertilizantes', icon: 'package' as const },
  { id: 'ferramenta', name: 'Ferramentas', icon: 'tool' as const },
  { id: 'herbicida', name: 'Herbicidas', icon: 'droplet' as const },
  { id: 'fungicida', name: 'Fungicidas', icon: 'shield' as const },
  { id: 'inseticida', name: 'Inseticidas', icon: 'target' as const },
  { id: 'adubo', name: 'Adubos', icon: 'box' as const },
];

export default function ShopListScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = isDark ? Colors.dark : Colors.light;

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await getStores();
      const activeStores = data.filter(s => s.status === 'active');
      setStores(activeStores);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
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
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              styles.categoryButton,
              selectedCategory === cat.id && styles.categoryButtonActive,
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <View style={[
              styles.categoryIconContainer,
              selectedCategory === cat.id && styles.categoryIconContainerActive
            ]}>
              <Feather 
                name={cat.icon} 
                size={20} 
                color={selectedCategory === cat.id ? ShopColors.categoryBg : ShopColors.primary} 
              />
            </View>
            <ThemedText 
              type="small" 
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}
              numberOfLines={1}
            >
              {cat.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderStoreCard = (store: Store) => (
    <Pressable
      key={store.id}
      style={({ pressed }) => [
        styles.storeCard,
        { opacity: pressed ? 0.9 : 1 }
      ]}
      onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
    >
      <View style={styles.storeImagePlaceholder}>
        <Feather name="shopping-bag" size={32} color={ShopColors.primary} />
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

  const renderStoresGrid = () => (
    <View style={styles.storesSection}>
      <View style={styles.sectionHeader}>
        <ThemedText type="h4" style={{ color: ShopColors.primaryDark }}>
          Lojas Disponíveis
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}
        </ThemedText>
      </View>
      <View style={styles.storesGrid}>
        {stores.map(renderStoreCard)}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="shopping-bag" size={48} color={ShopColors.primary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        Nenhuma loja disponível
      </ThemedText>
      <ThemedText type="body" style={styles.emptySubtitle}>
        Em breve teremos lojas parceiras na sua região
      </ThemedText>
    </View>
  );

  return (
    <ScreenScrollView
      style={{ backgroundColor: ShopColors.cream }}
      contentContainerStyle={styles.container}
    >
      {renderHeroBanner()}
      {renderCategories()}
      {stores.length > 0 ? renderStoresGrid() : renderEmptyState()}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing['3xl'],
  },
  heroBanner: {
    height: 140,
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
    width: CARD_WIDTH,
    backgroundColor: ShopColors.cardBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
  },
  storeImagePlaceholder: {
    height: 100,
    backgroundColor: ShopColors.beige,
    justifyContent: 'center',
    alignItems: 'center',
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
});
