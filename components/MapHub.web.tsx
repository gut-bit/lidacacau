import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';
import { MapActivity, VILA_ALVORADA_KM140 } from '@/types';
import { Spacing } from '@/constants/theme';

interface MapHubProps {
  activities?: MapActivity[];
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  onActivityPress?: (activity: MapActivity) => void;
  height?: number;
}

const RADIUS_OPTIONS = [10, 25, 50, 75, 100];

export function MapHub({ 
  activities = [], 
  searchRadius, 
  onRadiusChange,
  onActivityPress,
  height = 250,
}: MapHubProps) {
  const { theme: colors } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.log('Using default location');
        }
      }
    })();
  }, []);

  const handleRadiusSelect = (radius: number) => {
    onRadiusChange(radius);
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.webFallback, { backgroundColor: colors.primary + '10' }]}>
        <View style={[styles.webFallbackIcon, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="map" size={48} color={colors.primary} />
        </View>
        <ThemedText type="h4" style={{ color: colors.text, marginTop: Spacing.md }}>
          Mapa da Regiao
        </ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
          {VILA_ALVORADA_KM140.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Raio: {searchRadius}km
        </ThemedText>
        {activities.length > 0 ? (
          <View style={[styles.webActivityBadge, { backgroundColor: colors.accent }]}>
            <Feather name="activity" size={14} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>
              {activities.length} {activities.length === 1 ? 'atividade' : 'atividades'} na area
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.radiusSelector, { backgroundColor: colors.card + 'E6' }]}>
        <View style={styles.radiusHeader}>
          <Feather name="target" size={14} color={colors.textSecondary} />
          <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: 4 }}>
            Raio de busca
          </ThemedText>
        </View>
        <View style={styles.radiusButtons}>
          {RADIUS_OPTIONS.map((radius) => (
            <Pressable
              key={radius}
              style={[
                styles.radiusButton,
                { 
                  backgroundColor: searchRadius === radius 
                    ? colors.primary 
                    : colors.backgroundDefault + '80',
                  borderColor: searchRadius === radius 
                    ? colors.primary 
                    : colors.border,
                }
              ]}
              onPress={() => handleRadiusSelect(radius)}
            >
              <ThemedText 
                type="small" 
                style={{ 
                  color: searchRadius === radius ? '#FFFFFF' : colors.text,
                  fontWeight: searchRadius === radius ? '700' : '500',
                  fontSize: 11,
                }}
              >
                {radius}km
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.locationBadge, { backgroundColor: colors.card + 'E6' }]}>
        <Feather name="map-pin" size={12} color={colors.primary} />
        <ThemedText type="small" style={{ color: colors.text, marginLeft: 4, fontSize: 11 }}>
          {VILA_ALVORADA_KM140.name}
        </ThemedText>
      </View>

      {activities.length > 0 ? (
        <View style={[styles.activityCount, { backgroundColor: colors.accent }]}>
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
            {activities.length} {activities.length === 1 ? 'atividade' : 'atividades'}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  radiusSelector: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: 12,
    padding: Spacing.sm,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  radiusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activityCount: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  webFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.lg,
  },
  webFallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webActivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: Spacing.md,
  },
});
