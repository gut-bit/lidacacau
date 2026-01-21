import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { WorkOrder, Job, User } from '@/types';
import { getWorkOrderById, getJobById, getUserById, updateWorkOrder } from '@/utils/storage';
import { getServiceTypeById } from '@/data/serviceTypes';
import { formatCurrency, formatQuantityWithUnit, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/format';
import { generateAndShareContract } from '@/utils/contractGenerator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkOrder'>;

export default function ActiveWorkOrderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { workOrderId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [producer, setProducer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [photoAfter, setPhotoAfter] = useState<string | null>(null);

  const loadWorkOrder = useCallback(async () => {
    try {
      const wo = await getWorkOrderById(workOrderId);
      setWorkOrder(wo);
      if (wo) {
        setPhotoBefore(wo.photoBefore || null);
        setPhotoAfter(wo.photoAfter || null);
        const jobData = await getJobById(wo.jobId);
        setJob(jobData);
        const producerData = await getUserById(wo.producerId);
        setProducer(producerData);
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useFocusEffect(
    useCallback(() => {
      loadWorkOrder();
    }, [loadWorkOrder])
  );

  const serviceType = job ? getServiceTypeById(job.serviceTypeId) : null;

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à localização para o check-in');
        setSubmitting(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await updateWorkOrder(workOrderId, {
        status: 'checked_in',
        checkInTime: new Date().toISOString(),
        checkInLatitude: location.coords.latitude,
        checkInLongitude: location.coords.longitude,
      });
      Alert.alert('Sucesso', 'Check-in realizado com sucesso!');
      await loadWorkOrder();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível realizar o check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à localização para o check-out');
        setSubmitting(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await updateWorkOrder(workOrderId, {
        status: 'checked_out',
        checkOutTime: new Date().toISOString(),
        checkOutLatitude: location.coords.latitude,
        checkOutLongitude: location.coords.longitude,
        photoBefore: photoBefore || undefined,
        photoAfter: photoAfter || undefined,
      });
      Alert.alert('Sucesso', 'Check-out realizado! Aguarde a confirmação do produtor.');
      await loadWorkOrder();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível realizar o check-out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTakePhoto = async (type: 'before' | 'after') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar fotos');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (type === 'before') {
          setPhotoBefore(uri);
        } else {
          setPhotoAfter(uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!workOrder || !job) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Ordem de serviço não encontrada</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Feather name={serviceType?.icon as any || 'briefcase'} size={24} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <ThemedText type="h3">{serviceType?.name || 'Serviço'}</ThemedText>
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                {formatQuantityWithUnit(job.quantity, serviceType?.unit || '')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(workOrder.status, colors) + '20' },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: getStatusColor(workOrder.status, colors), fontWeight: '600' }}
              >
                {getStatusLabel(workOrder.status)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.text, flex: 1 }}>
                {job.locationText}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <Feather name="user" size={16} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.text }}>
                {producer?.name}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <Feather name="dollar-sign" size={16} color={colors.accent} />
              <ThemedText type="h4" style={{ color: colors.accent }}>
                {formatCurrency(workOrder.finalPrice)}
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.contractButton,
              { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              if (job && workOrder && producer && user && serviceType) {
                generateAndShareContract({
                  job,
                  workOrder,
                  producer,
                  worker: user,
                  serviceType,
                });
              } else {
                Alert.alert('Erro', 'Dados incompletos para gerar o contrato');
              }
            }}
          >
            <Feather name="file-text" size={16} color={colors.text} />
            <ThemedText type="small" style={{ fontWeight: '600' }}>
              Visualizar Contrato
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Registro de Atividade
          </ThemedText>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineCircle,
                  { backgroundColor: colors.success },
                ]}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Atribuído
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {formatDateTime(workOrder.createdAt)}
                </ThemedText>
              </View>
            </View>

            {workOrder.checkInTime && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineCircle,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Feather name="check" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Check-in
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {formatDateTime(workOrder.checkInTime)}
                  </ThemedText>
                  {workOrder.checkInLatitude && (
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      GPS: {workOrder.checkInLatitude.toFixed(4)}, {workOrder.checkInLongitude?.toFixed(4)}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}

            {workOrder.checkOutTime && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineCircle,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Feather name="check" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Check-out
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {formatDateTime(workOrder.checkOutTime)}
                  </ThemedText>
                  {workOrder.checkOutLatitude && (
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      GPS: {workOrder.checkOutLatitude.toFixed(4)}, {workOrder.checkOutLongitude?.toFixed(4)}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}

            {workOrder.status === 'completed' && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineCircle,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Feather name="award" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Concluído
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        {workOrder.status === 'checked_in' && (
          <View style={[styles.card, { backgroundColor: colors.card }, Shadows.card]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Fotos (opcional)
            </ThemedText>
            <View style={styles.photosContainer}>
              <View style={styles.photoSection}>
                <ThemedText type="small" style={{ marginBottom: Spacing.sm }}>
                  Antes
                </ThemedText>
                {photoBefore ? (
                  <Pressable onPress={() => handleTakePhoto('before')}>
                    <Image source={{ uri: photoBefore }} style={styles.photo} contentFit="cover" />
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.photoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleTakePhoto('before')}
                  >
                    <Feather name="camera" size={24} color={colors.textSecondary} />
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      Tirar foto
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              <View style={styles.photoSection}>
                <ThemedText type="small" style={{ marginBottom: Spacing.sm }}>
                  Depois
                </ThemedText>
                {photoAfter ? (
                  <Pressable onPress={() => handleTakePhoto('after')}>
                    <Image source={{ uri: photoAfter }} style={styles.photo} contentFit="cover" />
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.photoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleTakePhoto('after')}
                  >
                    <Feather name="camera" size={24} color={colors.textSecondary} />
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      Tirar foto
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}

        {workOrder.status === 'completed' && (
          <Pressable
            style={({ pressed }) => [
              styles.reviewButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() =>
              navigation.navigate('Review', {
                workOrderId: workOrder.id,
                revieweeId: workOrder.producerId,
                revieweeName: producer?.name || 'Produtor',
              })
            }
          >
            <Feather name="star" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Avaliar Produtor
            </ThemedText>
          </Pressable>
        )}
      </ScreenScrollView>

      {
        workOrder.status === 'assigned' && (
          <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
            <Button onPress={handleCheckIn} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="log-in" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                  Check-in
                </>
              )}
            </Button>
          </View>
        )
      }

      {
        workOrder.status === 'checked_in' && (
          <View style={[styles.bottomBar, { backgroundColor: colors.backgroundRoot, paddingBottom: insets.bottom + Spacing.md }]}>
            <Button onPress={handleCheckOut} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="log-out" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
                  Check-out
                </>
              )}
            </Button>
          </View>
        )
      }
    </ThemedView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  detailsSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeline: {
    gap: Spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoSection: {
    flex: 1,
  },
  photo: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.xs,
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
});
