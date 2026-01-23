import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { ServiceTypeSelector } from '@/components/producer/ServiceTypeSelector';
import { JobPhotoPicker } from '@/components/producer/JobPhotoPicker';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { createJob } from '@/utils/storage';
import { formatCurrency } from '@/utils/format';

export default function CreateJobScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [serviceTypeId, setServiceTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [offer, setOffer] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const selectedService = SERVICE_TYPES.find((s) => s.id === serviceTypeId);
  const suggestedPrice = selectedService ? selectedService.basePrice * (parseFloat(quantity) || 0) : 0;

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à localização');
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
        setLocationText(parts.join(', ') || 'Localização obtida');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!serviceTypeId) {
      Alert.alert('Erro', 'Selecione um tipo de serviço');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Erro', 'Informe a quantidade');
      return;
    }
    if (!locationText.trim()) {
      Alert.alert('Erro', 'Informe a localização');
      return;
    }
    if (!offer || parseFloat(offer) <= 0) {
      Alert.alert('Erro', 'Informe o valor da oferta');
      return;
    }
    if (!notes.trim()) {
      Alert.alert('Atenção', 'Por favor, adicione uma descrição detalhada da demanda');
      return;
    }

    setIsSubmitting(true);
    try {
      await createJob({
        producerId: user!.id,
        serviceTypeId,
        quantity: parseFloat(quantity),
        locationText: locationText.trim(),
        latitude,
        longitude,
        offer: parseFloat(offer),
        notes: notes.trim(),
        photos: photos.length > 0 ? photos : undefined,
      });
      Alert.alert('Sucesso', 'Demanda criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a demanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <ThemedText type="small" style={styles.sectionTitle}>
          Tipo de Serviço
        </ThemedText>

        <ServiceTypeSelector selectedId={serviceTypeId} onSelect={setServiceTypeId} />

        {selectedService && (
          <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <ThemedText type="small" style={{ color: colors.primary, flex: 1 }}>
              Nível mínimo: N{selectedService.minLevel} | Preço base: {formatCurrency(selectedService.basePrice)}/{selectedService.unit}
            </ThemedText>
          </View>
        )}

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Quantidade {selectedService ? `(${selectedService.unit})` : ''}
          </ThemedText>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ex: 100"
              placeholderTextColor={colors.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
          {suggestedPrice > 0 && (
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              Sugestão: {formatCurrency(suggestedPrice)} (base)
            </ThemedText>
          )}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Localização
          </ThemedText>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
            ]}
          >
            <Feather name="map-pin" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Endereço ou descrição"
              placeholderTextColor={colors.textSecondary}
              value={locationText}
              onChangeText={setLocationText}
            />
          </View>
          <Pressable
            style={[styles.locationButton, { backgroundColor: colors.primary }]}
            onPress={handleGetLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                  Usar minha localização
                </ThemedText>
              </>
            )}
          </Pressable>
          {latitude && longitude && (
            <ThemedText type="small" style={{ color: colors.success, marginTop: Spacing.xs }}>
              GPS capturado com sucesso
            </ThemedText>
          )}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Oferta (R$)
          </ThemedText>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
            ]}
          >
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              R$
            </ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              value={offer}
              onChangeText={setOffer}
              keyboardType="numeric"
            />
          </View>
        </View>

        <JobPhotoPicker photos={photos} onPhotosChange={setPhotos} />

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Descrição Detalhada *
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.accent, marginBottom: Spacing.md }}>
            💡 Dica: Quanto melhor a descrição, mais propostas você receberá
          </ThemedText>
          <View
            style={[
              styles.tipsBox,
              { backgroundColor: colors.accent + '10', borderColor: colors.accent },
            ]}
          >
            <Feather name="info" size={14} color={colors.accent} />
            <ThemedText type="small" style={{ color: colors.accent, flex: 1 }}>
              Inclua: padrão desejado, requisitos especiais, urgência, contatos, referências
            </ThemedText>
          </View>
          <View
            style={[
              styles.textAreaWrapper,
              { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Descreva a demanda com detalhes..."
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button onPress={handleSubmit} disabled={isSubmitting} style={styles.submitButton}>
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : 'Publicar Demanda'}
        </Button>
      </ScreenKeyboardAwareScrollView>
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
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
  inputContainer: {
    marginTop: Spacing.xl,
  },
  label: {
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaWrapper: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
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
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.sm,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing['2xl'],
  },
});
