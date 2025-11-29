import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PortfolioItem, Certificate, PersonalBackground } from '@/types';
import { trackEvent } from '@/utils/analytics';
import { RootStackParamList } from '@/navigation/RootNavigator';

const generateId = () => Math.random().toString(36).substring(2, 11);

const PROFILE_TIPS = [
  { icon: 'camera', text: 'Uma foto de rosto sorrindo passa confianca' },
  { icon: 'edit-3', text: 'Conte sua historia - de onde veio e o que faz' },
  { icon: 'image', text: 'Fotos dos trabalhos mostram sua experiencia' },
  { icon: 'users', text: 'Quem e da familia? Isso ajuda a criar lacos' },
  { icon: 'award', text: 'Cursos e certificados valorizam seu perfil' },
];

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  progress?: number;
  color: string;
}

function SectionHeader({ icon, title, subtitle, progress, color }: SectionHeaderProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.sectionInfo}>
        <ThemedText type="h4">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: colors.textSecondary }}>{subtitle}</ThemedText>
        ) : null}
      </View>
      {progress !== undefined ? (
        <View style={[styles.progressBadge, { backgroundColor: progress === 100 ? colors.success + '20' : colors.warning + '20' }]}>
          <ThemedText type="small" style={{ color: progress === 100 ? colors.success : colors.warning, fontWeight: '600' }}>
            {progress}%
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  
  const [bio, setBio] = useState(user?.workerProfile?.bio || user?.producerProfile?.bio || '');
  
  const [birthPlace, setBirthPlace] = useState(user?.personalBackground?.birthPlace || '');
  const [yearsInRegion, setYearsInRegion] = useState(user?.personalBackground?.yearsInRegion?.toString() || '');
  const [familyConnections, setFamilyConnections] = useState(user?.personalBackground?.familyConnections || '');
  const [personalStory, setPersonalStory] = useState(user?.personalBackground?.personalStory || '');
  const [funFact, setFunFact] = useState(user?.personalBackground?.funFact || '');
  
  const [workPhotos, setWorkPhotos] = useState<PortfolioItem[]>(user?.workPhotos || []);
  const [certificates, setCertificates] = useState<Certificate[]>(user?.certificates || []);
  
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(true);
  }, [name, phone, location, bio, birthPlace, yearsInRegion, familyConnections, personalStory, funFact, workPhotos, certificates]);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateProfile({ avatar: result.assets[0].uri });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
    }
  };

  const handleAddWorkPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: PortfolioItem = {
          id: generateId(),
          photoUri: result.assets[0].uri,
          createdAt: new Date().toISOString(),
        };
        setWorkPhotos([...workPhotos, newPhoto]);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error picking work photo:', error);
    }
  };

  const handleRemoveWorkPhoto = (photoId: string) => {
    Alert.alert(
      'Remover foto',
      'Tem certeza que deseja remover esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => setWorkPhotos(workPhotos.filter(p => p.id !== photoId))
        },
      ]
    );
  };

  const handleAddCertificate = async () => {
    Alert.prompt(
      'Adicionar Certificado',
      'Nome do curso ou certificado:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async (title?: string) => {
            if (title?.trim()) {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              const newCert: Certificate = {
                id: generateId(),
                title: title.trim(),
                photoUri: result.canceled ? undefined : result.assets[0].uri,
                createdAt: new Date().toISOString(),
              };
              setCertificates([...certificates, newCert]);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleAddCertificateSimple = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newCert: Certificate = {
          id: generateId(),
          title: 'Certificado',
          photoUri: result.assets[0].uri,
          createdAt: new Date().toISOString(),
        };
        setCertificates([...certificates, newCert]);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error picking certificate:', error);
    }
  };

  const handleRemoveCertificate = (certId: string) => {
    Alert.alert(
      'Remover certificado',
      'Tem certeza que deseja remover este certificado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => setCertificates(certificates.filter(c => c.id !== certId))
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome e obrigatorio');
      return;
    }

    setSaving(true);
    try {
      const personalBackground: PersonalBackground = {
        birthPlace: birthPlace.trim() || undefined,
        yearsInRegion: yearsInRegion ? parseInt(yearsInRegion) : undefined,
        familyConnections: familyConnections.trim() || undefined,
        personalStory: personalStory.trim() || undefined,
        funFact: funFact.trim() || undefined,
      };

      const roleProfile = user?.activeRole === 'worker' ? 'workerProfile' : 'producerProfile';
      
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        [roleProfile]: {
          ...(user?.[roleProfile] || {}),
          bio: bio.trim() || undefined,
        },
        personalBackground,
        workPhotos,
        certificates,
      });

      trackEvent('profile_viewed', { action: 'profile_updated' });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Perfil atualizado!',
        'Suas informacoes foram salvas com sucesso.',
        [{ text: 'Otimo!', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar o perfil');
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    let filled = 0;
    let total = 8;
    if (name) filled++;
    if (bio) filled++;
    if (birthPlace) filled++;
    if (personalStory) filled++;
    if (user?.avatar) filled++;
    if (workPhotos.length > 0) filled++;
    if (certificates.length > 0) filled++;
    if (phone || location) filled++;
    return Math.round((filled / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <ScreenKeyboardAwareScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerContent}>
              <ThemedText type="h2">Meu Perfil</ThemedText>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%`, backgroundColor: progress === 100 ? colors.success : colors.primary }
                    ]} 
                  />
                </View>
                <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>
                  {progress}% completo
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
            <Feather name="info" size={18} color={colors.accent} />
            <ThemedText type="small" style={[styles.tipText, { color: colors.textSecondary }]}>
              Um perfil completo gera mais confianca e oportunidades na comunidade!
            </ThemedText>
          </View>

          <Pressable style={styles.avatarSection} onPress={handlePickAvatar}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Feather name="user" size={40} color="#FFFFFF" />
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.link }]}>
                <Feather name="camera" size={16} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText type="body" style={{ color: colors.link, marginTop: Spacing.sm }}>
              {user?.avatar ? 'Trocar foto' : 'Adicionar foto'}
            </ThemedText>
          </Pressable>

          <View style={styles.section}>
            <SectionHeader
              icon="user"
              title="Informacoes Basicas"
              subtitle="Nome e contato"
              color={colors.primary}
            />
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>Nome completo</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText type="small" style={styles.label}>Telefone</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                  <Feather name="phone" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                <ThemedText type="small" style={styles.label}>Localidade</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                  <Feather name="map-pin" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Km, vila..."
                    placeholderTextColor={colors.textSecondary}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="edit-3"
              title="Quem sou eu"
              subtitle="Conte sua historia"
              color={colors.secondary}
            />
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>Bio - Fale um pouco sobre voce</ThemedText>
              <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Conte sobre sua experiencia, o que gosta de fazer, especialidades..."
                  placeholderTextColor={colors.textSecondary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                />
              </View>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Ex: "Trabalho com cacau ha 15 anos, especialista em poda e colheita..."
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="home"
              title="Minha Origem"
              subtitle="De onde voce vem?"
              color={colors.handshake}
            />
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText type="small" style={styles.label}>Onde nasceu?</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Cidade, estado"
                    placeholderTextColor={colors.textSecondary}
                    value={birthPlace}
                    onChangeText={setBirthPlace}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                <ThemedText type="small" style={styles.label}>Anos na regiao</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Ex: 10"
                    placeholderTextColor={colors.textSecondary}
                    value={yearsInRegion}
                    onChangeText={setYearsInRegion}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>Parentes na regiao (opcional)</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                <Feather name="users" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Filho do Seu Joao do Km 120"
                  placeholderTextColor={colors.textSecondary}
                  value={familyConnections}
                  onChangeText={setFamilyConnections}
                />
              </View>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Isso ajuda a comunidade a conhecer voce melhor
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>Sua historia (opcional)</ThemedText>
              <View style={[styles.textAreaWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Como veio parar na regiao? O que te trouxe aqui?"
                  placeholderTextColor={colors.textSecondary}
                  value={personalStory}
                  onChangeText={setPersonalStory}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>Curiosidade sobre voce (opcional)</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
                <Feather name="star" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Melhor pescador da regiao!"
                  placeholderTextColor={colors.textSecondary}
                  value={funFact}
                  onChangeText={setFunFact}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="image"
              title="Fotos dos Trabalhos"
              subtitle="Mostre sua experiencia"
              color="#8B5CF6"
            />
            
            <View style={styles.photoGrid}>
              {workPhotos.map((photo) => (
                <Pressable 
                  key={photo.id} 
                  style={styles.photoItem}
                  onLongPress={() => handleRemoveWorkPhoto(photo.id)}
                >
                  <Image source={{ uri: photo.photoUri }} style={styles.photoImage} contentFit="cover" />
                  <Pressable 
                    style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRemoveWorkPhoto(photo.id)}
                  >
                    <Feather name="x" size={12} color="#FFF" />
                  </Pressable>
                </Pressable>
              ))}
              <Pressable 
                style={[styles.addPhotoBtn, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}
                onPress={handleAddWorkPhoto}
              >
                <Feather name="plus" size={24} color={colors.textSecondary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
                  Adicionar
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              Fotos de trabalhos anteriores geram confianca
            </ThemedText>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="award"
              title="Cursos e Certificados"
              subtitle="Formacoes e capacitacoes"
              color={colors.accent}
            />
            
            <View style={styles.certList}>
              {certificates.map((cert) => (
                <View 
                  key={cert.id} 
                  style={[styles.certItem, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}
                >
                  {cert.photoUri ? (
                    <Image source={{ uri: cert.photoUri }} style={styles.certImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.certImagePlaceholder, { backgroundColor: colors.accent + '20' }]}>
                      <Feather name="file-text" size={20} color={colors.accent} />
                    </View>
                  )}
                  <View style={styles.certInfo}>
                    <ThemedText type="body" numberOfLines={2}>{cert.title}</ThemedText>
                    {cert.institution ? (
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        {cert.institution}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Pressable 
                    style={styles.certRemoveBtn}
                    onPress={() => handleRemoveCertificate(cert.id)}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={16} color={colors.error} />
                  </Pressable>
                </View>
              ))}
              
              <Pressable 
                style={[styles.addCertBtn, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}
                onPress={handleAddCertificateSimple}
              >
                <Feather name="plus-circle" size={20} color={colors.accent} />
                <ThemedText type="body" style={{ color: colors.accent, marginLeft: Spacing.sm }}>
                  Adicionar certificado
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              icon="message-circle"
              title="Recomendacoes"
              subtitle="O que dizem sobre voce"
              color={colors.success}
            />
            
            <View style={[styles.comingSoon, { backgroundColor: colors.backgroundDefault, borderColor: colors.border }]}>
              <Feather name="mic" size={32} color={colors.textSecondary} />
              <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
                Em breve voce podera receber recomendacoes em texto ou audio de pessoas que trabalharam com voce!
              </ThemedText>
            </View>
          </View>

          <Button
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>

          <View style={styles.tipsSection}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>Dicas para um bom perfil:</ThemedText>
            {PROFILE_TIPS.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name={tip.icon as any} size={14} color={colors.primary} />
                </View>
                <ThemedText type="small" style={{ flex: 1, color: colors.textSecondary }}>
                  {tip.text}
                </ThemedText>
              </View>
            ))}
          </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    maxWidth: 120,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  tipText: {
    flex: 1,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  progressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  textAreaWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certList: {
    gap: Spacing.sm,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  certImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
  },
  certImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  certRemoveBtn: {
    padding: Spacing.xs,
  },
  addCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  saveButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tipsSection: {
    marginBottom: Spacing.xl,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
});
