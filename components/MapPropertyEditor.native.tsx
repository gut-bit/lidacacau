import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, MapPressEvent, LatLng, LongPressEvent } from 'react-native-maps';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';
import { GeoCoordinate, PolygonGeometry, calculatePolygonArea, VILA_ALVORADA_KM140 } from '@/types';
import { Spacing, BorderRadius } from '@/constants/theme';

type EditorMode = 'view' | 'draw' | 'edit';

interface MapPropertyEditorProps {
  initialPolygon?: PolygonGeometry;
  initialCenter?: { latitude: number; longitude: number };
  onPolygonChange: (polygon: PolygonGeometry | undefined) => void;
  mode: EditorMode;
  height?: number;
  showAreaCalculation?: boolean;
}

const PRIMARY_COLOR = '#F15A29';
const PRIMARY_LIGHT = '#FF7B4D';
const POLYGON_FILL = 'rgba(241, 90, 41, 0.25)';
const POLYGON_STROKE = '#F15A29';
const VERTEX_COLOR = '#F15A29';
const VERTEX_SELECTED = '#FF7B4D';

export function MapPropertyEditor({
  initialPolygon,
  initialCenter,
  onPolygonChange,
  mode: initialMode,
  height = 400,
  showAreaCalculation = true,
}: MapPropertyEditorProps) {
  const { theme: colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [currentMode, setCurrentMode] = useState<EditorMode>(initialMode);
  const [vertices, setVertices] = useState<GeoCoordinate[]>(initialPolygon?.coordinates || []);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<GeoCoordinate | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const lastTapTimeRef = useRef<{ [key: number]: number }>({});

  const centerLocation = initialCenter || {
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

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialPolygon?.coordinates) {
      setVertices(initialPolygon.coordinates);
    }
  }, [initialPolygon]);

  const calculateDelta = useCallback((coords: GeoCoordinate[]) => {
    if (coords.length === 0) return { latDelta: 0.01, lngDelta: 0.01 };
    
    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return {
      latDelta: Math.max((maxLat - minLat) * 1.5, 0.005),
      lngDelta: Math.max((maxLng - minLng) * 1.5, 0.005),
    };
  }, []);

  const centerOnPolygon = useCallback(() => {
    if (vertices.length === 0 || !mapRef.current) return;
    
    const lats = vertices.map(v => v.latitude);
    const lngs = vertices.map(v => v.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const { latDelta, lngDelta } = calculateDelta(vertices);
    
    mapRef.current.animateToRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    }, 500);
  }, [vertices, calculateDelta]);

  const centerOnUserLocation = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    
    mapRef.current.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, [userLocation]);

  const updatePolygon = useCallback((newVertices: GeoCoordinate[]) => {
    setVertices(newVertices);
    
    if (newVertices.length >= 3) {
      const area = calculatePolygonArea(newVertices);
      onPolygonChange({
        coordinates: newVertices,
        areaHectares: area,
      });
    } else {
      onPolygonChange(undefined);
    }
  }, [onPolygonChange]);

  const handleMapPress = useCallback((event: MapPressEvent) => {
    if (currentMode !== 'draw') return;
    
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newVertex: GeoCoordinate = { latitude, longitude };
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newVertices = [...vertices, newVertex];
    updatePolygon(newVertices);
  }, [currentMode, vertices, updatePolygon]);

  const handleMapLongPress = useCallback((event: LongPressEvent) => {
    if (currentMode !== 'draw') return;
    
    if (vertices.length >= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentMode('view');
    }
  }, [currentMode, vertices.length]);

  const handleVertexPress = useCallback((index: number) => {
    if (currentMode !== 'edit') return;
    
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[index] || 0;
    
    if (now - lastTap < 300) {
      if (vertices.length > 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newVertices = vertices.filter((_, i) => i !== index);
        updatePolygon(newVertices);
        setSelectedVertexIndex(null);
      }
    } else {
      setSelectedVertexIndex(selectedVertexIndex === index ? null : index);
    }
    
    lastTapTimeRef.current[index] = now;
  }, [currentMode, vertices, selectedVertexIndex, updatePolygon]);

  const handleVertexDrag = useCallback((index: number, coordinate: LatLng) => {
    if (currentMode !== 'edit') return;
    
    const newVertices = [...vertices];
    newVertices[index] = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    updatePolygon(newVertices);
  }, [currentMode, vertices, updatePolygon]);

  const handleUndo = useCallback(() => {
    if (vertices.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVertices = vertices.slice(0, -1);
    updatePolygon(newVertices);
  }, [vertices, updatePolygon]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVertices([]);
    onPolygonChange(undefined);
  }, [onPolygonChange]);

  const handleConfirm = useCallback(() => {
    if (vertices.length >= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentMode('view');
    }
  }, [vertices.length]);

  const calculatedArea = vertices.length >= 3 ? calculatePolygonArea(vertices) : 0;

  const getModeInstructions = () => {
    switch (currentMode) {
      case 'draw':
        return 'Toque no mapa para adicionar pontos. Pressione longo para finalizar.';
      case 'edit':
        return 'Arraste os pontos para ajustar. Toque duplo para remover.';
      case 'view':
      default:
        return 'Visualizando area demarcada.';
    }
  };

  const getModeLabel = (mode: EditorMode) => {
    switch (mode) {
      case 'view': return 'Visualizar';
      case 'draw': return 'Desenhar';
      case 'edit': return 'Editar';
    }
  };

  const initialRegion = {
    latitude: vertices.length > 0 
      ? vertices.reduce((sum, v) => sum + v.latitude, 0) / vertices.length
      : centerLocation.latitude,
    longitude: vertices.length > 0
      ? vertices.reduce((sum, v) => sum + v.longitude, 0) / vertices.length
      : centerLocation.longitude,
    latitudeDelta: vertices.length > 0 ? calculateDelta(vertices).latDelta : 0.01,
    longitudeDelta: vertices.length > 0 ? calculateDelta(vertices).lngDelta : 0.01,
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        onLongPress={handleMapLongPress}
        mapType="standard"
      >
        {vertices.length >= 3 ? (
          <Polygon
            coordinates={vertices.map(v => ({ latitude: v.latitude, longitude: v.longitude }))}
            strokeColor={POLYGON_STROKE}
            fillColor={POLYGON_FILL}
            strokeWidth={2}
          />
        ) : null}

        {(currentMode === 'draw' || currentMode === 'edit') ? vertices.map((vertex, index) => (
          <Marker
            key={`vertex-${index}`}
            coordinate={{ latitude: vertex.latitude, longitude: vertex.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            draggable={currentMode === 'edit'}
            onPress={() => handleVertexPress(index)}
            onDragEnd={(e) => handleVertexDrag(index, e.nativeEvent.coordinate)}
          >
            <View style={[
              styles.vertexMarker,
              { 
                backgroundColor: selectedVertexIndex === index ? VERTEX_SELECTED : VERTEX_COLOR,
                borderColor: '#FFFFFF',
              }
            ]}>
              <ThemedText style={styles.vertexNumber}>{index + 1}</ThemedText>
            </View>
          </Marker>
        )) : null}
      </MapView>

      <View style={[styles.modeSelector, { backgroundColor: colors.card + 'F0' }]}>
        {(['view', 'draw', 'edit'] as EditorMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.modeButton,
              { 
                backgroundColor: currentMode === mode ? PRIMARY_COLOR : 'transparent',
                borderColor: currentMode === mode ? PRIMARY_COLOR : colors.border,
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentMode(mode);
            }}
          >
            <Feather 
              name={mode === 'view' ? 'eye' : mode === 'draw' ? 'edit-2' : 'move'}
              size={14}
              color={currentMode === mode ? '#FFFFFF' : colors.text}
            />
            <ThemedText 
              style={[
                styles.modeButtonText,
                { color: currentMode === mode ? '#FFFFFF' : colors.text }
              ]}
            >
              {getModeLabel(mode)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.instructionsBadge, { backgroundColor: colors.card + 'F0' }]}>
        <Feather name="info" size={14} color={colors.textSecondary} />
        <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: 6, flex: 1 }}>
          {getModeInstructions()}
        </ThemedText>
      </View>

      {showAreaCalculation && calculatedArea > 0 ? (
        <View style={[styles.areaBadge, { backgroundColor: PRIMARY_COLOR }]}>
          <Feather name="maximize" size={14} color="#FFFFFF" />
          <ThemedText style={styles.areaText}>
            {calculatedArea.toFixed(2)} ha
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.locationButtons, { backgroundColor: colors.card + 'F0' }]}>
        {vertices.length > 0 ? (
          <Pressable
            style={[styles.locationButton, { borderColor: colors.border }]}
            onPress={centerOnPolygon}
          >
            <Feather name="maximize-2" size={18} color={colors.text} />
          </Pressable>
        ) : null}
        {userLocation ? (
          <Pressable
            style={[styles.locationButton, { borderColor: colors.border }]}
            onPress={centerOnUserLocation}
          >
            <Feather name="navigation" size={18} color={PRIMARY_COLOR} />
          </Pressable>
        ) : null}
      </View>

      {(currentMode === 'draw' || currentMode === 'edit') ? (
        <View style={[styles.actionBar, { backgroundColor: colors.card + 'F0' }]}>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={handleUndo}
            disabled={vertices.length === 0}
          >
            <Feather 
              name="corner-up-left" 
              size={18} 
              color={vertices.length === 0 ? colors.textSecondary : colors.text} 
            />
            <ThemedText 
              type="small"
              style={{ 
                color: vertices.length === 0 ? colors.textSecondary : colors.text,
                marginLeft: 6,
              }}
            >
              Desfazer
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={handleClear}
            disabled={vertices.length === 0}
          >
            <Feather 
              name="trash-2" 
              size={18} 
              color={vertices.length === 0 ? colors.textSecondary : colors.error} 
            />
            <ThemedText 
              type="small"
              style={{ 
                color: vertices.length === 0 ? colors.textSecondary : colors.error,
                marginLeft: 6,
              }}
            >
              Limpar
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton, 
              { 
                backgroundColor: vertices.length >= 3 ? PRIMARY_COLOR : 'transparent',
                borderColor: vertices.length >= 3 ? PRIMARY_COLOR : colors.border,
              }
            ]}
            onPress={handleConfirm}
            disabled={vertices.length < 3}
          >
            <Feather 
              name="check" 
              size={18} 
              color={vertices.length >= 3 ? '#FFFFFF' : colors.textSecondary} 
            />
            <ThemedText 
              type="small"
              style={{ 
                color: vertices.length >= 3 ? '#FFFFFF' : colors.textSecondary,
                marginLeft: 6,
                fontWeight: '600',
              }}
            >
              Confirmar
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {currentMode === 'draw' ? (
        <View style={[styles.vertexCounter, { backgroundColor: colors.card + 'F0' }]}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Pontos: {vertices.length} {vertices.length < 3 ? `(min. 3)` : ''}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  modeSelector: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: 4,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsBadge: {
    position: 'absolute',
    top: 56,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  areaBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: 6,
  },
  areaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  locationButtons: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'column',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  locationButton: {
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionBar: {
    position: 'absolute',
    bottom: 56,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  vertexMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
  vertexNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  vertexCounter: {
    position: 'absolute',
    bottom: 112,
    left: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
