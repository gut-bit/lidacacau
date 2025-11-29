import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { User } from '@/types';
import { SocialLinksDisplay } from '@/components/SocialLinks';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  workOrderId: string;
  worker: User;
  producer: User;
  serviceName: string;
  price: number;
  isProducer: boolean;
}

export default function NegotiationMatchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { theme } = useTheme();
  const colors = theme;

  const { workOrderId, worker, producer, serviceName, price, isProducer } = route.params;

  const overlayOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const avatarsScale = useSharedValue(0);
  const avatarsTranslateY = useSharedValue(50);
  const connectLineWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const detailsOpacity = useSharedValue(0);
  const detailsTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    overlayOpacity.value = withTiming(1, { duration: 300 });

    iconScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 150 }));
    iconRotate.value = withDelay(200, withSequence(
      withTiming(15, { duration: 150 }),
      withSpring(0, { damping: 8 })
    ));

    titleScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 120 }));
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    avatarsScale.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 100 }));
    avatarsTranslateY.value = withDelay(600, withSpring(0, { damping: 15 }));

    connectLineWidth.value = withDelay(900, withTiming(80, { duration: 400, easing: Easing.out(Easing.cubic) }));

    pulseScale.value = withDelay(1000, withSequence(
      withTiming(1.15, { duration: 400 }),
      withTiming(1, { duration: 400 })
    ));

    detailsOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));
    detailsTranslateY.value = withDelay(1200, withSpring(0, { damping: 15 }));

    buttonOpacity.value = withDelay(1500, withTiming(1, { duration: 300 }));
    buttonTranslateY.value = withDelay(1500, withSpring(0, { damping: 15 }));

    confettiOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const avatarsStyle = useAnimatedStyle(() => ({
    opacity: avatarsScale.value,
    transform: [
      { scale: avatarsScale.value },
      { translateY: avatarsTranslateY.value },
    ],
  }));

  const connectLineStyle = useAnimatedStyle(() => ({
    width: connectLineWidth.value,
    opacity: interpolate(connectLineWidth.value, [0, 80], [0, 1]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.value,
    transform: [{ translateY: detailsTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleNegotiate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('NegotiationTerms' as any, {
      workOrderId,
      worker,
      producer,
      serviceName,
      price,
      isProducer,
    });
  };

  const handleSignContract = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace('ContractSigning' as any, {
      workOrderId,
      isProducer,
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleWhatsApp = async (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const phone = user.socialLinks?.whatsapp || user.phone;
    if (!phone) {
      Alert.alert('Sem contato', 'Este usuario nao possui telefone cadastrado.');
      return;
    }
    
    let cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone) {
      Alert.alert('Numero invalido', 'O numero de telefone informado nao e valido.');
      return;
    }
    
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    } else if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = '55' + cleanPhone;
    } else if (cleanPhone.length < 10) {
      Alert.alert('Numero incompleto', 'O numero de telefone parece estar incompleto. Verifique e tente novamente.');
      return;
    }
    
    const message = encodeURIComponent(`Ola ${user.name.split(' ')[0]}! Vi que fechamos acordo no LidaCacau para ${serviceName}. Vamos conversar?`);
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp nao encontrado', 'Nao foi possivel abrir o WhatsApp. Verifique se o aplicativo esta instalado no seu dispositivo.');
      }
    } catch (error) {
      Alert.alert('Erro ao abrir', 'Ocorreu um erro ao tentar abrir o WhatsApp. Tente novamente.');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.confettiContainer, confettiStyle]}>
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  backgroundColor: i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.success : colors.primary,
                  left: `${10 + (i * 7)}%`,
                  top: `${5 + (i % 4) * 8}%`,
                  transform: [{ rotate: `${i * 30}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
            <Feather name="check" size={48} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View style={titleStyle}>
          <ThemedText type="h1" style={styles.title}>
            Acordo Fechado!
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isProducer ? 'Voc\u00ea aceitou a proposta' : 'Sua proposta foi aceita'}
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.avatarsContainer, avatarsStyle, pulseStyle]}>
          <View style={[styles.avatarWrapper, { backgroundColor: colors.primary }]}>
            <ThemedText type="h3" style={styles.avatarText}>
              {getInitials(producer.name)}
            </ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: colors.success }]}>
              <Feather name="briefcase" size={10} color="#FFF" />
            </View>
          </View>

          <Animated.View style={[styles.connectLine, connectLineStyle, { backgroundColor: colors.accent }]}>
            <View style={[styles.connectDot, { backgroundColor: colors.accent }]} />
            <View style={[styles.connectDot, { backgroundColor: colors.accent }]} />
            <View style={[styles.connectDot, { backgroundColor: colors.accent }]} />
          </Animated.View>

          <View style={[styles.avatarWrapper, { backgroundColor: colors.secondary }]}>
            <ThemedText type="h3" style={styles.avatarText}>
              {getInitials(worker.name)}
            </ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
              <Feather name="tool" size={10} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.namesContainer, avatarsStyle]}>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {producer.name.split(' ')[0]}
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {worker.name.split(' ')[0]}
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.detailsCard, detailsStyle, { backgroundColor: colors.card + 'E6' }]}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Feather name="briefcase" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                Servi\u00e7o
              </ThemedText>
            </View>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {serviceName}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Feather name="dollar-sign" size={16} color={colors.textSecondary} />
              <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                Valor Acordado
              </ThemedText>
            </View>
            <ThemedText type="h4" style={{ color: colors.success }}>
              {formatCurrency(price)}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View style={[styles.contactSection, detailsStyle]}>
          <ThemedText type="small" style={[styles.contactTitle, { color: colors.textSecondary }]}>
            Contato Rapido
          </ThemedText>
          <View style={styles.contactButtons}>
            <Pressable
              style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
              onPress={() => handleWhatsApp(isProducer ? worker : producer)}
            >
              <Feather name="message-circle" size={18} color="#FFFFFF" />
              <ThemedText type="small" style={styles.whatsappText}>
                Falar com {isProducer ? worker.name.split(' ')[0] : producer.name.split(' ')[0]}
              </ThemedText>
            </Pressable>
          </View>
          {(worker.socialLinks || producer.socialLinks) && (
            <View style={styles.socialLinksRow}>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.xs }}>
                Redes Sociais
              </ThemedText>
              <SocialLinksDisplay 
                socialLinks={(isProducer ? worker : producer).socialLinks || {}} 
              />
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.negotiationPrompt, detailsStyle]}>
          <Feather name="file-text" size={20} color={colors.accent} />
          <ThemedText type="body" style={[styles.promptText, { color: colors.text }]}>
            Defina os termos e assine o contrato
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.tipsSection, detailsStyle]}>
          <ThemedText type="small" style={[styles.tipTitle, { color: colors.success }]}>
            Dicas para um bom acordo:
          </ThemedText>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>
                Combine o pagamento antes de comecar
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>
                Confirme horarios e local pelo WhatsApp
              </ThemedText>
            </View>
            <View style={styles.tipItem}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>
                Assine o contrato para garantir seus direitos
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonsContainer, buttonStyle]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleNegotiate}
          >
            <Feather name="sliders" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.buttonText}>
              Negociar Termos
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.success, opacity: pressed ? 0.9 : 1, marginTop: Spacing.md },
            ]}
            onPress={handleSignContract}
          >
            <Feather name="edit-3" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.buttonText}>
              Assinar Contrato Agora
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleSkip}
          >
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Depois
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  iconContainer: {
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  connectLine: {
    height: 4,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  connectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    marginBottom: Spacing['3xl'],
  },
  detailsCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  negotiationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  promptText: {
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  contactSection: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  contactTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  whatsappText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  socialLinksRow: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  tipsSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tipsList: {
    gap: Spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
});
