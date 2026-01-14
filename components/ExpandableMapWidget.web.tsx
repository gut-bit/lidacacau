import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { roadsKm140, km140Center } from '@/data/roads-km140';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExpandableMapWidgetProps {
  minimized?: boolean;
}

export function ExpandableMapWidget({ minimized = true }: ExpandableMapWidgetProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
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
      <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.lg, fontStyle: 'italic' }}>
        Mapa interativo disponivel no app mobile
      </ThemedText>
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
});
