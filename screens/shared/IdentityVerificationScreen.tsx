import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { updateUser } from '@/utils/storage';
import { IdentityVerification } from '@/types';

type DocumentType = 'rg' | 'cnh' | 'ctps';

const DOCUMENT_TYPES: { id: DocumentType; label: string; icon: string }[] = [
  { id: 'rg', label: 'RG', icon: 'credit-card' },
  { id: 'cnh', label: 'CNH', icon: 'truck' },
  { id: 'ctps', label: 'CTPS', icon: 'book' },
];

export default function IdentityVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [step, setStep] = useState<'intro' | 'document' | 'selfie' | 'review' | 'submitted'>(
    user?.verification?.status === 'pending' ? 'submitted' :
    user?.verification?.status === 'approved' ? 'submitted' : 'intro'
  );
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verification = user?.verification;

  const pickDocumentPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDocumentPhoto(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar a foto');
    }
  };

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao Necessaria', 'Precisamos de acesso a camera para tirar a selfie');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets[0]) {
        setSelfiePhoto(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel tirar a foto');
    }
  };

  const handleSubmit = async () => {
    if (!user || !documentType || !documentPhoto || !selfiePhoto) return;
    
    setIsSubmitting(true);
    try {
      const verificationData: IdentityVerification = {
        status: 'pending',
        documentType,
        documentPhotoUri: documentPhoto,
        selfiePhotoUri: selfiePhoto,
        submittedAt: new Date().toISOString(),
      };
      
      await updateUser(user.id, { verification: verificationData });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('submitted');
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel enviar a verificacao');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIntro = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
        <Feather name="shield" size={48} color={colors.primary} />
      </View>
      <ThemedText type="h2" style={styles.title}>
        Verificar Identidade
      </ThemedText>
      <ThemedText type="body" style={[styles.description, { color: colors.textSecondary }]}>
        A verificacao de identidade aumenta a confianca entre produtores e trabalhadores. 
        Seu perfil recebera um selo de "Verificado".
      </ThemedText>

      <View style={[styles.benefitsCard, { backgroundColor: colors.card }, Shadows.card]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Beneficios
        </ThemedText>
        {[
          { icon: 'check-circle', text: 'Selo de perfil verificado' },
          { icon: 'trending-up', text: 'Maior visibilidade nas buscas' },
          { icon: 'star', text: 'Mais propostas aceitas' },
          { icon: 'lock', text: 'Seguranca para todos' },
        ].map((item, index) => (
          <View key={index} style={styles.benefitRow}>
            <Feather name={item.icon as any} size={20} color={colors.success} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              {item.text}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={[styles.stepsCard, { backgroundColor: colors.backgroundSecondary }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Como funciona
        </ThemedText>
        {[
          { step: '1', text: 'Escolha um documento (RG, CNH ou CTPS)' },
          { step: '2', text: 'Tire uma foto do documento' },
          { step: '3', text: 'Tire uma selfie segurando o documento' },
        ].map((item, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {item.step}
              </ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
              {item.text}
            </ThemedText>
          </View>
        ))}
      </View>

      <Button
        onPress={() => setStep('document')}
        style={{ marginTop: Spacing.xl, width: '100%' }}
      >
        Comecar Verificacao
      </Button>
    </View>
  );

  const renderDocumentStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '33%' }]} />
      </View>

      <ThemedText type="h3" style={styles.stepTitle}>
        1. Escolha o Documento
      </ThemedText>
      <ThemedText type="body" style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Selecione qual documento voce vai usar para a verificacao
      </ThemedText>

      <View style={styles.documentOptions}>
        {DOCUMENT_TYPES.map((doc) => (
          <Pressable
            key={doc.id}
            style={[
              styles.documentOption,
              { backgroundColor: colors.card, borderColor: documentType === doc.id ? colors.primary : colors.border },
              documentType === doc.id && { borderWidth: 2 },
            ]}
            onPress={() => {
              setDocumentType(doc.id);
              Haptics.selectionAsync();
            }}
          >
            <Feather 
              name={doc.icon as any} 
              size={32} 
              color={documentType === doc.id ? colors.primary : colors.textSecondary} 
            />
            <ThemedText 
              type="h4" 
              style={{ 
                marginTop: Spacing.sm,
                color: documentType === doc.id ? colors.primary : colors.text 
              }}
            >
              {doc.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {documentType && (
        <>
          <ThemedText type="h4" style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            Foto do Documento
          </ThemedText>
          
          {documentPhoto ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: documentPhoto }} style={styles.photoPreview} contentFit="cover" />
              <Pressable
                style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                onPress={() => setDocumentPhoto(null)}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.uploadArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={pickDocumentPhoto}
            >
              <Feather name="camera" size={40} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                Toque para adicionar foto
              </ThemedText>
            </Pressable>
          )}
        </>
      )}

      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          onPress={() => setStep('intro')}
          style={{ flex: 1, marginRight: Spacing.sm }}
        >
          Voltar
        </Button>
        <Button
          onPress={() => setStep('selfie')}
          disabled={!documentType || !documentPhoto}
          style={{ flex: 1, marginLeft: Spacing.sm }}
        >
          Proximo
        </Button>
      </View>
    </View>
  );

  const renderSelfieStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '66%' }]} />
      </View>

      <ThemedText type="h3" style={styles.stepTitle}>
        2. Selfie com Documento
      </ThemedText>
      <ThemedText type="body" style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Tire uma selfie segurando o documento ao lado do rosto
      </ThemedText>

      <View style={[styles.tipsCard, { backgroundColor: colors.accent + '15' }]}>
        <Feather name="info" size={20} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <ThemedText type="small" style={{ color: colors.accent, fontWeight: '600' }}>
            Dicas para uma boa foto:
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
            - Boa iluminacao{'\n'}- Documento legivel{'\n'}- Rosto e documento visiveis
          </ThemedText>
        </View>
      </View>

      {selfiePhoto ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: selfiePhoto }} style={styles.selfiePreview} contentFit="cover" />
          <Pressable
            style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
            onPress={() => setSelfiePhoto(null)}
          >
            <Feather name="x" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.uploadArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={takeSelfie}
        >
          <Feather name="camera" size={40} color={colors.textSecondary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            Toque para tirar selfie
          </ThemedText>
        </Pressable>
      )}

      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          onPress={() => setStep('document')}
          style={{ flex: 1, marginRight: Spacing.sm }}
        >
          Voltar
        </Button>
        <Button
          onPress={() => setStep('review')}
          disabled={!selfiePhoto}
          style={{ flex: 1, marginLeft: Spacing.sm }}
        >
          Revisar
        </Button>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
      </View>

      <ThemedText type="h3" style={styles.stepTitle}>
        3. Revisar e Enviar
      </ThemedText>
      <ThemedText type="body" style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Confira as fotos antes de enviar para verificacao
      </ThemedText>

      <View style={styles.reviewSection}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
          Documento: {DOCUMENT_TYPES.find(d => d.id === documentType)?.label}
        </ThemedText>
        {documentPhoto && (
          <Image source={{ uri: documentPhoto }} style={styles.reviewPhoto} contentFit="cover" />
        )}
      </View>

      <View style={styles.reviewSection}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
          Selfie com Documento
        </ThemedText>
        {selfiePhoto && (
          <Image source={{ uri: selfiePhoto }} style={styles.reviewPhoto} contentFit="cover" />
        )}
      </View>

      <View style={[styles.warningCard, { backgroundColor: colors.warning + '15' }]}>
        <Feather name="alert-triangle" size={20} color={colors.warning} />
        <ThemedText type="small" style={{ flex: 1, marginLeft: Spacing.sm, color: colors.textSecondary }}>
          Ao enviar, voce concorda que as informacoes sao verdadeiras. 
          A verificacao pode levar ate 24 horas.
        </ThemedText>
      </View>

      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          onPress={() => setStep('selfie')}
          style={{ flex: 1, marginRight: Spacing.sm }}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          onPress={handleSubmit}
          style={{ flex: 1, marginLeft: Spacing.sm }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Verificacao'}
        </Button>
      </View>
    </View>
  );

  const renderSubmittedStep = () => {
    const isPending = verification?.status === 'pending';
    const isApproved = verification?.status === 'approved';
    const isRejected = verification?.status === 'rejected';

    return (
      <View style={styles.stepContainer}>
        <View style={[
          styles.iconCircle, 
          { backgroundColor: isApproved ? colors.success + '20' : isPending ? colors.accent + '20' : colors.error + '20' }
        ]}>
          <Feather 
            name={isApproved ? 'check-circle' : isPending ? 'clock' : 'x-circle'} 
            size={48} 
            color={isApproved ? colors.success : isPending ? colors.accent : colors.error} 
          />
        </View>

        <ThemedText type="h2" style={styles.title}>
          {isApproved ? 'Verificado!' : isPending ? 'Em Analise' : 'Verificacao Rejeitada'}
        </ThemedText>

        <ThemedText type="body" style={[styles.description, { color: colors.textSecondary }]}>
          {isApproved 
            ? 'Seu perfil foi verificado com sucesso! Agora voce tem um selo de confianca.'
            : isPending 
            ? 'Sua verificacao foi enviada e esta sendo analisada. Voce sera notificado quando for concluida.'
            : verification?.rejectionReason || 'Sua verificacao foi rejeitada. Por favor, tente novamente.'}
        </ThemedText>

        {isApproved && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
            <Feather name="check-circle" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: Spacing.sm }}>
              Perfil Verificado
            </ThemedText>
          </View>
        )}

        {isRejected && (
          <Button
            onPress={() => {
              setStep('intro');
              setDocumentType(null);
              setDocumentPhoto(null);
              setSelfiePhoto(null);
            }}
            style={{ marginTop: Spacing.xl, width: '100%' }}
          >
            Tentar Novamente
          </Button>
        )}

        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginTop: Spacing.md, width: '100%' }}
        >
          Voltar ao Perfil
        </Button>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        {step === 'intro' && renderIntro()}
        {step === 'document' && renderDocumentStep()}
        {step === 'selfie' && renderSelfieStep()}
        {step === 'review' && renderReviewStep()}
        {step === 'submitted' && renderSubmittedStep()}
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  benefitsCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepsCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xl,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepTitle: {
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  documentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  documentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
  },
  uploadArea: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewContainer: {
    width: '100%',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  selfiePreview: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.lg,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    width: '100%',
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.xl,
  },
  reviewSection: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  reviewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  warningCard: {
    width: '100%',
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xl,
  },
});
