import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Platform, Modal, Dimensions, ScrollView } from 'react-native';
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
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid' | 'terrain'>('hybrid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'jobs' | 'workers' | 'roads' | 'vicinais'>('all');
  const [showMapTypeMenu, setShowMapTypeMenu] = useState(false);
  const activities = getMapActivities();
  const mapRef = useRef<any>(null);
  const scale = useSharedValue(1);

  const jobCount = activities.filter(a => a.type === 'job').length;
  const workerCount = activities.filter(a => a.type === 'worker' || a.type === 'producer').length;
  const roadCount = roadsKm140.length;
  const vicinalCount = roadsKm140.filter(r => r.classification === 'ramal').length;

  const filteredActivities = activities.filter(a => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'jobs') return a.type === 'job';
    if (activeFilter === 'workers') return a.type === 'worker' || a.type === 'producer';
    if (activeFilter === 'roads' || activeFilter === 'vicinais') return false;
    return true;
  });

  const filteredRoads = roadsKm140.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'roads') return true;
    if (activeFilter === 'vicinais') return r.classification === 'ramal';
    return false;
  });

  const mapTypeLabels: Record<string, string> = {
    standard: 'Padrao',
    satellite: 'Satelite',
    hybrid: 'Hibrido',
    terrain: 'Terreno',
  };

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
        mapType={mapType}
      >
        {filteredRoads.map(road => (
          <Polyline
            key={road.id}
            coordinates={road.coordinates.map(c => ({ latitude: c[0], longitude: c[1] }))}
            strokeColor={road.color || colors.primary}
            strokeWidth={3}
            lineDashPattern={road.classification === 'ramal' ? [5, 5] : undefined}
          />
        ))}
        {filteredActivities.map(activity => (
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

  const renderRoadsList = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="navigation" size={24} color={colors.primary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>{roadsKm140.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Estradas</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent + '15' }]}>
          <Feather name="git-branch" size={24} color={colors.accent} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>{vicinalCount}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Vicinais</ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Estradas Mapeadas</ThemedText>
      {roadsKm140.map(road => (
        <Pressable 
          key={road.id} 
          style={[styles.roadCard, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => {
            if (mapRef.current) {
              const midPoint = road.coordinates[Math.floor(road.coordinates.length / 2)];
              mapRef.current.animateToRegion({
                latitude: midPoint[0],
                longitude: midPoint[1],
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 1000);
              // Switch to map tab? We don't have tabs here yet, but let's keep it clean
            }
          }}
        >
          <View style={[styles.roadIndicator, { backgroundColor: road.color || colors.primary }]} />
          <View style={styles.roadInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>{road.name}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {road.classification === 'principal' ? 'Rodovia Principal' : 'Ramal/Vicinal'}
            </ThemedText>
          </View>
          <View style={[styles.roadBadge, { backgroundColor: (road.color || colors.primary) + '20' }]}>
            <ThemedText type="small" style={{ color: road.color || colors.primary, fontWeight: '700', fontSize: 10 }}>
              {road.classification?.toUpperCase() || 'ESTRADA'}
            </ThemedText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const [activeTab, setActiveTab] = useState<'map' | 'roads'>('map');

  return (
    <>
      <Animated.View style={animatedStyle}>
        <Pressable onPress={handlePress} style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs, fontWeight: '600' }}>
                Rural Connect - km 140
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
            <View style={styles.tabContainer}>
              <Pressable 
                onPress={() => setActiveTab('map')}
                style={[styles.tabItem, activeTab === 'map' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <ThemedText style={{ color: activeTab === 'map' ? colors.primary : colors.textSecondary, fontWeight: '600' }}>Mapa</ThemedText>
              </Pressable>
              <Pressable 
                onPress={() => setActiveTab('roads')}
                style={[styles.tabItem, activeTab === 'roads' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <ThemedText style={{ color: activeTab === 'roads' ? colors.primary : colors.textSecondary, fontWeight: '600' }}>Estradas</ThemedText>
              </Pressable>
            </View>
            <Pressable onPress={() => setIsExpanded(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.mapContainer}>
            {activeTab === 'map' ? (
              <>
                {renderFullMap()}
                <View style={[styles.filterBar, { top: 10 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {[
                      { id: 'all', label: 'Tudo', icon: 'grid', count: null },
                      { id: 'jobs', label: 'Vagas', icon: 'briefcase', count: jobCount },
                      { id: 'workers', label: 'Gente', icon: 'users', count: workerCount },
                      { id: 'roads', label: 'Estradas', icon: 'navigation', count: roadCount },
                      { id: 'vicinais', label: 'Vicinais', icon: 'git-branch', count: vicinalCount }
                    ].map(filter => (
                      <Pressable
                        key={filter.id}
                        onPress={() => setActiveFilter(filter.id as any)}
                        style={[
                          styles.filterChip,
                          { backgroundColor: activeFilter === filter.id ? colors.primary : colors.backgroundSecondary }
                        ]}
                      >
                        <Feather name={filter.icon as any} size={14} color={activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary} />
                        <ThemedText type="small" style={{ color: activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary, marginLeft: 6 }}>
                          {filter.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </>
            ) : renderRoadsList()}
          </View>

          {activeTab === 'map' && (
            <>
              <View style={[styles.mapControls, { bottom: insets.bottom + Spacing.lg }]}>
                <Pressable
                  style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setShowMapTypeMenu(!showMapTypeMenu)}
                >
                  <Feather name="layers" size={20} color={colors.text} />
                </Pressable>
                <Pressable
                  style={[styles.controlButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={centerOnLocation}
                >
                  <Feather name="crosshair" size={20} color={colors.text} />
                </Pressable>
              </View>

              {showMapTypeMenu && (
                <View style={[styles.mapTypeMenu, { backgroundColor: colors.backgroundSecondary, bottom: insets.bottom + Spacing.lg + 110 }]}>
                  <ThemedText type="small" style={{ fontWeight: '700', marginBottom: Spacing.sm }}>Tipo de Mapa</ThemedText>
                  {(['standard', 'satellite', 'hybrid', 'terrain'] as const).map(type => (
                    <Pressable
                      key={type}
                      style={[
                        styles.mapTypeOption,
                        mapType === type && { backgroundColor: colors.primary + '20' }
                      ]}
                      onPress={() => {
                        setMapType(type);
                        setShowMapTypeMenu(false);
                      }}
                    >
                      <Feather 
                        name={type === 'standard' ? 'map' : type === 'satellite' ? 'globe' : type === 'hybrid' ? 'layers' : 'triangle'} 
                        size={16} 
                        color={mapType === type ? colors.primary : colors.textSecondary} 
                      />
                      <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: mapType === type ? colors.primary : colors.text, fontWeight: mapType === type ? '600' : '400' }}>
                        {mapTypeLabels[type]}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={[styles.legend, { backgroundColor: colors.backgroundSecondary + 'E6' }]}>
                <View style={styles.legendHeader}>
                  <ThemedText type="small" style={{ fontWeight: '700' }}>Legenda</ThemedText>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendLine, { backgroundColor: '#ef4444' }]} />
                  <ThemedText type="small">Rodovia Principal</ThemedText>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendLine, { backgroundColor: '#22c55e' }]} />
                  <ThemedText type="small">Ramais/Vicinais</ThemedText>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}
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
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
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
  markerLegend: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  mapTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
  filterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterCount: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  mapTypeMenu: {
    position: 'absolute',
    right: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
  },
  mapTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tabItem: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  roadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  roadIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  roadInfo: {
    flex: 1,
  },
  roadBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
