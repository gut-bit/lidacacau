import React from 'react';
import { StyleSheet, View, Pressable, FlatList, Image as RNImage, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface JobPhotoPickerProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
}

export function JobPhotoPicker({ photos, onPhotosChange }: JobPhotoPickerProps) {
    const { isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;
    const [isPicking, setIsPicking] = React.useState(false);

    const handlePickPhoto = async () => {
        setIsPicking(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled) {
                onPhotosChange([...photos, result.assets[0].uri]);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar a foto');
        } finally {
            setIsPicking(false);
        }
    };

    const handleRemovePhoto = (index: number) => {
        onPhotosChange(photos.filter((_, i) => i !== index));
    };

    return (
        <View style={styles.container}>
            <ThemedText type="small" style={styles.label}>
                Fotos da Demanda
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.md }}>
                Adicione fotos para aumentar as chances de receber propostas
            </ThemedText>

            {photos.length > 0 && (
                <FlatList
                    data={photos}
                    renderItem={({ item, index }) => (
                        <View style={styles.photoWrapper}>
                            <RNImage source={{ uri: item }} style={styles.photoThumbnail} />
                            <Pressable
                                style={[styles.removeButton, { backgroundColor: colors.error }]}
                                onPress={() => handleRemovePhoto(index)}
                            >
                                <Feather name="x" size={16} color="#FFFFFF" />
                            </Pressable>
                        </View>
                    )}
                    keyExtractor={(_, index) => `photo-${index}`}
                    horizontal
                    scrollEnabled={false}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
                />
            )}

            <Pressable
                style={[
                    styles.addButton,
                    {
                        backgroundColor: colors.primary,
                        borderColor: colors.border,
                        opacity: isPicking ? 0.6 : 1,
                    },
                ]}
                onPress={handlePickPhoto}
                disabled={isPicking}
            >
                {isPicking ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        <Feather name="image" size={20} color="#FFFFFF" />
                        <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                            Adicionar Foto ({photos.length})
                        </ThemedText>
                    </>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
    },
    label: {
        fontWeight: '500',
        marginBottom: Spacing.sm,
    },
    list: {
        paddingVertical: Spacing.md,
    },
    photoWrapper: {
        position: 'relative',
    },
    photoThumbnail: {
        width: 100,
        height: 100,
        borderRadius: BorderRadius.xs,
        backgroundColor: '#f0f0f0',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xs,
        marginTop: Spacing.sm,
    },
});
