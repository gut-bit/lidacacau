import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Talhao } from '@/types';
import { getPropertyById, addHarvestLog } from '@/utils/storage';
import { RootStackParamList } from '@/navigation/RootNavigator';

type HarvestLogRouteProp = RouteProp<RootStackParamList, 'HarvestLog'>;

export default function HarvestLogScreen() {
    const { theme, isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<HarvestLogRouteProp>();
    const { user } = useAuth();

    // Params might come from Property screen or Talhao screen
    // If coming from Property, need to select Talhao
    const { propertyId, talhaoId: initialTalhaoId } = route.params as any; // Cast for now as we need to update route types

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [talhoes, setTalhoes] = useState<Talhao[]>([]);
    const [selectedTalhaoId, setSelectedTalhaoId] = useState<string | null>(initialTalhaoId || null);

    const [weight, setWeight] = useState('');
    const [type, setType] = useState<'wet' | 'dry'>('wet'); // 'wet' = Baba, 'dry' = Seco
    const [quality, setQuality] = useState('B');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        loadProperty();
    }, [propertyId]);

    const loadProperty = async () => {
        try {
            const property = await getPropertyById(propertyId);
            if (property) {
                setTalhoes(property.talhoes);
                if (initialTalhaoId && !selectedTalhaoId) {
                    setSelectedTalhaoId(initialTalhaoId);
                } else if (property.talhoes.length === 1 && !selectedTalhaoId) {
                    setSelectedTalhaoId(property.talhoes[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading property:', error);
            Alert.alert('Erro', 'Nao foi possivel carregar a propriedade');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedTalhaoId) {
            Alert.alert('Atencao', 'Selecione um talhao');
            return;
        }
        if (!weight || isNaN(parseFloat(weight))) {
            Alert.alert('Atencao', 'Informe o peso valido');
            return;
        }
        if (!user) return;

        setSubmitting(true);
        try {
            await addHarvestLog(
                propertyId,
                selectedTalhaoId,
                {
                    date: date.toISOString(),
                    weightKg: parseFloat(weight),
                    type,
                    quality,
                    notes: notes.trim() || undefined,
                    talhaoId: selectedTalhaoId
                },
                user.id
            );
            Alert.alert('Sucesso', 'Colheita registrada!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error adding log:', error);
            Alert.alert('Erro', 'Falha ao registrar colheita');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundRoot, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScreenScrollView>
            <View style={styles.formContainer}>
                <View style={styles.header}>
                    <ThemedText type="h2">Registrar Colheita</ThemedText>
                    <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                        Acompanhe sua producao
                    </ThemedText>
                </View>

                {!initialTalhaoId && (
                    <View style={styles.section}>
                        <ThemedText type="body" style={styles.label}>Talhao *</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.talhaoList}>
                            {talhoes.map(talhao => (
                                <Pressable
                                    key={talhao.id}
                                    style={[
                                        styles.talhaoChip,
                                        {
                                            backgroundColor: selectedTalhaoId === talhao.id ? colors.primary : colors.card,
                                            borderColor: selectedTalhaoId === talhao.id ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedTalhaoId(talhao.id)}
                                >
                                    <ThemedText
                                        type="small"
                                        style={{ color: selectedTalhaoId === talhao.id ? '#FFFFFF' : colors.text }}
                                    >
                                        {talhao.name}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.section}>
                    <ThemedText type="body" style={styles.label}>Peso (kg) *</ThemedText>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <ThemedText style={{ color: colors.textSecondary }}>kg</ThemedText>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="body" style={styles.label}>Tipo *</ThemedText>
                    <View style={styles.typeRow}>
                        <Pressable
                            style={[
                                styles.typeButton,
                                {
                                    borderColor: type === 'wet' ? colors.primary : colors.border,
                                    backgroundColor: type === 'wet' ? colors.primary + '10' : colors.card
                                }
                            ]}
                            onPress={() => setType('wet')}
                        >
                            <Feather name="droplet" size={20} color={type === 'wet' ? colors.primary : colors.textSecondary} />
                            <ThemedText style={{ marginTop: Spacing.xs, color: type === 'wet' ? colors.primary : colors.textSecondary }}>
                                Cacau Baba (Umido)
                            </ThemedText>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.typeButton,
                                {
                                    borderColor: type === 'dry' ? colors.accent : colors.border,
                                    backgroundColor: type === 'dry' ? colors.accent + '10' : colors.card
                                }
                            ]}
                            onPress={() => setType('dry')}
                        >
                            <Feather name="sun" size={20} color={type === 'dry' ? colors.accent : colors.textSecondary} />
                            <ThemedText style={{ marginTop: Spacing.xs, color: type === 'dry' ? colors.accent : colors.textSecondary }}>
                                Amendoa Seca
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="body" style={styles.label}>Observacoes</ThemedText>
                    <TextInput
                        style={[
                            styles.textArea,
                            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }
                        ]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Ex: Primeira colheita do ano, qualidade excelente"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <Pressable
                    style={[
                        styles.submitButton,
                        { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }
                    ]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Feather name="save" size={20} color="#FFFFFF" />
                            <ThemedText type="h4" style={{ color: '#FFFFFF', marginLeft: Spacing.sm }}>
                                Salvar Registro
                            </ThemedText>
                        </>
                    )}
                </Pressable>

            </View>
        </ScreenScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContainer: {
        padding: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    label: {
        marginBottom: Spacing.sm,
        fontWeight: '600',
    },
    talhaoList: {
        gap: Spacing.sm,
    },
    talhaoChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        height: 56,
    },
    input: {
        flex: 1,
        fontSize: 18,
        height: '100%',
    },
    typeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        height: 100,
    },
    textArea: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.lg,
        ...Shadows.card,
    },
});
