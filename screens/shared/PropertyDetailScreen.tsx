import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PropertyDetail, PropertyWithOwner, Talhao, TalhaoServiceTag, CROP_TYPES } from '@/types';
import { getPropertyById, deleteProperty } from '@/utils/storage';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { RootStackParamList } from '@/navigation/RootNavigator';

type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;

interface PropertyVerifiedBadgeProps {
  verified: boolean;
  size?: 'small' | 'medium' | 'large';
}

function PropertyVerifiedBadge({ verified, size = 'medium' }: PropertyVerifiedBadgeProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  if (!verified) return null;

  const iconSizes = { small: 14, medium: 16, large: 20 };
  const paddingSizes = { small: Spacing.xs, medium: Spacing.sm, large: Spacing.md };
  const iconSize = iconSizes[size];
  const padding = paddingSizes[size];

  return (
    <View style={[styles.verifiedBadge, { backgroundColor: colors.success, paddingHorizontal: padding, paddingVertical: Spacing.xs }]}>
      <Feather name="shield" size={iconSize} color="#FFFFFF" />
      <ThemedText type="small" style={styles.verifiedBadgeText}>
        Propriedade Verificada
      </ThemedText>
    </View>
  );
}

export default function PropertyDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PropertyDetailRouteProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const { propertyId } = route.params;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const loadProperty = useCallback(async () => {
    try {
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar a propriedade');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [loadProperty])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProperty();
  }, [loadProperty]);

  const handleEditProperty = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('PropertyForm', { propertyId });
  };

  const handleViewOnMap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      'Ver no Mapa',
      'A visualizacao da propriedade no mapa esta disponivel na tela de Gerenciamento de Talhoes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir para Talhoes', onPress: () => navigation.navigate('TalhaoManagement', { propertyId }) },
      ]
    );
  };

  const handleDocuments = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('PropertyDocuments', { propertyId });
  };

  const handleTalhoes = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('TalhaoManagement', { propertyId });
  };

  const handleDeleteProperty = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      'Excluir Propriedade',
      `Tem certeza que deseja excluir "${property?.name}"? Esta acao nao pode ser desfeita e todos os talhoes e documentos serao removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteProperty(propertyId);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Sucesso', 'Propriedade excluida com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error deleting property:', error);
      Alert.alert('Erro', 'Nao foi possivel excluir a propriedade');
    } finally {
      setDeleting(false);
    }
  };

  const toggleHistoryExpanded = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setHistoryExpanded(!historyExpanded);
  };

  const formatArea = (area?: number): string => {
    if (!area) return '0 ha';
    if (area < 1) return `${(area * 10000).toFixed(0)} m²`;
    return `${area.toFixed(2)} ha`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeTypeLabel = (changeType: string): string => {
    const labels: Record<string, string> = {
      create: 'Propriedade criada',
      update: 'Propriedade atualizada',
      verify: 'Verificacao realizada',
      polygon_update: 'Poligono atualizado',
    };
    return labels[changeType] || changeType;
  };

  const getCropTypeLabel = (cropType?: string): string => {
    if (!cropType) return 'Nao especificado';
    const crop = CROP_TYPES.find((c) => c.id === cropType);
    return crop?.label || cropType;
  };

  const getServiceTypeLabel = (serviceTypeId: string): string => {
    const service = SERVICE_TYPES.find((s) => s.id === serviceTypeId);
    return service?.name || serviceTypeId;
  };

  const getStats = () => {
    if (!property) return { talhaoCount: 0, totalTalhaoArea: 0, pendingServices: 0 };

    const talhaoCount = property.talhoes.length;
    const totalTalhaoArea = property.talhoes.reduce((sum, t) => sum + (t.areaHectares || 0), 0);
    const pendingServices = property.talhoes.reduce(
      (sum, t) => sum + t.serviceTags.filter((s) => s.status === 'pending').length,
      0
    );

    return { talhaoCount, totalTalhaoArea, pendingServices };
  };

  const getDocumentStats = () => {
    if (!property?.documents.length) {
      return { total: 0, verified: 0, pending: 0, rejected: 0 };
    }
    return {
      total: property.documents.length,
      verified: property.documents.filter((d) => d.verificationStatus === 'verified').length,
      pending: property.documents.filter((d) => d.verificationStatus === 'pending').length,
      rejected: property.documents.filter((d) => d.verificationStatus === 'rejected').length,
    };
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
          Carregando propriedade...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!property) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <ThemedText type="h4" style={{ color: colors.text, marginTop: Spacing.md }}>
          Propriedade nao encontrada
        </ThemedText>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <ThemedText type="link" style={{ color: colors.primary }}>
            Voltar
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const stats = getStats();
  const docStats = getDocumentStats();
  const recentTalhoes = property.talhoes.slice(0, 3);
  const recentHistory = (property.revisionHistory || []).slice(-5).reverse();
  const isVerified = property.verificationStatus === 'verified';

  return (
    <ScreenScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {property.coverPhoto ? (
        <View style={styles.coverPhotoContainer}>
          <Image source={{ uri: property.coverPhoto }} style={styles.coverPhoto} contentFit="cover" />
          {isVerified ? (
            <View style={styles.verifiedOverlay}>
              <PropertyVerifiedBadge verified={isVerified} size="medium" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.coverPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="map" size={48} color={colors.primary} />
          {isVerified ? (
            <View style={styles.verifiedOverlay}>
              <PropertyVerifiedBadge verified={isVerified} size="medium" />
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.headerSection}>
        <ThemedText type="h2" style={styles.propertyName}>
          {property.name}
        </ThemedText>

        {property.description ? (
          <ThemedText type="body" style={[styles.description, { color: colors.textSecondary }]}>
            {property.description}
          </ThemedText>
        ) : null}

        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color={colors.textSecondary} />
          <ThemedText type="body" style={[styles.infoText, { color: colors.textSecondary }]}>
            {property.address}
            {property.city ? `, ${property.city}` : ''}
            {property.state ? ` - ${property.state}` : ''}
          </ThemedText>
        </View>

        {property.areaHectares ? (
          <View style={styles.infoRow}>
            <Feather name="maximize" size={16} color={colors.textSecondary} />
            <ThemedText type="body" style={[styles.infoText, { color: colors.textSecondary }]}>
              {formatArea(property.areaHectares)}
            </ThemedText>
          </View>
        ) : null}

        {property.carNumber ? (
          <View style={styles.infoRow}>
            <Feather name="file-text" size={16} color={colors.textSecondary} />
            <ThemedText type="body" style={[styles.infoText, { color: colors.textSecondary }]}>
              CAR: {property.carNumber}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Acoes Rapidas
        </ThemedText>
        <View style={styles.actionButtonsGrid}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEditProperty}
          >
            <Feather name="edit-2" size={20} color="#FFFFFF" />
            <ThemedText type="small" style={styles.actionButtonText}>
              Editar Propriedade
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={handleViewOnMap}
          >
            <Feather name="map" size={20} color="#FFFFFF" />
            <ThemedText type="small" style={styles.actionButtonText}>
              Ver no Mapa
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={handleDocuments}
          >
            <Feather name="folder" size={20} color="#FFFFFF" />
            <ThemedText type="small" style={styles.actionButtonText}>
              Documentos
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleTalhoes}
          >
            <Feather name="grid" size={20} color="#FFFFFF" />
            <ThemedText type="small" style={styles.actionButtonText}>
              Talhoes
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Estatisticas
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="grid" size={24} color={colors.primary} />
            <ThemedText type="h3" style={{ color: colors.text }}>
              {stats.talhaoCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Talhoes
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="maximize" size={24} color={colors.secondary} />
            <ThemedText type="h3" style={{ color: colors.text }}>
              {formatArea(stats.totalTalhaoArea)}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Area Total
            </ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
            <Feather name="tag" size={24} color={colors.warning} />
            <ThemedText type="h3" style={{ color: colors.text }}>
              {stats.pendingServices}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Servicos Pendentes
            </ThemedText>
          </View>
        </View>
      </View>

      {property.talhoes.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Talhoes Recentes
            </ThemedText>
            {property.talhoes.length > 3 ? (
              <Pressable onPress={handleTalhoes}>
                <ThemedText type="link" style={{ color: colors.primary }}>
                  Ver todos ({property.talhoes.length})
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          {recentTalhoes.map((talhao) => (
            <View
              key={talhao.id}
              style={[styles.talhaoCard, { backgroundColor: colors.card }, Shadows.card]}
            >
              <View style={styles.talhaoHeader}>
                <ThemedText type="h4" style={{ color: colors.text }}>
                  {talhao.name}
                </ThemedText>
                <View style={[styles.cropBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ThemedText type="small" style={{ color: colors.primary }}>
                    {getCropTypeLabel(talhao.cropType)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.talhaoInfo}>
                {talhao.areaHectares ? (
                  <View style={styles.talhaoInfoItem}>
                    <Feather name="maximize" size={14} color={colors.textSecondary} />
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {formatArea(talhao.areaHectares)}
                    </ThemedText>
                  </View>
                ) : null}
                {talhao.serviceTags.length > 0 ? (
                  <View style={styles.talhaoInfoItem}>
                    <Feather name="tag" size={14} color={colors.warning} />
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {talhao.serviceTags.filter((s) => s.status === 'pending').length} pendentes
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Documentos
        </ThemedText>
        <Pressable
          style={[styles.documentsSummary, { backgroundColor: colors.card }, Shadows.card]}
          onPress={handleDocuments}
        >
          <View style={styles.docStatsRow}>
            <View style={styles.docStatItem}>
              <ThemedText type="h3" style={{ color: colors.text }}>
                {docStats.total}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Total
              </ThemedText>
            </View>
            <View style={styles.docStatItem}>
              <ThemedText type="h3" style={{ color: colors.success }}>
                {docStats.verified}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Verificados
              </ThemedText>
            </View>
            <View style={styles.docStatItem}>
              <ThemedText type="h3" style={{ color: colors.warning }}>
                {docStats.pending}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Pendentes
              </ThemedText>
            </View>
            <View style={styles.docStatItem}>
              <ThemedText type="h3" style={{ color: colors.error }}>
                {docStats.rejected}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Rejeitados
              </ThemedText>
            </View>
          </View>
          <View style={styles.docLinkRow}>
            <ThemedText type="link" style={{ color: colors.primary }}>
              Gerenciar documentos
            </ThemedText>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </View>
        </Pressable>
      </View>

      {recentHistory.length > 0 ? (
        <View style={styles.section}>
          <Pressable style={styles.sectionHeader} onPress={toggleHistoryExpanded}>
            <View style={styles.historyHeader}>
              <Feather name="clock" size={18} color={colors.text} />
              <ThemedText type="h4" style={[styles.sectionTitle, { marginLeft: Spacing.sm }]}>
                Historico de Alteracoes
              </ThemedText>
            </View>
            <Feather
              name={historyExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          {historyExpanded ? (
            <View style={[styles.historyContainer, { backgroundColor: colors.card }, Shadows.card]}>
              {recentHistory.map((item, index) => (
                <View
                  key={`${item.timestamp}-${index}`}
                  style={[
                    styles.historyItem,
                    index < recentHistory.length - 1 && styles.historyItemBorder,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.historyContent}>
                    <ThemedText type="body" style={{ color: colors.text }}>
                      {getChangeTypeLabel(item.changeType)}
                    </ThemedText>
                    {item.details ? (
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        {item.details}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="small" style={[styles.historyTimestamp, { color: colors.textSecondary }]}>
                      {formatDate(item.timestamp)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.dangerSection}>
        <ThemedText type="h4" style={[styles.sectionTitle, { color: colors.error }]}>
          Zona de Perigo
        </ThemedText>
        <Pressable
          style={[styles.deleteButton, { backgroundColor: colors.error + '15', borderColor: colors.error }]}
          onPress={handleDeleteProperty}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Feather name="trash-2" size={20} color={colors.error} />
          )}
          <ThemedText type="body" style={[styles.deleteButtonText, { color: colors.error }]}>
            {deleting ? 'Excluindo...' : 'Excluir Propriedade'}
          </ThemedText>
        </Pressable>
        <ThemedText type="small" style={[styles.dangerWarning, { color: colors.textSecondary }]}>
          Esta acao e irreversivel e removera todos os dados associados
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLink: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  coverPhotoContainer: {
    height: 200,
    width: '100%',
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.xl,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    height: 200,
    width: '100%',
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verifiedOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  propertyName: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  talhaoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  talhaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cropBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  talhaoInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  talhaoInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  documentsSummary: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  docStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  docStatItem: {
    alignItems: 'center',
  },
  docLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  historyContent: {
    flex: 1,
  },
  dangerSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  deleteButtonText: {
    fontWeight: '600',
  },
  historyTimestamp: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  dangerWarning: {
    textAlign: 'center',
    fontSize: 12,
  },
});
