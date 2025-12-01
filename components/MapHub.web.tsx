import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
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

const radiusToZoom = (radiusKm: number): number => {
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 11;
  if (radiusKm <= 50) return 10;
  if (radiusKm <= 75) return 9;
  return 8;
};

export function MapHub({ 
  activities = [], 
  searchRadius, 
  onRadiusChange,
  onActivityPress,
  height = 250,
}: MapHubProps) {
  const { theme: colors } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showExperimentalBanner, setShowExperimentalBanner] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Web location error, using default');
      }
    })();
  }, []);

  const handleRadiusSelect = (radius: number) => {
    onRadiusChange(radius);
  };

  const centerLat = userLocation?.latitude || VILA_ALVORADA_KM140.latitude;
  const centerLon = userLocation?.longitude || VILA_ALVORADA_KM140.longitude;
  const zoom = radiusToZoom(searchRadius);

  const createActivityMarkers = useCallback(() => {
    if (activities.length === 0) return '';
    
    return activities.map((activity, index) => {
      const color = activity.type === 'job' ? 'red' : 'blue';
      return `&marker=${activity.latitude},${activity.longitude},${color}`;
    }).join('');
  }, [activities]);

  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLon - 0.5},${centerLat - 0.3},${centerLon + 0.5},${centerLat + 0.3}&layer=mapnik&marker=${centerLat},${centerLon}`;

  const handleMapLoad = () => {
    setMapLoaded(true);
    setMapError(false);
  };

  const handleMapError = () => {
    setMapError(true);
    setMapLoaded(false);
  };

  const renderExperimentalBanner = () => {
    if (!showExperimentalBanner) return null;
    
    return (
      <Pressable 
        style={[styles.experimentalBanner, { backgroundColor: '#FFA500' }]}
        onPress={() => setShowExperimentalBanner(false)}
      >
        <Feather name="alert-triangle" size={12} color="#000" />
        <ThemedText type="small" style={styles.experimentalText}>
          Mapa Web Experimental - Toque para fechar
        </ThemedText>
      </Pressable>
    );
  };

  const renderWebMap = () => {
    if (Platform.OS !== 'web') {
      return renderFallback();
    }

    return (
      <View style={styles.mapContainer}>
        {!mapLoaded && !mapError ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.primary + '10' }]}>
            <Feather name="loader" size={32} color={colors.primary} />
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 8 }}>
              Carregando mapa...
            </ThemedText>
          </View>
        ) : null}
        
        {mapError ? (
          renderFallback()
        ) : (
          <iframe
            src={openStreetMapUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 16,
              display: mapLoaded ? 'block' : 'none',
            }}
            onLoad={handleMapLoad}
            onError={handleMapError}
            title="Mapa LidaCacau"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        
        {renderExperimentalBanner()}
      </View>
    );
  };

  const renderFallback = () => (
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
      {userLocation ? (
        <View style={[styles.locationInfo, { backgroundColor: colors.success + '20' }]}>
          <Feather name="check-circle" size={12} color={colors.success} />
          <ThemedText type="small" style={{ color: colors.success, marginLeft: 4 }}>
            GPS ativo (precisao limitada no navegador)
          </ThemedText>
        </View>
      ) : null}
      {activities.length > 0 ? (
        <View style={[styles.webActivityBadge, { backgroundColor: colors.accent }]}>
          <Feather name="activity" size={14} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>
            {activities.length} {activities.length === 1 ? 'atividade' : 'atividades'} na area
          </ThemedText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { height }]}>
      {renderWebMap()}

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
  mapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  experimentalBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 100,
  },
  experimentalText: {
    color: '#000',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 10,
  },
});
