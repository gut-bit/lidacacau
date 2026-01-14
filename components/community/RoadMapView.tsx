import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { roadsKm140, km140Center, RoadSegment } from '@/data/roads-km140';

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
} catch (e) {
  console.log('[RoadMapView] react-native-maps not available');
}

interface RoadMapViewProps {
  roads?: RoadSegment[];
  occurrences?: Array<{
    id: string;
    titulo: string;
    tipo: string;
    latitude: number;
    longitude: number;
  }>;
  selectedRoad?: string | null;
  onRoadPress?: (roadId: string) => void;
  onOccurrencePress?: (occurrenceId: string) => void;
}

const occurrenceColors: Record<string, string> = {
  electrical: '#eab308',
  road: '#f97316',
  bridge: '#ef4444',
  social: '#8b5cf6',
  theft: '#dc2626',
  other: '#6b7280',
};

export function RoadMapView({
  roads = roadsKm140,
  occurrences = [],
  selectedRoad,
  onRoadPress,
  onOccurrencePress,
}: RoadMapViewProps) {
  const { isDark, theme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const centerOnLocation = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: km140Center.latitude,
        longitude: km140Center.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }, 500);
    }
  };

  if (!MapView || Platform.OS === 'web') {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Feather name="map" size={48} color={colors.textSecondary} />
        <ThemedText type="h4" style={{ marginTop: Spacing.md, textAlign: 'center' }}>
          Mapa de Estradas
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
          km 140 - Vila Alvorada, Uruara/PA
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' }}>
          {roads.length} estradas mapeadas
        </ThemedText>
        
        <View style={styles.roadLegend}>
          {roads.slice(0, 4).map(road => (
            <View key={road.id} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: road.color || colors.primary }]} />
              <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
                {road.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: km140Center.latitude,
          longitude: km140Center.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onMapReady={() => setMapReady(true)}
        mapType="hybrid"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        {mapReady && roads.map(road => (
          <Polyline
            key={road.id}
            coordinates={road.coordinates.map(([lat, lng]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor={selectedRoad === road.id ? '#ffffff' : (road.color || '#2563eb')}
            strokeWidth={selectedRoad === road.id ? 6 : (road.classification === 'principal' ? 4 : 3)}
            lineDashPattern={road.classification === 'ramal' ? undefined : undefined}
            tappable
            onPress={() => onRoadPress?.(road.id)}
          />
        ))}
        
        {mapReady && occurrences.map(occurrence => (
          <Marker
            key={occurrence.id}
            coordinate={{
              latitude: occurrence.latitude,
              longitude: occurrence.longitude,
            }}
            title={occurrence.titulo}
            pinColor={occurrenceColors[occurrence.tipo] || '#6b7280'}
            onPress={() => onOccurrencePress?.(occurrence.id)}
          />
        ))}
      </MapView>

      <View style={styles.controls}>
        <Pressable
          style={[styles.controlButton, { backgroundColor: colors.backgroundDefault }]}
          onPress={centerOnLocation}
        >
          <Feather name="navigation" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.legend, { backgroundColor: colors.backgroundDefault + 'E6' }]}>
        <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>
          Legenda
        </ThemedText>
        <View style={styles.legendRow}>
          <View style={[styles.legendLine, { backgroundColor: '#dc2626' }]} />
          <ThemedText type="small">BR-230</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendLine, { backgroundColor: '#2563eb' }]} />
          <ThemedText type="small">Vicinais</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendLine, { backgroundColor: '#16a34a' }]} />
          <ThemedText type="small">Ramais</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  fallbackContainer: {
    minHeight: 250,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadLegend: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 4,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  controls: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    gap: Spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  legend: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginRight: Spacing.xs,
  },
});

export default RoadMapView;
