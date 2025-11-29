import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator, 
  ScrollView, Modal, Switch, Platform 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { 
  createJob, createServiceOffer, getCardPresets, createCardPreset 
} from '@/utils/storage';
import { formatCurrency } from '@/utils/format';
import { CardType, CardExtras, CARD_COLORS, CardPreset } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCard'>;

const EXTRA_OPTIONS = [
  { key: 'providesFood', label: 'Alimentacao', icon: 'coffee' },
  { key: 'providesAccommodation', label: 'Estadia', icon: 'home' },
  { key: 'providesTransport', label: 'Transporte', icon: 'truck' },
  { key: 'toolsProvided', label: 'Ferramentas', icon: 'tool' },
];

function ThumbsUpAnimation({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.5, { damping: 8, stiffness: 150 }),
        withTiming(1.2, { duration: 200 }),
        withTiming(0, { duration: 300 }, () => {
          runOnJS(onComplete)();
        })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 300 })
      );
      rotation.value = withSequence(
        withTiming(-15, { duration: 100 }),
        withSpring(0, { damping: 5 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.thumbsUpOverlay}>
      <Animated.View style={[styles.thumbsUpContainer, animatedStyle]}>
        <Feather name="thumbs-up" size={80} color="#FFB800" />
        <ThemedText type="h2" style={styles.thumbsUpText}>Publicado!</ThemedText>
      </Animated.View>
    </View>
  );
}

export default function CreateCardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { theme, isDark } = useTheme();
  const { user, activeRole } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const initialType: CardType = route.params?.type || (activeRole === 'producer' ? 'demand' : 'offer');
  
  const [cardType, setCardType] = useState<CardType>(initialType);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [quantity, setQuantity] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(true);
  const [priceType, setPriceType] = useState<'total' | 'perDay' | 'perHour' | 'perUnit'>('total');
  const [availableRadius, setAvailableRadius] = useState('50');
  const [availability, setAvailability] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [extras, setExtras] = useState<CardExtras>({});
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<CardPreset[]>([]);
  const [showThumbsUp, setShowThumbsUp] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [directions, setDirections] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const cardColors = CARD_COLORS[cardType];
  const selectedService = SERVICE_TYPES.find((s) => selectedServices.includes(s.id));

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    if (!user) return;
    const userPresets = await getCardPresets(user.id);
    setPresets(userPresets.filter(p => p.type === cardType));
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao negada', 'Precisamos de acesso a localizacao');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (address) {
        const parts = [address.street, address.district, address.city].filter(Boolean);
        setLocationText(parts.join(', ') || 'Localizacao obtida');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Nao foi possivel obter a localizacao');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limite', 'Maximo de 5 fotos');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar a foto');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleService = (serviceId: string) => {
    if (cardType === 'demand') {
      setSelectedServices([serviceId]);
    } else {
      if (selectedServices.includes(serviceId)) {
        setSelectedServices(selectedServices.filter(id => id !== serviceId));
      } else {
        setSelectedServices([...selectedServices, serviceId]);
      }
    }
  };

  const toggleExtra = (key: string) => {
    setExtras(prev => ({ ...prev, [key]: !prev[key as keyof CardExtras] }));
  };

  const addCustomCondition = () => {
    if (newCondition.trim()) {
      setCustomConditions([...customConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCustomCondition = (index: number) => {
    setCustomConditions(customConditions.filter((_, i) => i !== index));
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o preset');
      return;
    }
    try {
      await createCardPreset({
        userId: user!.id,
        name: presetName.trim(),
        type: cardType,
        serviceTypeIds: selectedServices,
        defaultPrice: parseFloat(price) || undefined,
        defaultLocation: locationText || undefined,
        defaultDescription: description || undefined,
        defaultExtras: Object.keys(extras).length > 0 ? extras : undefined,
      });
      Alert.alert('Sucesso', 'Preset salvo com sucesso!');
      setShowPresetModal(false);
      setPresetName('');
      loadPresets();
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel salvar o preset');
    }
  };

  const loadPreset = (preset: CardPreset) => {
    setSelectedServices(preset.serviceTypeIds);
    if (preset.defaultPrice) setPrice(preset.defaultPrice.toString());
    if (preset.defaultLocation) setLocationText(preset.defaultLocation);
    if (preset.defaultDescription) setDescription(preset.defaultDescription);
    if (preset.defaultExtras) setExtras(preset.defaultExtras);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateForm = (): boolean => {
    if (selectedServices.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um tipo de servico');
      return false;
    }
    if (!locationText.trim()) {
      Alert.alert('Erro', 'Informe a localizacao');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Erro', 'Informe o valor');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Adicione uma descricao detalhada');
      return false;
    }
    if (cardType === 'demand' && (!quantity || parseFloat(quantity) <= 0)) {
      Alert.alert('Erro', 'Informe a quantidade');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cardExtras: CardExtras = {
        ...extras,
        directions: directions || undefined,
        customConditions: customConditions.length > 0 ? customConditions : undefined,
      };

      if (cardType === 'demand') {
        await createJob({
          producerId: user!.id,
          serviceTypeId: selectedServices[0],
          quantity: parseFloat(quantity),
          locationText: locationText.trim(),
          latitude,
          longitude,
          offer: parseFloat(price),
          notes: description.trim(),
          photos: photos.length > 0 ? photos : undefined,
        });
      } else {
        await createServiceOffer({
          workerId: user!.id,
          serviceTypeIds: selectedServices,
          pricePerUnit: priceType === 'perUnit' ? parseFloat(price) : undefined,
          pricePerDay: priceType === 'perDay' ? parseFloat(price) : undefined,
          pricePerHour: priceType === 'perHour' ? parseFloat(price) : undefined,
          priceNegotiable,
          locationText: locationText.trim(),
          latitude,
          longitude,
          availableRadius: parseInt(availableRadius) || 50,
          availability: availability || 'A combinar',
          description: description.trim(),
          photos: photos.length > 0 ? photos : undefined,
          extras: cardExtras,
          visibility: isPublic ? 'public' : 'private',
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowThumbsUp(true);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Nao foi possivel criar o card');
      setIsSubmitting(false);
    }
  };

  const handleThumbsUpComplete = () => {
    setShowThumbsUp(false);
    navigation.goBack();
  };

  const handleShare = async () => {
    const shareUrl = `lidacacau://card/${cardType}/${user?.id}`;
    const message = cardType === 'demand' 
      ? `Estou procurando ${selectedService?.name || 'servico'} no LidaCacau!` 
      : `Ofereco servicos de ${selectedServices.map(id => SERVICE_TYPES.find(s => s.id === id)?.name).join(', ')} no LidaCacau!`;
    
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message + '\n\n' + shareUrl)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(shareUrl, { dialogTitle: message });
        } else {
          Alert.alert('Compartilhar', message);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel compartilhar');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThumbsUpAnimation visible={showThumbsUp} onComplete={handleThumbsUpComplete} />
      
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.lg, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[
              styles.typeButton,
              cardType === 'demand' && { backgroundColor: CARD_COLORS.demand.primary },
            ]}
            onPress={() => { setCardType('demand'); loadPresets(); }}
          >
            <Feather 
              name="search" 
              size={20} 
              color={cardType === 'demand' ? '#FFFFFF' : colors.textSecondary} 
            />
            <ThemedText 
              type="body" 
              style={{ 
                color: cardType === 'demand' ? '#FFFFFF' : colors.textSecondary,
                fontWeight: cardType === 'demand' ? '700' : '500' 
              }}
            >
              Busco Trabalhador
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              cardType === 'offer' && { backgroundColor: CARD_COLORS.offer.primary },
            ]}
            onPress={() => { setCardType('offer'); loadPresets(); }}
          >
            <Feather 
              name="briefcase" 
              size={20} 
              color={cardType === 'offer' ? '#FFFFFF' : colors.textSecondary} 
            />
            <ThemedText 
              type="body" 
              style={{ 
                color: cardType === 'offer' ? '#FFFFFF' : colors.textSecondary,
                fontWeight: cardType === 'offer' ? '700' : '500' 
              }}
            >
              Ofereco Servico
            </ThemedText>
          </Pressable>
        </View>

        {presets.length > 0 && (
          <View style={styles.presetsSection}>
            <ThemedText type="small" style={styles.sectionLabel}>Presets Salvos</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {presets.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={[styles.presetChip, { backgroundColor: cardColors.primary + '20' }]}
                  onPress={() => loadPreset(preset)}
                >
                  <Feather name="zap" size={14} color={cardColors.primary} />
                  <ThemedText type="small" style={{ color: cardColors.primary }}>
                    {preset.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <ThemedText type="small" style={styles.sectionLabel}>
          {cardType === 'demand' ? 'Tipo de Servico' : 'Servicos Oferecidos'}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesContainer}
        >
          {SERVICE_TYPES.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <Pressable
                key={service.id}
                style={[
                  styles.serviceChip,
                  {
                    backgroundColor: isSelected ? cardColors.primary : colors.backgroundDefault,
                    borderColor: isSelected ? cardColors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleService(service.id)}
              >
                <Feather
                  name={service.icon as any}
                  size={18}
                  color={isSelected ? '#FFFFFF' : colors.text}
                />
                <ThemedText
                  type="small"
                  style={{ color: isSelected ? '#FFFFFF' : colors.text }}
                >
                  {service.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {cardType === 'demand' && selectedService && (
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>
              Quantidade ({selectedService.unit})
            </ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: 100"
                placeholderTextColor={colors.textSecondary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>Localizacao</ThemedText>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <Feather name="map-pin" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Endereco ou descricao"
              placeholderTextColor={colors.textSecondary}
              value={locationText}
              onChangeText={setLocationText}
            />
          </View>
          <Pressable
            style={[styles.locationButton, { backgroundColor: cardColors.primary }]}
            onPress={handleGetLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                  Usar minha localizacao
                </ThemedText>
              </>
            )}
          </Pressable>
          {latitude && longitude && (
            <ThemedText type="caption" style={{ color: colors.success, marginTop: Spacing.xs }}>
              GPS capturado com sucesso
            </ThemedText>
          )}
        </View>

        {cardType === 'offer' && (
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>Raio de Atendimento (km)</ThemedText>
            <View style={styles.radiusOptions}>
              {['10', '25', '50', '100'].map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.radiusChip,
                    availableRadius === r && { backgroundColor: cardColors.primary },
                    { borderColor: cardColors.primary },
                  ]}
                  onPress={() => setAvailableRadius(r)}
                >
                  <ThemedText
                    type="small"
                    style={{ color: availableRadius === r ? '#FFFFFF' : cardColors.primary }}
                  >
                    {r}km
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            {cardType === 'demand' ? 'Oferta (R$)' : 'Valor'}
          </ThemedText>
          {cardType === 'offer' && (
            <View style={styles.priceTypeContainer}>
              {[
                { key: 'total', label: 'Total' },
                { key: 'perDay', label: 'Diaria' },
                { key: 'perHour', label: 'Hora' },
                { key: 'perUnit', label: 'Unidade' },
              ].map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.priceTypeChip,
                    priceType === type.key && { backgroundColor: cardColors.primary },
                    { borderColor: cardColors.primary },
                  ]}
                  onPress={() => setPriceType(type.key as any)}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: priceType === type.key ? '#FFFFFF' : cardColors.primary }}
                  >
                    {type.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>R$</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          {cardType === 'offer' && (
            <View style={styles.switchRow}>
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                Preco negociavel
              </ThemedText>
              <Switch
                value={priceNegotiable}
                onValueChange={setPriceNegotiable}
                trackColor={{ false: colors.border, true: cardColors.primary + '50' }}
                thumbColor={priceNegotiable ? cardColors.primary : colors.textSecondary}
              />
            </View>
          )}
        </View>

        {cardType === 'offer' && (
          <View style={styles.inputContainer}>
            <ThemedText type="small" style={styles.label}>Disponibilidade</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <Feather name="clock" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Segunda a Sexta, 7h as 17h"
                placeholderTextColor={colors.textSecondary}
                value={availability}
                onChangeText={setAvailability}
              />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="small" style={styles.label}>Opcoes Adicionais</ThemedText>
            <Pressable 
              style={[styles.addButton, { backgroundColor: cardColors.primary }]}
              onPress={() => setShowExtrasModal(true)}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          
          <View style={styles.extrasGrid}>
            {EXTRA_OPTIONS.map((option) => {
              const isActive = extras[option.key as keyof CardExtras];
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.extraChip,
                    isActive && { backgroundColor: cardColors.primary },
                    { borderColor: cardColors.primary },
                  ]}
                  onPress={() => toggleExtra(option.key)}
                >
                  <Feather
                    name={option.icon as any}
                    size={16}
                    color={isActive ? '#FFFFFF' : cardColors.primary}
                  />
                  <ThemedText
                    type="caption"
                    style={{ color: isActive ? '#FFFFFF' : cardColors.primary }}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {customConditions.length > 0 && (
            <View style={styles.customConditions}>
              {customConditions.map((condition, index) => (
                <View key={index} style={[styles.conditionTag, { backgroundColor: colors.accent + '20' }]}>
                  <ThemedText type="caption" style={{ color: colors.accent, flex: 1 }}>
                    {condition}
                  </ThemedText>
                  <Pressable onPress={() => removeCustomCondition(index)}>
                    <Feather name="x" size={14} color={colors.accent} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>Fotos ({photos.length}/5)</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosRow}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <View style={[styles.photoThumbnail, { backgroundColor: colors.border }]}>
                    <Feather name="image" size={24} color={colors.textSecondary} />
                  </View>
                  <Pressable
                    style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 && (
                <Pressable
                  style={[styles.addPhotoButton, { borderColor: cardColors.primary }]}
                  onPress={handlePickPhoto}
                >
                  <Feather name="camera" size={24} color={cardColors.primary} />
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.visibilityRow}>
            <View style={styles.visibilityInfo}>
              <Feather 
                name={isPublic ? 'globe' : 'lock'} 
                size={20} 
                color={isPublic ? cardColors.primary : colors.textSecondary} 
              />
              <View>
                <ThemedText type="body" style={{ color: colors.text }}>
                  {isPublic ? 'Publico' : 'Privado'}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  {isPublic 
                    ? 'Visivel para todos no feed' 
                    : 'So voce ve, pode compartilhar manualmente'}
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.border, true: cardColors.primary + '50' }}
              thumbColor={isPublic ? cardColors.primary : colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>Descricao Detalhada *</ThemedText>
          <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Descreva com detalhes o que voce precisa ou oferece..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>Como Chegar (opcional)</ThemedText>
          <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Instrucoes de como chegar ao local..."
              placeholderTextColor={colors.textSecondary}
              value={directions}
              onChangeText={setDirections}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.savePresetButton, { borderColor: cardColors.primary }]}
            onPress={() => setShowPresetModal(true)}
          >
            <Feather name="save" size={18} color={cardColors.primary} />
            <ThemedText type="small" style={{ color: cardColors.primary }}>
              Salvar Preset
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.shareButton, { backgroundColor: '#25D366' }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <AnimatedButton
          variant="accent"
          size="large"
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              {cardType === 'demand' ? 'Publicar Demanda' : 'Publicar Oferta'}
            </>
          )}
        </AnimatedButton>
      </ScreenKeyboardAwareScrollView>

      <Modal visible={showPresetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText type="h3" style={{ marginBottom: Spacing.lg }}>Salvar Preset</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nome do preset"
                placeholderTextColor={colors.textSecondary}
                value={presetName}
                onChangeText={setPresetName}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowPresetModal(false)}
              >
                <ThemedText type="body">Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: cardColors.primary }]}
                onPress={handleSavePreset}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF' }}>Salvar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExtrasModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText type="h3" style={{ marginBottom: Spacing.lg }}>Adicionar Condicao</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Pagamento semanal"
                placeholderTextColor={colors.textSecondary}
                value={newCondition}
                onChangeText={setNewCondition}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowExtrasModal(false)}
              >
                <ThemedText type="body">Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: cardColors.primary }]}
                onPress={() => { addCustomCondition(); setShowExtrasModal(false); }}
              >
                <ThemedText type="body" style={{ color: '#FFFFFF' }}>Adicionar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  presetsSection: {
    marginBottom: Spacing.lg,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  servicesContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  inputContainer: {
    marginTop: Spacing.lg,
  },
  label: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 50,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaWrapper: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  radiusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  priceTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extrasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  extraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  customConditions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  savePresetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  thumbsUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  thumbsUpContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  thumbsUpText: {
    color: '#FFB800',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
});
