import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, ActivityIndicator, FlatList, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Property } from '@/types';
import { getUserById, updateUser } from '@/utils/storage';

export default function PropertyManagementScreen() {
    const { theme, isDark } = useTheme();
    const { user, setUser } = useAuth();
    const insets = useSafeAreaInsets();
    const colors = isDark ? Colors.dark : Colors.light;

    const [properties, setProperties] = useState<Property[]>(user?.properties || []);
    const [isAddingProperty, setIsAddingProperty] = useState(false);
    const [isEditingProperty, setIsEditingProperty] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [editName, setEditName] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [newPropertyName, setNewPropertyName] = useState('');

    const loadProperties = useCallback(async () => {
        if (!user) return;
        try {
            const userData = await getUserById(user.id);
            setProperties(userData?.properties || []);
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    }, [user]);

    useFocusEffect(useCallback(() => {
        loadProperties();
    }, [loadProperties]));

    const handleAddProperty = async () => {
        setIsGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de acesso à localização para adicionar sua propriedade');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            let addressText = 'Localização capturada';
            try {
                const [address] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                if (address) {
                    const parts = [address.street, address.district, address.city].filter(Boolean);
                    if (parts.length > 0) {
                        addressText = parts.join(', ');
                    }
                }
            } catch (geocodeError) {
                console.log('Reverse geocoding not available, using coordinates');
                addressText = `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`;
            }

            setPendingLocation({
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                address: addressText,
            });
            setNewPropertyName(`Propriedade ${properties.length + 1}`);
            setShowNameModal(true);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Erro de Localização',
                'Não conseguimos obter sua localização. Verifique se o GPS está ligado e tente novamente.'
            );
        } finally {
            setIsGettingLocation(false);
        }
    };

    const cancelAddProperty = () => {
        setShowNameModal(false);
        setPendingLocation(null);
        setNewPropertyName('');
    };

    const confirmAddProperty = async () => {
        if (!pendingLocation || !newPropertyName.trim()) return;

        setIsAddingProperty(true);
        try {
            const newProperty: Property = {
                id: Math.random().toString(36).substring(7),
                name: newPropertyName.trim(),
                address: pendingLocation.address,
                latitude: pendingLocation.lat,
                longitude: pendingLocation.lng,
            };

            const updatedProperties = [...properties, newProperty];
            setProperties(updatedProperties);

            if (user) {
                await updateUser(user.id, { properties: updatedProperties });
                setUser({ ...user, properties: updatedProperties });
            }

            setShowNameModal(false);
            setPendingLocation(null);
            setNewPropertyName('');
            Alert.alert('Sucesso', `"${newProperty.name}" foi adicionada!`);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível adicionar a propriedade');
        } finally {
            setIsAddingProperty(false);
        }
    };

    const handleEditProperty = (property: Property) => {
        setEditingProperty(property);
        setEditName(property.name);
        setShowEditModal(true);
    };

    const cancelEditProperty = () => {
        setShowEditModal(false);
        setEditingProperty(null);
        setEditName('');
    };

    const confirmEditProperty = async () => {
        if (!editingProperty || !editName.trim()) return;

        setIsEditingProperty(true);
        try {
            const updatedProperties = properties.map((p) =>
                p.id === editingProperty.id ? { ...p, name: editName.trim() } : p
            );
            setProperties(updatedProperties);

            if (user) {
                await updateUser(user.id, { properties: updatedProperties });
                setUser({ ...user, properties: updatedProperties });
            }

            setShowEditModal(false);
            setEditingProperty(null);
            setEditName('');
            Alert.alert('Sucesso', 'Nome atualizado!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível atualizar');
        } finally {
            setIsEditingProperty(false);
        }
    };

    const handleDeleteProperty = (propertyId: string) => {
        Alert.alert('Remover Propriedade', 'Tem certeza que deseja remover essa propriedade?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const updatedProperties = properties.filter((p) => p.id !== propertyId);
                        setProperties(updatedProperties);

                        if (user) {
                            await updateUser(user.id, { properties: updatedProperties });
                            setUser({ ...user, properties: updatedProperties });
                        }

                        Alert.alert('Sucesso', 'Propriedade removida');
                    } catch (error: any) {
                        Alert.alert('Erro', error.message || 'Não foi possível remover');
                    }
                },
            },
        ]);
    };

    const renderProperty = ({ item }: { item: Property }) => (
        <View style={[styles.propertyCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={styles.propertyContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Feather name="map-pin" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText type="h3">{item.name}</ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                        {item.address}
                    </ThemedText>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <Pressable
                    onPress={() => handleEditProperty(item)}
                    style={({ pressed }) => [
                        styles.actionButton,
                        { backgroundColor: colors.primary + '15', opacity: pressed ? 0.6 : 1 }
                    ]}
                >
                    <Feather name="edit-2" size={22} color={colors.primary} />
                </Pressable>
                <Pressable
                    onPress={() => handleDeleteProperty(item.id)}
                    style={({ pressed }) => [
                        styles.actionButton,
                        { backgroundColor: colors.error + '15', opacity: pressed ? 0.6 : 1 }
                    ]}
                >
                    <Feather name="trash-2" size={22} color={colors.error} />
                </Pressable>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <ScreenKeyboardAwareScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
            >
                <View style={styles.header}>
                    <ThemedText type="h2">Minhas Propriedades</ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                        Adicione suas propriedades para criar trabalhos
                    </ThemedText>
                </View>

                {properties.length > 0 ? (
                    <FlatList
                        data={properties}
                        renderItem={renderProperty}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                        style={styles.list}
                    />
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.backgroundDefault }]}>
                        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Feather name="home" size={48} color={colors.primary} />
                        </View>
                        <ThemedText type="h3" style={{ color: colors.text, marginTop: Spacing.lg, textAlign: 'center' }}>
                            Sem propriedades
                        </ThemedText>
                        <ThemedText
                            type="body"
                            style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}
                        >
                            Toque no botão abaixo para adicionar sua primeira propriedade
                        </ThemedText>
                    </View>
                )}

                <Button
                    onPress={handleAddProperty}
                    disabled={isAddingProperty || isGettingLocation}
                    style={styles.addButton}
                >
                    {isGettingLocation ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Feather name="plus" size={24} color="#FFFFFF" />
                            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                Adicionar Propriedade
                            </ThemedText>
                        </>
                    )}
                </Button>
            </ScreenKeyboardAwareScrollView>

            <Modal
                visible={showNameModal}
                transparent
                animationType="fade"
                onRequestClose={cancelAddProperty}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <ThemedText type="h3" style={styles.modalTitle}>
                            Nome da Propriedade
                        </ThemedText>
                        <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }}>
                            Como você quer chamar essa propriedade?
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={newPropertyName}
                            onChangeText={setNewPropertyName}
                            placeholder="Ex: Fazenda Santa Maria"
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        {pendingLocation && (
                            <View style={[styles.locationPreview, { backgroundColor: colors.backgroundSecondary }]}>
                                <Feather name="map-pin" size={18} color={colors.primary} />
                                <ThemedText type="small" style={{ color: colors.textSecondary, flex: 1 }}>
                                    {pendingLocation.address}
                                </ThemedText>
                            </View>
                        )}
                        <View style={styles.modalButtons}>
                            <Pressable
                                onPress={cancelAddProperty}
                                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                            >
                                <ThemedText type="body" style={{ color: colors.text }}>Cancelar</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={confirmAddProperty}
                                disabled={!newPropertyName.trim() || isAddingProperty}
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.primary, opacity: newPropertyName.trim() && !isAddingProperty ? 1 : 0.5 }
                                ]}
                            >
                                {isAddingProperty ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>Salvar</ThemedText>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={cancelEditProperty}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <ThemedText type="h3" style={styles.modalTitle}>
                            Renomear Propriedade
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nome da propriedade"
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                onPress={cancelEditProperty}
                                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                            >
                                <ThemedText type="body" style={{ color: colors.text }}>Cancelar</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={confirmEditProperty}
                                disabled={!editName.trim() || isEditingProperty}
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.primary, opacity: editName.trim() && !isEditingProperty ? 1 : 0.5 }
                                ]}
                            >
                                {isEditingProperty ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>Salvar</ThemedText>
                                )}
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
        paddingTop: Spacing.xl,
    },
    header: {
        marginBottom: Spacing['2xl'],
    },
    list: {
        marginBottom: Spacing['2xl'],
    },
    propertyCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.sm,
        gap: Spacing.lg,
    },
    propertyContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.lg,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing['2xl'],
        borderRadius: BorderRadius.sm,
        minHeight: 240,
        marginBottom: Spacing['2xl'],
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        padding: Spacing.xl,
        borderRadius: BorderRadius.md,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    input: {
        height: 56,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.lg,
        fontSize: 17,
        marginBottom: Spacing.lg,
    },
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.xs,
        marginBottom: Spacing.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modalButton: {
        flex: 1,
        height: 52,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
