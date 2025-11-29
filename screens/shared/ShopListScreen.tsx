import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Store } from '@/types';
import { getStores } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

const PRIMARY_COLOR = '#F15A29';

export default function ShopListScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = isDark ? Colors.dark : Colors.light;

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await getStores();
      setStores(data.filter(s => s.status === 'active'));
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStoreCard = ({ item }: { item: Store }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.storeCard,
        { 
          backgroundColor: colors.backgroundDefault,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1
        }
      ]}
      onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <ThemedText type="h5" numberOfLines={1}>{item.name}</ThemedText>
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={PRIMARY_COLOR} />
            <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
              {item.rating.toFixed(1)} ({item.totalReviews} avaliacoes)
            </ThemedText>
          </View>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
            {item.city}, {item.state}
          </ThemedText>
        </View>
        {item.verified && (
          <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
          </View>
        )}
      </View>
      {item.description && (
        <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
          {item.description}
        </ThemedText>
      )}
    </Pressable>
  );

  return (
    <ScreenFlatList
      data={stores}
      renderItem={renderStoreCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={{ marginBottom: Spacing.lg }}>
          <ThemedText type="h3" style={{ marginBottom: Spacing.sm }}>LidaShop</ThemedText>
          <View style={[
            styles.banner,
            { backgroundColor: colors.accent + '20', borderColor: colors.accent }
          ]}>
            <Feather name="alert-circle" size={20} color={colors.accent} />
            <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
              <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>
                Em Construção
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                Estamos desenvolvendo: busca avançada, filtros por preço, programa de fidelidade, rastreio de pedidos, múltiplas opções de entrega
              </ThemedText>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={48} color={colors.textSecondary} />
          <ThemedText type="h5" style={{ marginTop: Spacing.md }}>Nenhuma loja disponível</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  storeCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  badge: {
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  banner: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
});
