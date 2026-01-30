import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { Avatar } from '@/components/Avatar';
import { roadsKm140, km140Center, occurrenceTypes, Road } from '@/data/roads-km140';

import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  try {
    const isProduction = !__DEV__;

    if (isProduction) {
      return 'https://lidacacau.com';
    }

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      return `${protocol}//${hostname}:5000`;
    }

    const expoHostUri = Constants.expoConfig?.hostUri;
    if (expoHostUri) {
      const host = expoHostUri.split(':')[0];
      return `http://${host}:5000`;
    }

    return '';
  } catch {
    return '';
  }
}

interface Occurrence {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

interface Vicinal {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

const mockOccurrences: Occurrence[] = [
  {
    id: '1',
    titulo: 'Buraco na estrada principal',
    tipo: 'road',
    status: 'open',
    latitude: -3.6947,
    longitude: -53.6761,
    createdAt: new Date().toISOString(),
    userName: 'Joao Silva',
  },
  {
    id: '2',
    titulo: 'Poste caido na vicinal',
    tipo: 'electrical',
    status: 'in_progress',
    latitude: -3.6850,
    longitude: -53.6765,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    userName: 'Maria Santos',
  },
  {
    id: '3',
    titulo: 'Ponte danificada no km 138',
    tipo: 'bridge',
    status: 'open',
    latitude: -3.6800,
    longitude: -53.6980,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    userName: 'Pedro Oliveira',
  },
];

export default function CommunityHomeScreen() {
  const { isDark, theme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [occurrences, setOccurrences] = useState<Occurrence[]>(mockOccurrences);
  const [roads, setRoads] = useState<Road[]>(roadsKm140);
  const [vicinais, setVicinais] = useState<Vicinal[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();

      const [roadsRes, vicinaisRes, occurrencesRes] = await Promise.all([
        fetch(`${baseUrl}/api/community/roads`).catch(() => null),
        fetch(`${baseUrl}/api/community/vicinais`).catch(() => null),
        fetch(`${baseUrl}/api/community/occurrences`).catch(() => null),
      ]);

      if (roadsRes?.ok) {
        const roadsData = await roadsRes.json();
        if (roadsData.length > 0) {
          const mappedRoads: Road[] = roadsData.map((r: any) => ({
            id: r.id,
            name: r.nome,
            classification: r.classification,
            coordinates: r.coordinates || [],
            color: r.color || '#2563eb',
          }));
          setRoads(mappedRoads);
        }
      }

      if (vicinaisRes?.ok) {
        const vicinaisData = await vicinaisRes.json();
        setVicinais(vicinaisData);
      }

      if (occurrencesRes?.ok) {
        const occurrencesData = await occurrencesRes.json();
        if (occurrencesData.length > 0) {
          setOccurrences(occurrencesData);
        }
      }
    } catch (error) {
      console.log('[Community] Using local data - API not available');
    } finally {
      setLoading(false);
    }
  };

  const getOccurrenceType = (tipo: string) => {
    return occurrenceTypes.find(t => t.id === tipo) || occurrenceTypes[5];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'in_progress': return '#eab308';
      case 'resolved': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em andamento';
      case 'resolved': return 'Resolvido';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atras`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
    return date.toLocaleDateString('pt-BR');
  };

  const openMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${km140Center.latitude},${km140Center.longitude}`,
      android: `geo:${km140Center.latitude},${km140Center.longitude}?q=${km140Center.latitude},${km140Center.longitude}(km 140)`,
      default: `https://www.google.com/maps?q=${km140Center.latitude},${km140Center.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <ScreenScrollView>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <Feather name="users" size={28} color={colors.primary} />
          <ThemedText type="h2" style={styles.headerTitle}>Comunidade</ThemedText>
        </View>
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
          km 140 - Vila Alvorada, Uruara/PA
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="map" size={24} color={colors.primary} />
          <ThemedText type="h4" style={styles.statValue}>{roads.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Estradas</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="alert-circle" size={24} color="#ef4444" />
          <ThemedText type="h4" style={styles.statValue}>
            {occurrences.filter(o => o.status === 'open').length}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Ocorrencias</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="check-circle" size={24} color="#16a34a" />
          <ThemedText type="h4" style={styles.statValue}>
            {occurrences.filter(o => o.status === 'resolved').length}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Resolvidas</ThemedText>
        </View>
      </View>

      <Pressable
        style={[styles.mapButton, { backgroundColor: colors.primary }]}
        onPress={openMaps}
      >
        <Feather name="map-pin" size={20} color="#fff" />
        <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>
          Ver no Mapa
        </ThemedText>
      </Pressable>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Estradas da Regiao</ThemedText>
        {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: Spacing.md }} />}
        {roads.slice(0, 5).map(road => (
          <Pressable
            key={road.id}
            style={[
              styles.roadItem,
              {
                backgroundColor: colors.backgroundSecondary,
                borderLeftColor: road.color || colors.primary,
              }
            ]}
            onPress={() => setSelectedRoad(selectedRoad === road.id ? null : road.id)}
          >
            <View style={styles.roadHeader}>
              <View style={[styles.roadBadge, { backgroundColor: road.color || colors.primary }]}>
                <Feather
                  name={road.classification === 'principal' ? 'trending-up' : 'git-branch'}
                  size={14}
                  color="#fff"
                />
              </View>
              <View style={styles.roadInfo}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{road.name}</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {road.classification === 'principal' ? 'Rodovia Principal' : 'Vicinal/Ramal'}
                </ThemedText>
              </View>
              <Feather
                name={selectedRoad === road.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </View>
            {selectedRoad === road.id && (
              <View style={styles.roadDetails}>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {road.coordinates.length} pontos mapeados
                </ThemedText>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4" style={styles.sectionTitle}>Ocorrencias Recentes</ThemedText>
          <Pressable style={styles.seeAllButton}>
            <ThemedText type="small" style={{ color: colors.primary }}>Ver todas</ThemedText>
          </Pressable>
        </View>

        {occurrences.map(occurrence => {
          const type = getOccurrenceType(occurrence.tipo);
          return (
            <View key={occurrence.id} style={[styles.occurrenceCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.occurrenceHeader}>
                <Avatar
                  uri={occurrence.userAvatar}
                  name={occurrence.userName || 'Usuario'}
                  size={40}
                  style={{ marginRight: Spacing.md }}
                  borderColor={type.color}
                  borderWidth={2}
                />
                <View style={styles.occurrenceInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{occurrence.titulo}</ThemedText>
                  <View style={styles.occurrenceMeta}>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {occurrence.userName} - {formatDate(occurrence.createdAt)}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(occurrence.status) + '20' }]}>
                  <ThemedText
                    type="small"
                    style={{ color: getStatusColor(occurrence.status), fontWeight: '600', fontSize: 10 }}
                  >
                    {getStatusLabel(occurrence.status)}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Acoes Rapidas</ThemedText>
        <View style={styles.actionsGrid}>
          <Pressable style={[styles.actionButton, { backgroundColor: '#ef444420' }]}>
            <Feather name="alert-circle" size={24} color="#ef4444" />
            <ThemedText type="small" style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
              Reportar Ocorrencia
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: '#8b5cf620' }]}>
            <Feather name="file-text" size={24} color="#8b5cf6" />
            <ThemedText type="small" style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
              Criar Peticao
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: '#0891b220' }]}>
            <Feather name="map" size={24} color="#0891b2" />
            <ThemedText type="small" style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
              Mapear Estrada
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: '#eab30820' }]}>
            <Feather name="alert-triangle" size={24} color="#eab308" />
            <ThemedText type="small" style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
              Alerta Fiscal
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    marginTop: Spacing.xs,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  seeAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  roadItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  roadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  roadInfo: {
    flex: 1,
  },
  roadDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  occurrenceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  occurrenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  occurrenceInfo: {
    flex: 1,
  },
  occurrenceMeta: {
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
});
