import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { updateUser } from '@/utils/storage';
import { PortfolioItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

export default function PortfolioScreen() {
  const { theme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.portfolio) {
        setPortfolio(user.portfolio);
      }
    }, [user])
  );

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao Necessaria', 'Precisamos de acesso a galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      try {
        const newItem: PortfolioItem = {
          id: Date.now().toString(),
          photoUri: result.assets[0].uri,
          description: '',
          serviceTypeId: '',
          createdAt: new Date().toISOString(),
        };

        const updatedPortfolio = [...portfolio, newItem];
        setPortfolio(updatedPortfolio);

        if (user) {
          await updateUser(user.id, { portfolio: updatedPortfolio });
          await refreshUser();
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso!', 'Foto adicionada ao portfolio.');
      } catch (error) {
        Alert.alert('Erro', 'Nao foi possivel adicionar a foto.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeletePhoto = async (itemId: string) => {
    Alert.alert(
      'Remover Foto',
      'Deseja remover esta foto do seu portfolio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updatedPortfolio = portfolio.filter((p) => p.id !== itemId);
            setPortfolio(updatedPortfolio);
            setSelectedImage(null);

            if (user) {
              await updateUser(user.id, { portfolio: updatedPortfolio });
              await refreshUser();
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const renderPortfolioItem = ({ item }: { item: PortfolioItem }) => (
    <Pressable
      style={styles.imageContainer}
      onPress={() => setSelectedImage(item)}
    >
      <Image
        source={{ uri: item.photoUri }}
        style={styles.image}
        contentFit="cover"
      />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Spacing.xl }]}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: colors.primary }}>
              {portfolio.length}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Fotos
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Maximo
            </ThemedText>
            <ThemedText type="h3" style={{ color: colors.text }}>
              20
            </ThemedText>
          </View>
        </View>

        <Button
          onPress={handleAddPhoto}
          disabled={isUploading || portfolio.length >= 20}
          style={{ marginTop: Spacing.lg, width: '100%' }}
        >
          <View style={styles.addButtonContent}>
            <Feather name="plus" size={18} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
              {isUploading ? 'Enviando...' : 'Adicionar Foto'}
            </ThemedText>
          </View>
        </Button>
      </View>

      {portfolio.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <Feather name="image" size={48} color={colors.textSecondary} />
          </View>
          <ThemedText type="h4" style={{ marginTop: Spacing.lg, textAlign: 'center' }}>
            Seu Portfolio esta Vazio
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
            Adicione fotos dos seus trabalhos para mostrar suas habilidades aos produtores.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={portfolio}
          renderItem={renderPortfolioItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedImage && (
        <Pressable
          style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.9)' }]}
          onPress={() => setSelectedImage(null)}
        >
          <Pressable 
            style={styles.closeButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <Image
            source={{ uri: selectedImage.photoUri }}
            style={styles.fullImage}
            contentFit="contain"
          />
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={() => handleDeletePhoto(selectedImage.id)}
            >
              <Feather name="trash-2" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm }}>
                Remover
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.6)', marginTop: Spacing.md }}>
            Adicionada em {new Date(selectedImage.createdAt).toLocaleDateString('pt-BR')}
          </ThemedText>
        </Pressable>
      )}

      <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary, marginBottom: insets.bottom + Spacing.lg }]}>
        <Feather name="info" size={18} color={colors.primary} />
        <ThemedText type="small" style={{ flex: 1, color: colors.textSecondary, marginLeft: Spacing.sm }}>
          Dica: Adicione fotos de antes e depois dos seus trabalhos para impressionar os produtores!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: Spacing.xs,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
