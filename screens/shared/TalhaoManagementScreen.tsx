import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRoute, useFocusEffect, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  Talhao,
  TalhaoServiceTag,
  CROP_TYPES,
  TalhaoPriority,
  PropertyDetail,
} from '@/types';
import {
  getPropertyById,
  addTalhao,
  updateTalhao,
  deleteTalhao,
  addServiceTag,
  updateServiceTag,
} from '@/utils/storage';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { RootStackParamList } from '@/navigation/RootNavigator';

type TalhaoManagementRouteProp = RouteProp<RootStackParamList, 'TalhaoManagement'>;

const PRIORITY_COLORS: Record<TalhaoPriority, string> = {
  low: '#9E9E9E',
  medium: '#FBC02D',
  high: '#FF9800',
  urgent: '#F44336',
};

const PRIORITY_LABELS: Record<TalhaoPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function TalhaoManagementScreen() {
  const route = useRoute<TalhaoManagementRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const { propertyId } = route.params;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTalhaoId, setExpandedTalhaoId] = useState<string | null>(null);
  
  const [showAddTalhaoModal, setShowAddTalhaoModal] = useState(false);
  const [newTalhaoName, setNewTalhaoName] = useState('');
  const [newTalhaoDescription, setNewTalhaoDescription] = useState('');
  const [newTalhaoCropType, setNewTalhaoCropType] = useState('cacau');
  const [newTalhaoVisibility, setNewTalhaoVisibility] = useState<'public' | 'private'>('public');
  const [isAddingTalhao, setIsAddingTalhao] = useState(false);

  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [selectedTalhaoForTag, setSelectedTalhaoForTag] = useState<string | null>(null);
  const [newTagServiceTypeId, setNewTagServiceTypeId] = useState('poda');
  const [newTagPriority, setNewTagPriority] = useState<TalhaoPriority>('medium');
  const [newTagNotes, setNewTagNotes] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const [showCropTypePicker, setShowCropTypePicker] = useState(false);
  const [showServiceTypePicker, setShowServiceTypePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const loadProperty = useCallback(async () => {
    try {
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);
    } catch (error) {
      console.error('Error loading property:', error);
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

  const handleToggleExpand = (talhaoId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedTalhaoId(expandedTalhaoId === talhaoId ? null : talhaoId);
  };

  const handleAddTalhao = async () => {
    if (!newTalhaoName.trim() || !user) return;

    setIsAddingTalhao(true);
    try {
      await addTalhao(
        propertyId,
        {
          name: newTalhaoName.trim(),
          description: newTalhaoDescription.trim() || undefined,
          cropType: newTalhaoCropType,
          visibility: newTalhaoVisibility,
        },
        user.id
      );
      await loadProperty();
      setShowAddTalhaoModal(false);
      setNewTalhaoName('');
      setNewTalhaoDescription('');
      setNewTalhaoCropType('cacau');
      setNewTalhaoVisibility('public');
      Alert.alert('Sucesso', 'Talhao adicionado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel adicionar o talhao');
    } finally {
      setIsAddingTalhao(false);
    }
  };

  const handleDeleteTalhao = (talhao: Talhao) => {
    Alert.alert(
      'Remover Talhao',
      `Tem certeza que deseja remover "${talhao.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteTalhao(propertyId, talhao.id, user.id);
              await loadProperty();
              Alert.alert('Sucesso', 'Talhao removido!');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Nao foi possivel remover o talhao');
            }
          },
        },
      ]
    );
  };

  const handleEditTalhao = (talhao: Talhao) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('MapPropertyEditor' as any, {
      propertyId,
      talhaoId: talhao.id,
      mode: 'talhao',
    });
  };

  const handleToggleVisibility = async (talhao: Talhao) => {
    if (!user) return;
    try {
      const newVisibility = talhao.visibility === 'public' ? 'private' : 'public';
      await updateTalhao(propertyId, talhao.id, { visibility: newVisibility }, user.id);
      await loadProperty();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel atualizar visibilidade');
    }
  };

  const handleOpenAddTagModal = (talhaoId: string) => {
    setSelectedTalhaoForTag(talhaoId);
    setNewTagServiceTypeId('poda');
    setNewTagPriority('medium');
    setNewTagNotes('');
    setShowAddTagModal(true);
  };

  const handleAddServiceTag = async () => {
    if (!selectedTalhaoForTag || !user) return;

    setIsAddingTag(true);
    try {
      await addServiceTag(
        propertyId,
        selectedTalhaoForTag,
        {
          serviceTypeId: newTagServiceTypeId,
          priority: newTagPriority,
          notes: newTagNotes.trim() || undefined,
        },
        user.id
      );
      await loadProperty();
      setShowAddTagModal(false);
      setSelectedTalhaoForTag(null);
      Alert.alert('Sucesso', 'Tag de servico adicionada!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel adicionar a tag');
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleCompleteTag = async (talhaoId: string, tagId: string) => {
    if (!user) return;
    try {
      await updateServiceTag(propertyId, talhaoId, tagId, { status: 'completed' }, user.id);
      await loadProperty();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel atualizar a tag');
    }
  };

  const handleDeleteTag = (talhaoId: string, tag: TalhaoServiceTag) => {
    const serviceType = SERVICE_TYPES.find((s) => s.id === tag.serviceTypeId);
    Alert.alert(
      'Remover Tag',
      `Remover tag "${serviceType?.name || tag.serviceTypeId}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const talhao = property?.talhoes.find((t) => t.id === talhaoId);
            if (!talhao) return;
            const updatedTags = talhao.serviceTags.filter((t) => t.id !== tag.id);
            try {
              await updateTalhao(propertyId, talhaoId, { serviceTags: updatedTags }, user.id);
              await loadProperty();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Nao foi possivel remover a tag');
            }
          },
        },
      ]
    );
  };

  const formatArea = (area?: number): string => {
    if (!area) return '0 ha';
    if (area < 1) return `${(area * 10000).toFixed(0)} m²`;
    return `${area.toFixed(2)} ha`;
  };

  const getCropTypeLabel = (cropTypeId?: string): string => {
    if (!cropTypeId) return 'Nao definido';
    const cropType = CROP_TYPES.find((c) => c.id === cropTypeId);
    return cropType?.label || cropTypeId;
  };

  const getCropTypeIcon = (cropTypeId?: string): string => {
    if (!cropTypeId) return 'help-circle';
    const cropType = CROP_TYPES.find((c) => c.id === cropTypeId);
    return cropType?.icon || 'help-circle';
  };

  const getServiceTypeName = (serviceTypeId: string): string => {
    const serviceType = SERVICE_TYPES.find((s) => s.id === serviceTypeId);
    return serviceType?.name || serviceTypeId;
  };

  const getPendingTagsCount = (talhao: Talhao): number => {
    return talhao.serviceTags.filter((t) => t.status === 'pending').length;
  };

  const getHighestPriority = (talhao: Talhao): TalhaoPriority | null => {
    const pendingTags = talhao.serviceTags.filter((t) => t.status === 'pending');
    if (pendingTags.length === 0) return null;
    const priorities: TalhaoPriority[] = ['urgent', 'high', 'medium', 'low'];
    for (const priority of priorities) {
      if (pendingTags.some((t) => t.priority === priority)) {
        return priority;
      }
    }
    return 'low';
  };

  const renderServiceTag = (talhaoId: string, tag: TalhaoServiceTag) => {
    const isCompleted = tag.status === 'completed';
    return (
      <View
        key={tag.id}
        style={[
          styles.serviceTag,
          { 
            backgroundColor: isCompleted ? colors.backgroundSecondary : colors.card,
            borderLeftColor: isCompleted ? colors.textSecondary : PRIORITY_COLORS[tag.priority],
          },
        ]}
      >
        <View style={styles.tagContent}>
          <View style={styles.tagHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[tag.priority] }]}>
              <ThemedText type="small" style={styles.priorityText}>
                {PRIORITY_LABELS[tag.priority]}
              </ThemedText>
            </View>
            <ThemedText
              type="body"
              style={[styles.tagTitle, isCompleted ? { textDecorationLine: 'line-through', color: colors.textSecondary } : null]}
            >
              {getServiceTypeName(tag.serviceTypeId)}
            </ThemedText>
          </View>
          {tag.notes ? (
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              {tag.notes}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.tagActions}>
          {!isCompleted ? (
            <Pressable
              style={[styles.tagActionButton, { backgroundColor: colors.success + '20' }]}
              onPress={() => handleCompleteTag(talhaoId, tag.id)}
            >
              <Feather name="check" size={16} color={colors.success} />
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.tagActionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => handleDeleteTag(talhaoId, tag)}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderTalhaoCard = (talhao: Talhao) => {
    const isExpanded = expandedTalhaoId === talhao.id;
    const pendingCount = getPendingTagsCount(talhao);
    const highestPriority = getHighestPriority(talhao);

    return (
      <View key={talhao.id} style={[styles.talhaoCard, { backgroundColor: colors.card }, Shadows.card]}>
        <Pressable style={styles.talhaoHeader} onPress={() => handleToggleExpand(talhao.id)}>
          <View style={styles.talhaoInfo}>
            <View style={styles.talhaoNameRow}>
              <Feather name={getCropTypeIcon(talhao.cropType) as any} size={20} color={colors.primary} />
              <ThemedText type="h4" style={styles.talhaoName} numberOfLines={1}>
                {talhao.name}
              </ThemedText>
              <Pressable
                onPress={() => handleToggleVisibility(talhao)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={talhao.visibility === 'public' ? 'eye' : 'lock'}
                  size={16}
                  color={talhao.visibility === 'public' ? colors.secondary : colors.textSecondary}
                />
              </Pressable>
            </View>
            {talhao.description ? (
              <ThemedText type="small" style={{ color: colors.textSecondary }} numberOfLines={2}>
                {talhao.description}
              </ThemedText>
            ) : null}
            <View style={styles.talhaoStats}>
              <View style={styles.statItem}>
                <Feather name="map" size={14} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {getCropTypeLabel(talhao.cropType)}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <Feather name="maximize" size={14} color={colors.secondary} />
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {formatArea(talhao.areaHectares)}
                </ThemedText>
              </View>
              {pendingCount > 0 ? (
                <View style={styles.statItem}>
                  <View
                    style={[
                      styles.tagCountBadge,
                      { backgroundColor: highestPriority ? PRIORITY_COLORS[highestPriority] : colors.textSecondary },
                    ]}
                  >
                    <ThemedText type="small" style={styles.tagCountText}>
                      {pendingCount}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    servico{pendingCount !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.expandIconContainer}>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => handleEditTalhao(talhao)}
              >
                <Feather name="edit-2" size={16} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.primary }}>
                  Editar/Desenhar
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
                onPress={() => handleOpenAddTagModal(talhao.id)}
              >
                <Feather name="tag" size={16} color={colors.secondary} />
                <ThemedText type="small" style={{ color: colors.secondary }}>
                  Adicionar Servico
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => handleDeleteTalhao(talhao)}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
                <ThemedText type="small" style={{ color: colors.error }}>
                  Remover
                </ThemedText>
              </Pressable>
            </View>

            {talhao.serviceTags.length > 0 ? (
              <View style={styles.tagsSection}>
                <ThemedText type="body" style={styles.tagsSectionTitle}>
                  Tags de Servico ({talhao.serviceTags.length})
                </ThemedText>
                {talhao.serviceTags.map((tag) => renderServiceTag(talhao.id, tag))}
              </View>
            ) : (
              <View style={styles.noTagsContainer}>
                <Feather name="tag" size={24} color={colors.textSecondary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Nenhuma tag de servico
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="grid" size={48} color={colors.primary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>
        Nenhum talhao cadastrado
      </ThemedText>
      <ThemedText type="body" style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Adicione talhoes para organizar sua propriedade e gerenciar servicos
      </ThemedText>
      <Pressable
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddTalhaoModal(true)}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={styles.addButtonText}>
          Adicionar Talhao
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderAddTalhaoModal = () => (
    <Modal visible={showAddTalhaoModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Novo Talhao</ThemedText>
            <Pressable onPress={() => setShowAddTalhaoModal(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Nome *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={newTalhaoName}
              onChangeText={setNewTalhaoName}
              placeholder="Ex: Talhao 1, Area do Cacau"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Descricao</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={newTalhaoDescription}
              onChangeText={setNewTalhaoDescription}
              placeholder="Descricao opcional do talhao"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Tipo de Cultivo</ThemedText>
            <Pressable
              style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => setShowCropTypePicker(true)}
            >
              <Feather name={getCropTypeIcon(newTalhaoCropType) as any} size={18} color={colors.primary} />
              <ThemedText type="body" style={{ flex: 1, color: colors.text }}>
                {getCropTypeLabel(newTalhaoCropType)}
              </ThemedText>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Visibilidade</ThemedText>
            <View style={styles.visibilityToggle}>
              <Pressable
                style={[
                  styles.visibilityOption,
                  { backgroundColor: newTalhaoVisibility === 'public' ? colors.primary : colors.backgroundSecondary },
                ]}
                onPress={() => setNewTalhaoVisibility('public')}
              >
                <Feather name="eye" size={16} color={newTalhaoVisibility === 'public' ? '#FFFFFF' : colors.textSecondary} />
                <ThemedText
                  type="small"
                  style={{ color: newTalhaoVisibility === 'public' ? '#FFFFFF' : colors.textSecondary }}
                >
                  Publico
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.visibilityOption,
                  { backgroundColor: newTalhaoVisibility === 'private' ? colors.primary : colors.backgroundSecondary },
                ]}
                onPress={() => setNewTalhaoVisibility('private')}
              >
                <Feather name="lock" size={16} color={newTalhaoVisibility === 'private' ? '#FFFFFF' : colors.textSecondary} />
                <ThemedText
                  type="small"
                  style={{ color: newTalhaoVisibility === 'private' ? '#FFFFFF' : colors.textSecondary }}
                >
                  Privado
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setShowAddTalhaoModal(false)}
            >
              <ThemedText type="body" style={{ color: colors.text }}>Cancelar</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary, opacity: !newTalhaoName.trim() || isAddingTalhao ? 0.6 : 1 }]}
              onPress={handleAddTalhao}
              disabled={!newTalhaoName.trim() || isAddingTalhao}
            >
              {isAddingTalhao ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText type="body" style={{ color: '#FFFFFF' }}>Adicionar</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddTagModal = () => (
    <Modal visible={showAddTagModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Nova Tag de Servico</ThemedText>
            <Pressable onPress={() => setShowAddTagModal(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Tipo de Servico</ThemedText>
            <Pressable
              style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => setShowServiceTypePicker(true)}
            >
              <ThemedText type="body" style={{ flex: 1, color: colors.text }}>
                {getServiceTypeName(newTagServiceTypeId)}
              </ThemedText>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Prioridade</ThemedText>
            <View style={styles.priorityOptions}>
              {(['low', 'medium', 'high', 'urgent'] as TalhaoPriority[]).map((priority) => (
                <Pressable
                  key={priority}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: newTagPriority === priority ? PRIORITY_COLORS[priority] : colors.backgroundSecondary,
                      borderColor: PRIORITY_COLORS[priority],
                    },
                  ]}
                  onPress={() => setNewTagPriority(priority)}
                >
                  <ThemedText
                    type="small"
                    style={{ color: newTagPriority === priority ? '#FFFFFF' : colors.text }}
                  >
                    {PRIORITY_LABELS[priority]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="body" style={styles.label}>Observacoes</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              value={newTagNotes}
              onChangeText={setNewTagNotes}
              placeholder="Detalhes sobre o servico necessario"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setShowAddTagModal(false)}
            >
              <ThemedText type="body" style={{ color: colors.text }}>Cancelar</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary, opacity: isAddingTag ? 0.6 : 1 }]}
              onPress={handleAddServiceTag}
              disabled={isAddingTag}
            >
              {isAddingTag ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText type="body" style={{ color: '#FFFFFF' }}>Adicionar</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCropTypePicker = () => (
    <Modal visible={showCropTypePicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Tipo de Cultivo</ThemedText>
            <Pressable onPress={() => setShowCropTypePicker(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.pickerList}>
            {CROP_TYPES.map((crop) => (
              <Pressable
                key={crop.id}
                style={[
                  styles.pickerItem,
                  { backgroundColor: newTalhaoCropType === crop.id ? colors.primary + '20' : 'transparent' },
                ]}
                onPress={() => {
                  setNewTalhaoCropType(crop.id);
                  setShowCropTypePicker(false);
                }}
              >
                <Feather name={crop.icon as any} size={20} color={colors.primary} />
                <ThemedText type="body" style={{ flex: 1 }}>{crop.label}</ThemedText>
                {newTalhaoCropType === crop.id ? (
                  <Feather name="check" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderServiceTypePicker = () => (
    <Modal visible={showServiceTypePicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Tipo de Servico</ThemedText>
            <Pressable onPress={() => setShowServiceTypePicker(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.pickerList}>
            {SERVICE_TYPES.map((service) => (
              <Pressable
                key={service.id}
                style={[
                  styles.pickerItem,
                  { backgroundColor: newTagServiceTypeId === service.id ? colors.primary + '20' : 'transparent' },
                ]}
                onPress={() => {
                  setNewTagServiceTypeId(service.id);
                  setShowServiceTypePicker(false);
                }}
              >
                <Feather name={service.icon as any} size={20} color={colors.primary} />
                <ThemedText type="body" style={{ flex: 1 }}>{service.name}</ThemedText>
                {newTagServiceTypeId === service.id ? (
                  <Feather name="check" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Carregando talhoes...
          </ThemedText>
        </View>
      );
    }

    if (!property) {
      return (
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Propriedade nao encontrada
          </ThemedText>
        </View>
      );
    }

    if (property.talhoes.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.listContainer}>
        <View style={[styles.headerCard, { backgroundColor: colors.primary + '10' }]}>
          <ThemedText type="h4" style={{ color: colors.primary }}>
            {property.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {property.talhoes.length} talhao{property.talhoes.length !== 1 ? 'es' : ''} cadastrado{property.talhoes.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        {property.talhoes.map(renderTalhaoCard)}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderContent()}
      </ScreenScrollView>

      {property && property.talhoes.length > 0 ? (
        <Pressable
          style={[
            styles.fab,
            { backgroundColor: colors.primary, bottom: insets.bottom + Spacing.xl },
            Shadows.fab,
          ]}
          onPress={() => setShowAddTalhaoModal(true)}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}

      {renderAddTalhaoModal()}
      {renderAddTagModal()}
      {renderCropTypePicker()}
      {renderServiceTypePicker()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  listContainer: {
    gap: Spacing.md,
  },
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  talhaoCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  talhaoHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  talhaoInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  talhaoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  talhaoName: {
    flex: 1,
  },
  talhaoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagCountText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  expandIconContainer: {
    justifyContent: 'center',
    paddingLeft: Spacing.md,
  },
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tagsSection: {
    gap: Spacing.sm,
  },
  tagsSectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
  },
  tagContent: {
    flex: 1,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  tagTitle: {
    flex: 1,
  },
  tagActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTagsContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    minHeight: Spacing.touchTarget,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  visibilityToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: Spacing.touchTarget,
  },
  pickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '70%',
  },
  pickerList: {
    gap: Spacing.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
