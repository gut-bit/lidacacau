import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { roadsKm140, km140Center } from '@/data/roads-km140';
import { getMapActivities } from '@/data/sampleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExpandableMapWidgetProps {
  minimized?: boolean;
}

export function ExpandableMapWidget({ minimized = true }: ExpandableMapWidgetProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
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

  const renderMiniMap = () => (
    <View style={[styles.miniMapFallback, { backgroundColor: colors.backgroundSecondary }]}>
      <Feather name="map" size={32} color={colors.primary} />
      <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
        km 140 - Uruara/PA
      </ThemedText>
    </View>
  );

  const renderFullMap = () => (
    <View style={[styles.fullMapFallback, { backgroundColor: colors.backgroundDefault }]}>
      <View style={styles.webMapContainer}>
        {/* Placeholder for Interactive Web Map */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="map" size={48} color={colors.primary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md }}>Visualizacao Rural Connect</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
            Visualizando regiao do km 140 Vila Alvorada
          </ThemedText>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h2">{roadsKm140.length}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>Estradas</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h2">{activities.filter(a => a.type === 'job').length}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>Trabalhos</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h2">{activities.filter(a => a.type === 'worker').length}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>Prestadores</ThemedText>
          </View>
        </View>

        <View style={styles.roadList}>
          <ThemedText type="body" style={{ fontWeight: '700', marginBottom: Spacing.sm }}>Estradas Principais</ThemedText>
          {roadsKm140.slice(0, 6).map(road => (
            <View key={road.id} style={styles.roadItem}>
              <View style={[styles.roadDot, { backgroundColor: road.color || colors.primary }]} />
              <ThemedText type="small" numberOfLines={1}>{road.name}</ThemedText>
            </View>
          ))}
        </View>
        
        <View style={styles.legend}>
          <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.xs }}>Legenda de Atividades</ThemedText>
          <View style={styles.legendRow}>
            <View style={[styles.markerDot, { backgroundColor: colors.primary }]} />
            <ThemedText type="small">Demandas de Trabalho</ThemedText>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.markerDot, { backgroundColor: colors.accent }]} />
            <ThemedText type="small">Prestadores Disponiveis</ThemedText>
          </View>
        </View>
      </View>
    </View>
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
            <ThemedText type="h4">Rural Connect: Mapa de Integracao</ThemedText>
            <Pressable onPress={() => setIsExpanded(false)} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.mapContainer}>
            {renderFullMap()}
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
  fullMapFallback: {
    flex: 1,
  },
  webMapContainer: {
    height: 250,
    width: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  roadList: {
    width: '100%',
    marginBottom: Spacing.xl,
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
  legend: {
    marginTop: 'auto',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
});
