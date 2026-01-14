import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, Modal, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { roadsKm140, km140Center } from '@/data/roads-km140';
import { getMapActivities } from '@/data/sampleData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExpandableMapWidgetProps {
  minimized?: boolean;
}

export function ExpandableMapWidget({ minimized = true }: ExpandableMapWidgetProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'map' | 'roads' | 'activities'>('map');
  const activities = getMapActivities();
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

  const mapUrl = useMemo(() => {
    const lat = km140Center.latitude;
    const lng = km140Center.longitude;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.15}%2C${lat - 0.1}%2C${lng + 0.15}%2C${lat + 0.1}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, []);

  const miniMapUrl = useMemo(() => {
    const lat = km140Center.latitude;
    const lng = km140Center.longitude;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.2}%2C${lat - 0.15}%2C${lng + 0.2}%2C${lat + 0.15}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, []);

  const jobActivities = activities.filter(a => a.type === 'job');
  const workerActivities = activities.filter(a => a.type === 'worker' || a.type === 'producer');

  const renderMiniMap = () => (
    <View style={styles.miniMapContainer}>
      <iframe
        src={miniMapUrl}
        style={{
          width: '100%',
          height: 120,
          border: 'none',
          borderRadius: BorderRadius.md,
        }}
        title="Mapa Rural Connect"
      />
      <View style={[styles.miniMapOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
        <Feather name="maximize-2" size={20} color="#FFFFFF" />
        <ThemedText type="small" style={{ color: '#FFFFFF', marginLeft: Spacing.xs }}>
          Toque para expandir
        </ThemedText>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.backgroundSecondary }]}>
      <Pressable
        style={[styles.tab, selectedTab === 'map' && { backgroundColor: colors.primary }]}
        onPress={() => setSelectedTab('map')}
      >
        <Feather name="map" size={16} color={selectedTab === 'map' ? '#FFFFFF' : colors.textSecondary} />
        <ThemedText type="small" style={{ color: selectedTab === 'map' ? '#FFFFFF' : colors.textSecondary, marginLeft: 4 }}>
          Mapa
        </ThemedText>
      </Pressable>
      <Pressable
        style={[styles.tab, selectedTab === 'roads' && { backgroundColor: colors.primary }]}
        onPress={() => setSelectedTab('roads')}
      >
        <Feather name="navigation" size={16} color={selectedTab === 'roads' ? '#FFFFFF' : colors.textSecondary} />
        <ThemedText type="small" style={{ color: selectedTab === 'roads' ? '#FFFFFF' : colors.textSecondary, marginLeft: 4 }}>
          Estradas ({roadsKm140.length})
        </ThemedText>
      </Pressable>
      <Pressable
        style={[styles.tab, selectedTab === 'activities' && { backgroundColor: colors.primary }]}
        onPress={() => setSelectedTab('activities')}
      >
        <Feather name="activity" size={16} color={selectedTab === 'activities' ? '#FFFFFF' : colors.textSecondary} />
        <ThemedText type="small" style={{ color: selectedTab === 'activities' ? '#FFFFFF' : colors.textSecondary, marginLeft: 4 }}>
          Atividades ({activities.length})
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderMapTab = () => (
    <View style={styles.fullMapContainer}>
      <iframe
        src={mapUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Mapa Rural Connect - km 140"
      />
      <View style={[styles.mapLegend, { backgroundColor: colors.backgroundSecondary + 'E6' }]}>
        <ThemedText type="small" style={{ fontWeight: '700', marginBottom: Spacing.xs }}>
          km 140 - Vila Alvorada
        </ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          Uruara, Para
        </ThemedText>
      </View>
    </View>
  );

  const renderRoadsTab = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="git-branch" size={24} color={colors.primary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>{roadsKm140.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Estradas</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent + '15' }]}>
          <Feather name="map-pin" size={24} color={colors.accent} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>6</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Vicinais</ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Estradas Mapeadas</ThemedText>
      {roadsKm140.map(road => (
        <View key={road.id} style={[styles.roadCard, { backgroundColor: colors.card }]}>
          <View style={[styles.roadIndicator, { backgroundColor: road.color || colors.primary }]} />
          <View style={styles.roadInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>{road.name}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {road.classification === 'principal' ? 'Rodovia Principal' : 'Ramal'}
            </ThemedText>
          </View>
          <View style={[styles.roadBadge, { backgroundColor: road.color + '20' || colors.primary + '20' }]}>
            <ThemedText type="small" style={{ color: road.color || colors.primary, fontWeight: '600' }}>
              {road.classification?.toUpperCase() || 'ESTRADA'}
            </ThemedText>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderActivitiesTab = () => (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="briefcase" size={24} color={colors.primary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>{jobActivities.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Trabalhos</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent + '15' }]}>
          <Feather name="users" size={24} color={colors.accent} />
          <ThemedText type="h3" style={{ marginTop: Spacing.xs }}>{workerActivities.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Prestadores</ThemedText>
        </View>
      </View>

      {jobActivities.length > 0 ? (
        <>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Demandas de Trabalho</ThemedText>
          {jobActivities.map(activity => (
            <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary }]}>
                <Feather name="briefcase" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.activityInfo}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{activity.title}</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  km 140 - Uruara/PA
                </ThemedText>
              </View>
            </View>
          ))}
        </>
      ) : null}

      {workerActivities.length > 0 ? (
        <>
          <ThemedText type="h4" style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}>Prestadores Disponiveis</ThemedText>
          {workerActivities.map(activity => (
            <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.accent }]}>
                <Feather name="user" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.activityInfo}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{activity.title}</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  km 140 - Uruara/PA
                </ThemedText>
              </View>
            </View>
          ))}
        </>
      ) : null}

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={colors.textSecondary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Nenhuma atividade no momento
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );

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
                {activities.length} atividades
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
            <ThemedText type="h4">Rural Connect</ThemedText>
            <Pressable onPress={() => setIsExpanded(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          {renderTabBar()}
          
          <View style={styles.tabContent}>
            {selectedTab === 'map' && renderMapTab()}
            {selectedTab === 'roads' && renderRoadsTab()}
            {selectedTab === 'activities' && renderActivitiesTab()}
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
  miniMapContainer: {
    height: 120,
    position: 'relative',
  },
  miniMapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tabContent: {
    flex: 1,
  },
  fullMapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapLegend: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
});
