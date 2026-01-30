import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';
import { MapActivity, MapRegion, VILA_ALVORADA_KM140 } from '@/types';
import { Spacing } from '@/constants/theme';
import { Avatar } from './Avatar';

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
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('hybrid');

  const toggleMapType = () => {
    setMapType(current => {
      if (current === 'standard') return 'satellite';
      if (current === 'satellite') return 'hybrid';
      return 'standard';
    });
  };

  const centerLocation = {
    latitude: VILA_ALVORADA_KM140.latitude,
    longitude: VILA_ALVORADA_KM140.longitude,
  };

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

  const getMarkerColor = (activity: MapActivity) => {
    if (activity.type === 'job') {
      switch (activity.status) {
        case 'open': return colors.primary;
        case 'assigned': return colors.accent;
        case 'closed': return colors.success;
        default: return colors.textSecondary;
      }
    }
    if (activity.type === 'worker') {
      return '#8B5CF6';
    }
    return colors.secondary;
  };

  const getLevelColor = (level?: number) => {
    if (!level) return colors.textSecondary;
    const levelColors: Record<number, string> = {
      1: '#78716C',
      2: '#22C55E',
      3: '#3B82F6',
      4: '#8B5CF6',
      5: '#FFB800',
    };
    return levelColors[level] || colors.textSecondary;
  };

  const radiusInMeters = searchRadius * 1000;

  const calculateDelta = (radiusKm: number) => {
    const kmPerDegree = 111;
    return (radiusKm / kmPerDegree) * 2.5;
  };

  const initialRegion: MapRegion = {
    ...centerLocation,
    latitudeDelta: calculateDelta(searchRadius),
    longitudeDelta: calculateDelta(searchRadius),
  };

  const handleRadiusSelect = (radius: number) => {
    onRadiusChange(radius);
    if (mapRef.current) {
      const delta = calculateDelta(radius);
      mapRef.current.animateToRegion({
        ...centerLocation,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }, 500);
    }
  };

  const renderNativeMap = () => (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
      onMapReady={() => setMapReady(true)}
      mapType={mapType}
    >
      <Circle
        center={centerLocation}
        radius={radiusInMeters}
        strokeColor={colors.primary + '80'}
        fillColor={colors.primary + '15'}
        strokeWidth={2}
      />

      <Marker
        coordinate={centerLocation}
        title={VILA_ALVORADA_KM140.name}
        description={`${VILA_ALVORADA_KM140.city}/${VILA_ALVORADA_KM140.state}`}
        pinColor={colors.primary}
      />

      {activities.map((activity) => (
        <Marker
          key={activity.id}
          coordinate={{
            latitude: activity.latitude,
            longitude: activity.longitude,
          }}
          title={activity.title}
          description={activity.subtitle}
          onPress={() => onActivityPress?.(activity)}
        >
          <View style={[
            styles.customMarker,
            { backgroundColor: getMarkerColor(activity) }
          ]}>
            {activity.avatar ? (
              <Avatar
                uri={activity.avatar}
                size={28}
                style={{ backgroundColor: '#fff' }}
              />
            ) : (
              <Feather
                name={activity.icon as any}
                size={16}
                color="#FFFFFF"
              />
            )}
          </View>
        </Marker>
      ))}
    </MapView>
  );

  return (
    <View style={[styles.container, { height }]}>
      {renderNativeMap()}

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

      <Pressable
        style={[styles.layerToggle, { backgroundColor: colors.card + 'E6' }]}
        onPress={toggleMapType}
      >
        <Feather
          name={mapType === 'standard' ? 'map' : 'layers'}
          size={16}
          color={mapType === 'standard' ? colors.text : colors.primary}
        />
        <ThemedText type="small" style={{ color: colors.text, marginLeft: 6, fontSize: 11, fontWeight: '600' }}>
          {mapType === 'standard' ? 'Mapa' : mapType === 'satellite' ? 'Satélite' : 'Híbrido'}
        </ThemedText>
      </Pressable>

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
  map: {
    width: '100%',
    height: '100%',
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
  layerToggle: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: '50%',
    transform: [{ translateX: -60 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
