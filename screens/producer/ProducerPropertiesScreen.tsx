import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Property } from '@/types';
import { getUserById, updateUser } from '@/utils/storage';

export default function ProducerPropertiesScreen() {
  const { theme, isDark } = useTheme();
  const { user, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [properties, setProperties] = useState<Property[]>(user?.properties || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const loadProperties = useCallback(async () => {
    if (!user) return;
    try {
      const userData = await getUserById(user.id);
      setProperties(userData?.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    loadProperties();
  }, [loadProperties]));

  const handleAddProperty = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à localização');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressText = address
        ? [address.street, address.district, address.city].filter(Boolean).join(', ')
        : 'Propriedade sem nome';

      Alert.prompt(
        'Nome da Propriedade',
        'Como você quer nomear essa propriedade?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async (name) => {
              if (!name?.trim()) return;
              
              setIsLoading(true);
              try {
                const newProperty: Property = {
                  id: Math.random().toString(36).substring(7),
                  name: name.trim(),
                  address: addressText,
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                };

                const updatedProperties = [...properties, newProperty];
                setProperties(updatedProperties);

                if (user) {
                  await updateUser(user.id, { properties: updatedProperties });
                  setUser({ ...user, properties: updatedProperties });
                }

                Alert.alert('Sucesso', 'Propriedade adicionada com sucesso!');
              } catch (error: any) {
                Alert.alert('Erro', error.message || 'Não foi possível adicionar a propriedade');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        'plain-text',
        addressText
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    Alert.alert('Remover Propriedade', 'Tem certeza que deseja remover essa propriedade?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedProperties = properties.filter((p) => p.id !== propertyId);
            setProperties(updatedProperties);

            if (user) {
              await updateUser(user.id, { properties: updatedProperties });
              setUser({ ...user, properties: updatedProperties });
            }

            Alert.alert('Sucesso', 'Propriedade removida');
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível remover');
          }
        },
      },
    ]);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <View style={[styles.propertyCard, { backgroundColor: colors.card }, Shadows.card]}>
      <View style={styles.propertyContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="map-pin" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="h4">{item.name}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
            {item.address}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.accent, marginTop: Spacing.xs }}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </ThemedText>
        </View>
      </View>
      <Pressable
        onPress={() => handleDeleteProperty(item.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <Feather name="trash-2" size={20} color={colors.error} />
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
      >
        <View style={styles.header}>
          <ThemedText type="h3">Minhas Propriedades</ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            Adicione as endereços das suas propriedades para criar demandas com precisão
          </ThemedText>
        </View>

        {properties.length > 0 ? (
          <FlatList
            data={properties}
            renderItem={renderProperty}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            itemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            style={styles.list}
          />
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundDefault }]}>
            <Feather name="inbox" size={48} color={colors.textSecondary} />
            <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' }}>
              Nenhuma propriedade adicionada
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}
            >
              Toque no botão abaixo para adicionar uma propriedade
            </ThemedText>
          </View>
        )}

        <Button
          onPress={handleAddProperty}
          disabled={isLoading || isGettingLocation}
          style={styles.addButton}
        >
          {isGettingLocation ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                Adicionar Propriedade
              </ThemedText>
            </>
          )}
        </Button>
      </ScreenKeyboardAwareScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  list: {
    marginBottom: Spacing['2xl'],
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  propertyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.sm,
    minHeight: 200,
    marginBottom: Spacing['2xl'],
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
