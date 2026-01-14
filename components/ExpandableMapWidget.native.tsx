import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { roadsKm140, km140Center } from '@/data/roads-km140';
import { getMapActivities } from '@/data/sampleData';

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Polyline = Maps.Polyline;
    Marker = Maps.Marker;
  } catch (e) {
    console.log('[ExpandableMapWidget] react-native-maps not available');
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExpandableMapWidgetProps {
  minimized?: boolean;
}

export function ExpandableMapWidget({ minimized = true }: ExpandableMapWidgetProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const activities = getMapActivities();
  const mapRef = useRef<any>(null);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    setIsExpanded(true);
  };

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

  const renderMiniMap = () => {
    if (!MapView || Platform.OS === 'web') {
      return (
        <View style={[styles.miniMapFallback, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="map" size={32} color={colors.primary} />
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
            km 140 - Uruara/PA
          </ThemedText>
        </View>
      );
    }

    return (
      <MapView
        style={styles.miniMap}
        initialRegion={{
          latitude: km140Center.latitude,
          longitude: km140Center.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        mapType="hybrid"
      >
        {roadsKm140.slice(0, 5).map(road => (
          <Polyline
            key={road.id}
            coordinates={road.coordinates.map(c => ({ latitude: c[0], longitude: c[1] }))}
            strokeColor={road.color || colors.primary}
            strokeWidth={2}
          />
        ))}
      </MapView>
    );
  };

  const renderFullMap = () => {
    if (!MapView || Platform.OS === 'web') {
      return (
        <View style={[styles.fullMapFallback, { backgroundColor: colors.backgroundDefault }]}>
          <Feather name="map" size={64} color={colors.primary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>Mapa da Regiao</ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
            km 140 - Vila Alvorada, Uruara/PA
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            {roadsKm140.length} estradas mapeadas
          </ThemedText>
          <View style={styles.roadList}>
            {roadsKm140.slice(0, 6).map(road => (
              <View key={road.id} style={styles.roadItem}>
                <View style={[styles.roadDot, { backgroundColor: road.color || colors.primary }]} />
                <ThemedText type="small" numberOfLines={1}>{road.name}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.fullMap}
        initialRegion={{
          latitude: km140Center.latitude,
          longitude: km140Center.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        mapType="hybrid"
      >
        {roadsKm140.map(road => (
          <Polyline
            key={road.id}
            coordinates={road.coordinates.map(c => ({ latitude: c[0], longitude: c[1] }))}
            strokeColor={road.color || colors.primary}
            strokeWidth={3}
            lineDashPattern={road.classification === 'ramal' ? [5, 5] : undefined}
          />
        ))}
        {activities.map(activity => (
          <Marker
            key={activity.id}
            coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
            title={activity.title}
          >
            <View style={[styles.markerContainer, { backgroundColor: activity.type === 'job' ? colors.primary : colors.accent }]}>
              <Feather name={activity.type === 'job' ? 'briefcase' : 'user'} size={14} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
        <Marker
          coordinate={{ latitude: km140Center.latitude, longitude: km140Center.longitude }}
          title="km 140 - Vila Alvorada"
          description="Uruara, Para"
        />
      </MapView>
    );
  };

  return (
    <>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={handlePress} style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs, fontWeight: '600' }}>
                Mapa da Regiao
              </ThemedText>
            </View>
            <View style={styles.headerRight}>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {roadsKm140.length} estradas
              </ThemedText>
              <Feather name="maximize-2" size={14} color={colors.textSecondary} style={{ marginLeft: Spacing.xs }} />
            </View>
          </View>
          {renderMiniMap()}
        </Pressable>
      </Animated.View>

      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.backgroundDefault }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.sm }]}>
            <ThemedText type="h4">Mapa Rural - km 140</ThemedText>
            <Pressable onPress={() => setIsExpanded(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.mapContainer}>
            {renderFullMap()}
          </View>

          <View style={[styles.mapControls, { bottom: insets.bottom + Spacing.lg }]}>
            <Pressable
              style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={centerOnLocation}
            >
              <Feather name="crosshair" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.legend, { backgroundColor: colors.backgroundSecondary + 'E6' }]}>
            <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Legenda</ThemedText>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: '#ef4444' }]} />
              <ThemedText type="small">BR-230 Transamazonica</ThemedText>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: '#22c55e' }]} />
              <ThemedText type="small">Vicinais</ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMap: {
    height: 120,
    width: '100%',
  },
  miniMapFallback: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  mapContainer: {
    flex: 1,
  },
  fullMap: {
    flex: 1,
  },
  fullMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  roadList: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 300,
  },
  roadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  roadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  mapControls: {
    position: 'absolute',
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  legend: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginRight: Spacing.sm,
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
