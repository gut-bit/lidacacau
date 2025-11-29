import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PropertyDetail } from '@/types';
import { createProperty, updateProperty, getPropertyById } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

const PRIMARY_COLOR = '#F15A29';

interface FormErrors {
  name?: string;
  address?: string;
  location?: string;
}

export default function PropertyFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: { propertyId?: string } }, 'params'>>();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const propertyId = route.params?.propertyId;
  const isEditing = !!propertyId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cep, setCep] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    if (isEditing && propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    if (!propertyId) return;

    try {
      const property = await getPropertyById(propertyId);
      if (property) {
        setName(property.name);
        setDescription(property.description || '');
        setAddress(property.address);
        setCity(property.city || '');
        setState(property.state || '');
        setCep(property.cep || '');
        setCoverPhoto(property.coverPhoto);
        setLatitude(property.latitude);
        setLongitude(property.longitude);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar a propriedade');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'O nome da propriedade e obrigatorio';
    }

    if (!address.trim()) {
      newErrors.address = 'O endereco e obrigatorio';
    }

    if (latitude === null || longitude === null) {
      newErrors.location = 'Capture a localizacao GPS da propriedade';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetLocation = async () => {
    try {
      setGpsLoading(true);
      setErrors((prev) => ({ ...prev, location: undefined }));

      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        Alert.alert(
          'Permissao necessaria',
          'Precisamos da sua permissao para acessar a localizacao.',
          Platform.OS !== 'web'
            ? [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Configuracoes',
                  onPress: async () => {
                    try {
                      const { Linking } = require('react-native');
                      await Linking.openSettings();
                    } catch (e) {
                      console.error('Error opening settings:', e);
                    }
                  },
                },
              ]
            : [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const geo = reverseGeocode[0];
        
        const addressParts = [];
        if (geo.street) addressParts.push(geo.street);
        if (geo.streetNumber) addressParts.push(geo.streetNumber);
        if (geo.district) addressParts.push(geo.district);
        
        if (addressParts.length > 0 && !address.trim()) {
          setAddress(addressParts.join(', '));
        }
        
        if (geo.city && !city.trim()) {
          setCity(geo.city);
        }
        
        if (geo.region && !state.trim()) {
          setState(geo.region);
        }
        
        if (geo.postalCode && !cep.trim()) {
          setCep(geo.postalCode);
        }
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Sucesso', 'Localizacao capturada com sucesso!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Nao foi possivel obter a localizacao. Tente novamente.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePickCoverPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverPhoto(result.assets[0].uri);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      Alert.alert('Erro', 'Nao foi possivel selecionar a imagem');
    }
  };

  const handleRemoveCoverPhoto = () => {
    Alert.alert(
      'Remover foto',
      'Tem certeza que deseja remover a foto de capa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setCoverPhoto(undefined);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuario nao autenticado');
      return;
    }

    setSaving(true);
    try {
      const propertyData = {
        ownerId: user.id,
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        cep: cep.trim() || undefined,
        latitude: latitude!,
        longitude: longitude!,
        coverPhoto,
      };

      if (isEditing && propertyId) {
        await updateProperty(propertyId, propertyData, user.id);
      } else {
        await createProperty(propertyData);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Sucesso!',
        isEditing ? 'Propriedade atualizada com sucesso.' : 'Propriedade cadastrada com sucesso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving property:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar a propriedade. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (name || description || address) {
      Alert.alert(
        'Descartar alteracoes?',
        'Voce tem alteracoes nao salvas. Deseja descarta-las?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatCoordinates = (lat: number | null, lng: number | null): string => {
    if (lat === null || lng === null) return '';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
          Carregando propriedade...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.backButton}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="h2">
          {isEditing ? 'Editar Propriedade' : 'Nova Propriedade'}
        </ThemedText>
      </View>

      <View style={[styles.tipCard, { backgroundColor: PRIMARY_COLOR + '15', borderColor: PRIMARY_COLOR + '30' }]}>
        <Feather name="info" size={18} color={PRIMARY_COLOR} />
        <ThemedText type="small" style={[styles.tipText, { color: colors.textSecondary }]}>
          Cadastre sua propriedade para gerenciar talhoes e solicitar servicos
        </ThemedText>
      </View>

      <Pressable
        style={[styles.coverPhotoSection, { backgroundColor: colors.backgroundDefault, borderColor: errors.location ? colors.error : colors.border }]}
        onPress={handlePickCoverPhoto}
      >
        {coverPhoto ? (
          <View style={styles.coverPhotoContainer}>
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} contentFit="cover" />
            <Pressable
              style={[styles.removeCoverBtn, { backgroundColor: colors.error }]}
              onPress={handleRemoveCoverPhoto}
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </Pressable>
            <View style={[styles.editOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
              <Feather name="camera" size={24} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: '#FFFFFF', marginTop: Spacing.xs }}>
                Trocar foto
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.coverPhotoPlaceholder}>
            <Feather name="image" size={48} color={colors.textSecondary} />
            <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
              Adicionar foto de capa
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Toque para selecionar
            </ThemedText>
          </View>
        )}
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="home" size={20} color={PRIMARY_COLOR} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Informacoes Basicas</ThemedText>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Nome da propriedade <ThemedText style={{ color: colors.error }}>*</ThemedText>
          </ThemedText>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.backgroundDefault, borderColor: errors.name ? colors.error : colors.border }
          ]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: Fazenda Santa Maria"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
          </View>
          {errors.name ? (
            <ThemedText type="small" style={{ color: colors.error, marginTop: Spacing.xs }}>
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>Descricao (opcional)</ThemedText>
          <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Descreva sua propriedade..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="map-pin" size={20} color={PRIMARY_COLOR} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Localizacao</ThemedText>
        </View>

        <Pressable
          style={[
            styles.gpsButton,
            { backgroundColor: PRIMARY_COLOR, opacity: gpsLoading ? 0.7 : 1 }
          ]}
          onPress={handleGetLocation}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="navigation" size={20} color="#FFFFFF" />
          )}
          <ThemedText type="body" style={styles.gpsButtonText}>
            {gpsLoading ? 'Obtendo localizacao...' : 'Usar minha localizacao'}
          </ThemedText>
        </Pressable>

        {latitude !== null && longitude !== null ? (
          <View style={[styles.coordinatesCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <View style={styles.coordinatesInfo}>
              <ThemedText type="small" style={{ color: colors.success, fontWeight: '600' }}>
                Localizacao capturada
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {formatCoordinates(latitude, longitude)}
              </ThemedText>
            </View>
          </View>
        ) : errors.location ? (
          <View style={[styles.coordinatesCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <ThemedText type="small" style={{ color: colors.error }}>
              {errors.location}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>
            Endereco <ThemedText style={{ color: colors.error }}>*</ThemedText>
          </ThemedText>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.backgroundDefault, borderColor: errors.address ? colors.error : colors.border }
          ]}>
            <Feather name="map" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Endereco completo ou referencia"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
              }}
            />
          </View>
          {errors.address ? (
            <ThemedText type="small" style={{ color: colors.error, marginTop: Spacing.xs }}>
              {errors.address}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <ThemedText type="small" style={styles.label}>Cidade</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Uruara"
                placeholderTextColor={colors.textSecondary}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
            <ThemedText type="small" style={styles.label}>Estado</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="PA"
                placeholderTextColor={colors.textSecondary}
                value={state}
                onChangeText={setState}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="small" style={styles.label}>CEP (opcional)</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="00000-000"
              placeholderTextColor={colors.textSecondary}
              value={cep}
              onChangeText={setCep}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
        >
          {saving ? 'Salvando...' : isEditing ? 'Atualizar Propriedade' : 'Cadastrar Propriedade'}
        </Button>

        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Cancelar
          </ThemedText>
        </Pressable>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
  },
  coverPhotoSection: {
    height: 180,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  coverPhotoContainer: {
    flex: 1,
    position: 'relative',
  },
  coverPhoto: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  removeCoverBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    alignItems: 'center',
  },
  coverPhotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: Spacing.touchTarget,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coordinatesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  coordinatesInfo: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
