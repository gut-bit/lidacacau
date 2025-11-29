import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, TextInput, Platform, Linking } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getPropertyById, addPropertyDocument, deletePropertyDocument } from '@/utils/storage';
import { PropertyDocument, PropertyDetail, PROPERTY_DOCUMENT_TYPES, PropertyVerificationStatus } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDocuments'>;

type DocumentType = PropertyDocument['type'];

export default function PropertyDocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { propertyId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadProperty = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPropertyById(propertyId);
      setProperty(data);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar a propriedade');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [loadProperty])
  );

  const getVerificationStats = () => {
    if (!property?.documents.length) {
      return { total: 0, verified: 0, pending: 0, rejected: 0 };
    }
    return {
      total: property.documents.length,
      verified: property.documents.filter(d => d.verificationStatus === 'verified').length,
      pending: property.documents.filter(d => d.verificationStatus === 'pending').length,
      rejected: property.documents.filter(d => d.verificationStatus === 'rejected').length,
    };
  };

  const getStatusColor = (status: PropertyVerificationStatus): string => {
    switch (status) {
      case 'verified': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: PropertyVerificationStatus): string => {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'pending': return 'Em analise';
      case 'rejected': return 'Rejeitado';
      default: return 'Nao verificado';
    }
  };

  const getDocTypeInfo = (type: DocumentType) => {
    return PROPERTY_DOCUMENT_TYPES.find(dt => dt.id === type);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/json', 'application/vnd.google-earth.kml+xml', '*/*'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar o arquivo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'documento.jpg';
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: 'image/jpeg',
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar a imagem');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao Necessaria', 'Precisamos de acesso a camera para tirar a foto');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `documento_${Date.now()}.jpg`;
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          mimeType: 'image/jpeg',
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel tirar a foto');
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedDocType || !selectedFile || !title.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatorios');
      return;
    }

    if (selectedDocType === 'car' && !carNumber.trim()) {
      Alert.alert('Erro', 'O numero do CAR e obrigatorio para este tipo de documento');
      return;
    }

    setIsUploading(true);
    try {
      await addPropertyDocument(
        propertyId,
        {
          type: selectedDocType,
          title: title.trim(),
          description: description.trim() || undefined,
          fileUri: selectedFile.uri,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.mimeType,
          carNumber: selectedDocType === 'car' ? carNumber.trim() : undefined,
        },
        user.id
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      resetForm();
      await loadProperty();
      Alert.alert('Sucesso', 'Documento enviado para verificacao');
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel enviar o documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    Alert.alert(
      'Excluir Documento',
      'Tem certeza que deseja excluir este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              await deletePropertyDocument(propertyId, documentId, user.id);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              await loadProperty();
            } catch (error) {
              Alert.alert('Erro', 'Nao foi possivel excluir o documento');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setSelectedDocType(null);
    setTitle('');
    setDescription('');
    setCarNumber('');
    setSelectedFile(null);
  };

  const openCARPortal = async () => {
    const url = 'https://consultapublica.car.gov.br/';
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(url);
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel abrir o portal');
    }
  };

  const stats = getVerificationStats();

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!property) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <ThemedText type="h3" style={{ marginTop: Spacing.md }}>
          Propriedade nao encontrada
        </ThemedText>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: Spacing.xl }}>
          Voltar
        </Button>
      </ThemedView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h3">{property.name}</ThemedText>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          Documentos da Propriedade
        </ThemedText>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card }, Shadows.card]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Status da Verificacao
        </ThemedText>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: colors.primary }}>
              {stats.total}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Total
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: colors.success }}>
              {stats.verified}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Verificados
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: colors.warning }}>
              {stats.pending}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Em analise
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: colors.error }}>
              {stats.rejected}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Rejeitados
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.secondary + '15' }]}>
        <View style={styles.infoHeader}>
          <Feather name="info" size={20} color={colors.secondary} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Como obter o CAR
          </ThemedText>
        </View>
        <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
          O Cadastro Ambiental Rural (CAR) e um registro eletronico obrigatorio para todos os imoveis rurais.
          Voce pode consultar ou registrar seu CAR no portal do Sistema Nacional de Cadastro Ambiental Rural (SICAR).
        </ThemedText>
        <Pressable
          style={[styles.linkButton, { backgroundColor: colors.secondary }]}
          onPress={openCARPortal}
        >
          <Feather name="external-link" size={16} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm }}>
            Acessar Portal do CAR
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Documentos Enviados</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowUploadForm(true);
          }}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {property.documents.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="file-text" size={48} color={colors.textSecondary} />
          <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
            Nenhum documento enviado ainda.{'\n'}Adicione documentos para verificar sua propriedade.
          </ThemedText>
        </View>
      ) : (
        property.documents.map((doc) => {
          const docTypeInfo = getDocTypeInfo(doc.type);
          return (
            <View
              key={doc.id}
              style={[styles.documentCard, { backgroundColor: colors.card }, Shadows.card]}
            >
              <View style={styles.documentHeader}>
                <View style={[styles.docIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name={docTypeInfo?.icon as any || 'file'} size={24} color={colors.primary} />
                </View>
                <View style={styles.documentInfo}>
                  <ThemedText type="h4" numberOfLines={1}>
                    {doc.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {docTypeInfo?.label}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleDelete(doc.id)}
                  style={styles.deleteButton}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={18} color={colors.error} />
                </Pressable>
              </View>

              <View style={styles.documentDetails}>
                <View style={styles.detailRow}>
                  <Feather name="file" size={14} color={colors.textSecondary} />
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }} numberOfLines={1}>
                    {doc.fileName} {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
                  </ThemedText>
                </View>

                {doc.carNumber ? (
                  <View style={styles.detailRow}>
                    <Feather name="hash" size={14} color={colors.textSecondary} />
                    <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                      CAR: {doc.carNumber}
                    </ThemedText>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={colors.textSecondary} />
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                    Enviado em {formatDate(doc.uploadedAt)}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.verificationStatus) + '20' }]}>
                <Feather
                  name={doc.verificationStatus === 'verified' ? 'check-circle' : doc.verificationStatus === 'rejected' ? 'x-circle' : 'clock'}
                  size={14}
                  color={getStatusColor(doc.verificationStatus)}
                />
                <ThemedText type="small" style={{ color: getStatusColor(doc.verificationStatus), marginLeft: Spacing.xs, fontWeight: '600' }}>
                  {getStatusLabel(doc.verificationStatus)}
                </ThemedText>
              </View>

              {doc.verificationStatus === 'rejected' && doc.rejectionReason ? (
                <View style={[styles.rejectionReason, { backgroundColor: colors.error + '10' }]}>
                  <ThemedText type="small" style={{ color: colors.error }}>
                    Motivo: {doc.rejectionReason}
                  </ThemedText>
                </View>
              ) : null}

              {doc.description ? (
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                  {doc.description}
                </ThemedText>
              ) : null}
            </View>
          );
        })
      )}

      {showUploadForm ? (
        <View style={[styles.uploadForm, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.formHeader}>
            <ThemedText type="h4">Novo Documento</ThemedText>
            <Pressable onPress={resetForm}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ThemedText type="body" style={{ marginBottom: Spacing.sm }}>
            Tipo de Documento *
          </ThemedText>
          <View style={styles.docTypesGrid}>
            {PROPERTY_DOCUMENT_TYPES.map((docType) => (
              <Pressable
                key={docType.id}
                style={[
                  styles.docTypeOption,
                  { backgroundColor: colors.backgroundSecondary, borderColor: selectedDocType === docType.id ? colors.primary : 'transparent' },
                  selectedDocType === docType.id && { borderWidth: 2 },
                ]}
                onPress={() => {
                  setSelectedDocType(docType.id as DocumentType);
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Feather
                  name={docType.icon as any}
                  size={20}
                  color={selectedDocType === docType.id ? colors.primary : colors.textSecondary}
                />
                <ThemedText
                  type="small"
                  style={{
                    marginTop: Spacing.xs,
                    color: selectedDocType === docType.id ? colors.primary : colors.textSecondary,
                    textAlign: 'center',
                  }}
                  numberOfLines={2}
                >
                  {docType.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="body" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Titulo do Documento *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: CAR da Fazenda Serra Azul"
            placeholderTextColor={colors.textSecondary}
          />

          {selectedDocType === 'car' ? (
            <>
              <ThemedText type="body" style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
                Numero do CAR *
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={carNumber}
                onChangeText={setCarNumber}
                placeholder="Ex: PA-1234567-ABCD..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
            </>
          ) : null}

          <ThemedText type="body" style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            Descricao (opcional)
          </ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Informacoes adicionais sobre o documento..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <ThemedText type="body" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            Arquivo *
          </ThemedText>
          
          {selectedFile ? (
            <View style={[styles.selectedFileCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Feather name="file" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText type="body" numberOfLines={1}>
                  {selectedFile.name}
                </ThemedText>
                {selectedFile.size ? (
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {formatFileSize(selectedFile.size)}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable onPress={() => setSelectedFile(null)}>
                <Feather name="x" size={20} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <Pressable
                style={[styles.uploadOption, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={pickDocument}
              >
                <Feather name="file" size={24} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Arquivo
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.uploadOption, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={pickImage}
              >
                <Feather name="image" size={24} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Galeria
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.uploadOption, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={takePhoto}
              >
                <Feather name="camera" size={24} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Camera
                </ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.formButtons}>
            <Button
              variant="outline"
              onPress={resetForm}
              style={{ flex: 1, marginRight: Spacing.sm }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleUpload}
              style={{ flex: 1, marginLeft: Spacing.sm }}
              disabled={isUploading || !selectedDocType || !selectedFile || !title.trim()}
            >
              {isUploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </View>
        </View>
      ) : null}

      <View style={{ height: Spacing['3xl'] }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  documentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  documentDetails: {
    marginTop: Spacing.md,
    marginLeft: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  rejectionReason: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  uploadForm: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  docTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  docTypeOption: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
});
