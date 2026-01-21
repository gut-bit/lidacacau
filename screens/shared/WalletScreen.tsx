import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, RefreshControl, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ScreenFlatList } from '@/components/ScreenFlatList';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { updateUser } from '@/utils/storage';
import {
    getPixChargesByUser,
    getPaymentSummary,
    getStatusLabel,
    getStatusColor,
    checkExpiredCharges,
} from '@/utils/payment';
import { formatCurrency } from '@/utils/format';
import { PixCharge, PaymentSummary, PixPaymentStatus, PixChargeType, PLATFORM_FEE_PERCENTAGE } from '@/types';

type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

// PIX Definitions
interface PixKeyTypeOption {
    type: PixKeyType;
    label: string;
    icon: string;
    placeholder: string;
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    mask?: (value: string) => string;
}

const PIX_KEY_TYPES: PixKeyTypeOption[] = [
    {
        type: 'cpf',
        label: 'CPF',
        icon: 'credit-card',
        placeholder: '000.000.000-00',
        keyboardType: 'numeric',
        mask: (value: string) => {
            const cleaned = value.replace(/\D/g, '').slice(0, 11);
            return cleaned
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        },
    },
    {
        type: 'email',
        label: 'E-mail',
        icon: 'mail',
        placeholder: 'seu@email.com',
        keyboardType: 'email-address',
    },
    {
        type: 'phone',
        label: 'Telefone',
        icon: 'phone',
        placeholder: '(00) 00000-0000',
        keyboardType: 'phone-pad',
        mask: (value: string) => {
            const cleaned = value.replace(/\D/g, '').slice(0, 11);
            if (cleaned.length <= 10) {
                return cleaned
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4})(\d)/, '$1-$2');
            }
            return cleaned
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        },
    },
    {
        type: 'random',
        label: 'Chave Aleatória',
        icon: 'key',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        keyboardType: 'default',
    },
];

type Tab = 'balance' | 'settings';

export default function WalletScreen({ navigation }: any) {
    const { theme, isDark } = useTheme();
    const { user, refreshUser } = useAuth();
    const insets = useSafeAreaInsets();
    const colors = isDark ? Colors.dark : Colors.light;

    const [activeTab, setActiveTab] = useState<Tab>('balance');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Balance State
    const [charges, setCharges] = useState<PixCharge[]>([]);
    const [summary, setSummary] = useState<PaymentSummary | null>(null);

    // Settings State
    const isWorker = user?.activeRole === 'worker';
    const currentProfile = isWorker ? user?.workerProfile : user?.producerProfile;
    const [selectedType, setSelectedType] = useState<PixKeyType>(currentProfile?.pixKeyType || 'cpf');
    const [pixKey, setPixKey] = useState(currentProfile?.pixKey || '');
    const [savingSettings, setSavingSettings] = useState(false);

    const loadBalanceData = useCallback(async () => {
        if (!user) return;
        try {
            await checkExpiredCharges();
            const [userCharges, userSummary] = await Promise.all([
                getPixChargesByUser(user.id),
                getPaymentSummary(user.id),
            ]);
            setCharges(userCharges.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
            setSummary(userSummary);
        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadBalanceData();
    }, [loadBalanceData]);

    useEffect(() => {
        if (currentProfile?.pixKey) {
            setPixKey(currentProfile.pixKey);
            setSelectedType(currentProfile.pixKeyType || 'cpf');
        }
    }, [currentProfile]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadBalanceData();
    };

    // --- Settings Handlers ---

    const selectedOption = PIX_KEY_TYPES.find((t) => t.type === selectedType) || PIX_KEY_TYPES[0];

    const handleKeyChange = (value: string) => {
        if (selectedOption.mask) {
            setPixKey(selectedOption.mask(value));
        } else {
            setPixKey(value);
        }
    };

    const validatePixKey = (): boolean => {
        const cleanedKey = pixKey.replace(/\D/g, '');
        switch (selectedType) {
            case 'cpf':
                if (cleanedKey.length !== 11) { Alert.alert('Erro', 'CPF deve conter 11 dígitos'); return false; } break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) { Alert.alert('Erro', 'E-mail inválido'); return false; } break;
            case 'phone':
                if (cleanedKey.length < 10 || cleanedKey.length > 11) { Alert.alert('Erro', 'Telefone inválido'); return false; } break;
            case 'random':
                if (pixKey.trim().length < 32) { Alert.alert('Erro', 'Chave aleatória muito curta'); return false; } break;
        }
        return true;
    };

    const handleSaveSettings = async () => {
        if (!pixKey.trim()) { Alert.alert('Erro', 'Digite sua chave PIX'); return; }
        if (!validatePixKey() || !user) return;

        setSavingSettings(true);
        try {
            const profileKey = isWorker ? 'workerProfile' : 'producerProfile';
            await updateUser(user.id, {
                [profileKey]: { ...currentProfile, pixKey: pixKey.trim(), pixKeyType: selectedType },
            });
            await refreshUser();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Chave PIX salva!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao salvar');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleRemoveKey = () => {
        Alert.alert('Remover', 'Remover chave PIX?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover', style: 'destructive',
                onPress: async () => {
                    if (!user) return;
                    setSavingSettings(true);
                    try {
                        const profileKey = isWorker ? 'workerProfile' : 'producerProfile';
                        const updatedProfile = { ...currentProfile };
                        delete updatedProfile.pixKey;
                        delete updatedProfile.pixKeyType;
                        await updateUser(user.id, { [profileKey]: updatedProfile });
                        await refreshUser();
                        setPixKey('');
                        setSelectedType('cpf');
                        Alert.alert('Removido', 'Chave removida');
                    } catch (e) { Alert.alert('Erro', 'Falha ao remover'); }
                    finally { setSavingSettings(false); }
                }
            }
        ]);
    };

    // --- Renderers ---

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <Pressable
                style={[styles.tab, activeTab === 'balance' && { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setActiveTab('balance')}
            >
                <ThemedText type="body" style={{ fontWeight: activeTab === 'balance' ? '700' : '400' }}>Extrato</ThemedText>
            </Pressable>
            <Pressable
                style={[styles.tab, activeTab === 'settings' && { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setActiveTab('settings')}
            >
                <ThemedText type="body" style={{ fontWeight: activeTab === 'settings' ? '700' : '400' }}>Configurar</ThemedText>
            </Pressable>
        </View>
    );

    const renderBalance = () => {
        const renderItem = ({ item }: { item: PixCharge }) => {
            const receiving = item.receiverId === user?.id;
            const isPlatform = item.chargeType === 'platform_fee';
            const color = isPlatform ? colors.accent : (receiving ? colors.success : colors.error);
            const icon = isPlatform ? 'percent' : (receiving ? 'arrow-down-left' : 'arrow-up-right');

            return (
                <View style={[styles.chargeCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={styles.chargeRow}>
                        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                            <Feather name={icon as any} size={18} color={color} />
                        </View>
                        <View style={styles.chargeInfo}>
                            <ThemedText type="body" numberOfLines={1}>{item.description}</ThemedText>
                            <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                {new Date(item.createdAt).toLocaleDateString('pt-BR')} - {getStatusLabel(item.status)}
                            </ThemedText>
                        </View>
                        <ThemedText type="h4" style={{ color }}>
                            {receiving ? '+' : '-'}{formatCurrency(item.value / 100)}
                        </ThemedText>
                    </View>
                </View>
            );
        };

        return (
            <ScreenFlatList
                data={charges}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
                ListHeaderComponent={
                    <>
                        {summary && (
                            <View style={[styles.summaryCard, { backgroundColor: colors.primary + '15' }]}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryCol}>
                                        <ThemedText type="small" style={{ color: colors.textSecondary }}>Recebido</ThemedText>
                                        <ThemedText type="h3" style={{ color: colors.success }}>{formatCurrency(summary.totalReceived / 100)}</ThemedText>
                                    </View>
                                    <View style={[styles.vertDivider, { backgroundColor: colors.border }]} />
                                    <View style={styles.summaryCol}>
                                        <ThemedText type="small" style={{ color: colors.textSecondary }}>Pago</ThemedText>
                                        <ThemedText type="h3" style={{ color: colors.error }}>{formatCurrency(summary.totalPaid / 100)}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}
                        <ThemedText type="h4" style={{ marginBottom: Spacing.md, marginLeft: Spacing.xs }}>Histórico</ThemedText>
                    </>
                }
            />
        );
    };

    const renderSettings = () => (
        <ScreenKeyboardAwareScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
            <View style={styles.section}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Tipo de Chave</ThemedText>
                <View style={styles.typeGrid}>
                    {PIX_KEY_TYPES.map((type) => (
                        <Pressable
                            key={type.type}
                            style={[
                                styles.typeCard,
                                { backgroundColor: colors.card, borderColor: selectedType === type.type ? colors.primary : colors.border, borderWidth: selectedType === type.type ? 2 : 1 }
                            ]}
                            onPress={() => { setSelectedType(type.type); setPixKey(''); }}
                        >
                            <Feather name={type.icon as any} size={24} color={selectedType === type.type ? colors.primary : colors.textSecondary} />
                            <ThemedText type="small" style={{ marginTop: Spacing.sm, color: selectedType === type.type ? colors.primary : colors.text }}>{type.label}</ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Sua Chave</ThemedText>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder={selectedOption.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={pixKey}
                    onChangeText={handleKeyChange}
                    keyboardType={selectedOption.keyboardType}
                    autoCapitalize="none"
                />
            </View>

            <Button onPress={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? <ActivityIndicator color="#FFF" /> : 'Salvar Chave PIX'}
            </Button>

            {currentProfile?.pixKey && (
                <Pressable onPress={handleRemoveKey} style={styles.removeBtn}>
                    <ThemedText type="body" style={{ color: colors.error }}>Remover Chave</ThemedText>
                </Pressable>
            )}
        </ScreenKeyboardAwareScrollView>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.md, backgroundColor: colors.backgroundRoot }]}>
                <ThemedText type="h2" style={{ textAlign: 'center' }}>Carteira</ThemedText>
            </View>
            {renderTabs()}

            <View style={{ flex: 1 }}>
                {activeTab === 'balance' ? renderBalance() : renderSettings()}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: Spacing.lg },
    tabContainer: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: BorderRadius.lg, padding: 4 },
    tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md },
    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    scrollContent: { padding: Spacing.lg, gap: Spacing.xl },
    summaryCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.xl },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryCol: { flex: 1, alignItems: 'center' },
    vertDivider: { width: 1, height: 40, marginHorizontal: Spacing.md },
    chargeCard: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
    chargeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    chargeInfo: { flex: 1 },
    section: {},
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    typeCard: { width: '47%', padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
    input: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, fontSize: 16 },
    removeBtn: { alignItems: 'center', padding: Spacing.md },
});
