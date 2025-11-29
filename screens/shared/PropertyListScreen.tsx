import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PropertyDetail } from '@/types';
import { getPropertiesByOwner, getPropertyStats, migrateUserProperties } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

interface PropertyStats {
  totalProperties: number;
  totalArea: number;
  verifiedCount: number;
  totalTalhoes: number;
  pendingServices: number;
}

export default function PropertyListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const migrationRanRef = useRef(false);

  const loadProperties = useCallback(async () => {
    if (!user) return;

    try {
      if (!migrationRanRef.current) {
        migrationRanRef.current = true;
        const migratedCount = await migrateUserProperties(user.id);
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} legacy properties to new system`);
        }
      }

      const [propertiesList, propertyStats] = await Promise.all([
        getPropertiesByOwner(user.id),
        getPropertyStats(user.id),
      ]);

      setProperties(propertiesList);
      setStats(propertyStats);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProperties();
  }, [loadProperties]);

  const handlePropertyPress = (property: PropertyDetail) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const handleAddProperty = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('PropertyForm', {});
  };

  const formatArea = (area?: number): string => {
    if (!area) return '0 ha';
    if (area < 1) return `${(area * 10000).toFixed(0)} m²`;
    return `${area.toFixed(2)} ha`;
  };

  const renderVerificationBadge = (status: PropertyDetail['verificationStatus']) => {
    if (status !== 'verified') return null;

    return (
      <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
        <Feather name="check" size={12} color="#FFFFFF" />
      </View>
    );
  };

  const renderPropertyCard = (property: PropertyDetail) => (
    <Pressable
      key={property.id}
      style={[styles.propertyCard, { backgroundColor: colors.card }, Shadows.card]}
      onPress={() => handlePropertyPress(property)}
    >
      <View style={styles.cardContent}>
        {property.coverPhoto ? (
          <Image
            source={{ uri: property.coverPhoto }}
            style={styles.coverPhoto}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.coverPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="map" size={32} color={colors.primary} />
          </View>
        )}
        
        <View style={styles.propertyInfo}>
          <View style={styles.nameRow}>
            <ThemedText type="h4" numberOfLines={1} style={styles.propertyName}>
              {property.name}
            </ThemedText>
            {renderVerificationBadge(property.verificationStatus)}
          </View>
          
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {property.address}
            </ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="maximize" size={14} color={colors.primary} />
              <ThemedText type="body" style={{ color: colors.text }}>
                {formatArea(property.areaHectares)}
              </ThemedText>
            </View>
            
            {property.talhoes.length > 0 ? (
              <View style={styles.statItem}>
                <Feather name="grid" size={14} color={colors.secondary} />
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {property.talhoes.length} talhao{property.talhoes.length !== 1 ? 'es' : ''}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        
        <View style={styles.chevronContainer}>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );

  const renderStatsCard = () => {
    if (!stats || stats.totalProperties === 0) return null;

    return (
      <View style={[styles.statsCard, { backgroundColor: colors.primary + '10' }]}>
        <View style={styles.statsGrid}>
          <View style={styles.statsGridItem}>
            <ThemedText type="h3" style={{ color: colors.primary }}>
              {stats.totalProperties}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Propriedade{stats.totalProperties !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          
          <View style={styles.statsGridItem}>
            <ThemedText type="h3" style={{ color: colors.secondary }}>
              {formatArea(stats.totalArea)}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Area Total
            </ThemedText>
          </View>
          
          <View style={styles.statsGridItem}>
            <ThemedText type="h3" style={{ color: colors.success }}>
              {stats.verifiedCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Verificada{stats.verifiedCount !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="map" size={48} color={colors.primary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Nenhuma propriedade
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Cadastre sua primeira propriedade para gerenciar seus talhoes e acompanhar servicos
      </ThemedText>
      <Pressable
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={handleAddProperty}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={styles.addButtonText}>
          Cadastrar Propriedade
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando propriedades...
          </ThemedText>
        </View>
      );
    }

    if (properties.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.listContainer}>
        {renderStatsCard()}
        {properties.map(renderPropertyCard)}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderContent()}
      </ScreenScrollView>

      {properties.length > 0 ? (
        <Pressable
          style={[
            styles.fab,
            { backgroundColor: colors.primary, bottom: insets.bottom + Spacing.xl },
            Shadows.fab,
          ]}
          onPress={handleAddProperty}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  listContainer: {
    gap: Spacing.md,
  },
  statsCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsGridItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  propertyCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverPhoto: {
    width: 100,
    height: 100,
  },
  coverPhotoPlaceholder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  propertyName: {
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chevronContainer: {
    paddingRight: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    minHeight: Spacing.touchTarget,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
