import React from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatCurrency } from '@/utils/format';

export default function ProducerHomeScreen() {
    const { theme, isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();

    const menuItems = [
        {
            id: 'properties',
            title: 'Minhas Propriedades',
            icon: 'map',
            color: colors.primary,
            route: 'ProducerProperties',
        },
        {
            id: 'history',
            title: 'Histórico de Serviços',
            icon: 'clock',
            color: colors.secondary,
            route: 'ProducerHistory', // Note: This might be in tab nav, so handling might be different
        },
        {
            id: 'financial',
            title: 'Painel Financeiro',
            icon: 'dollar-sign',
            color: colors.success,
            action: () => {
                // Example: navigate to first property dashboard or list properties
                navigation.navigate('ProducerProperties');
            },
        },
        {
            id: 'education',
            title: 'Capacitação',
            icon: 'book-open',
            color: colors.textSecondary,
            route: 'Education',
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
                <View style={styles.header}>
                    <View>
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>
                            Bem-vindo de volta,
                        </ThemedText>
                        <ThemedText type="h2">{user?.name || 'Produtor'}</ThemedText>
                    </View>
                    <Pressable style={[styles.profileButton, { backgroundColor: colors.card }]}>
                        <Feather name="user" size={24} color={colors.primary} />
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <ThemedText type="h4" style={styles.sectionTitle}>
                        Visão Geral
                    </ThemedText>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.card, ...Shadows.card }]}>
                            <Feather name="trending-up" size={24} color={colors.success} />
                            <ThemedText type="h3" style={{ marginTop: Spacing.sm }}>
                                --
                            </ThemedText>
                            <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                Produtividade
                            </ThemedText>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card, ...Shadows.card }]}>
                            <Feather name="activity" size={24} color={colors.warning} />
                            <ThemedText type="h3" style={{ marginTop: Spacing.sm }}>
                                --
                            </ThemedText>
                            <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                Atividades
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="h4" style={styles.sectionTitle}>
                        Acesso Rápido
                    </ThemedText>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item) => (
                            <Pressable
                                key={item.id}
                                style={[styles.menuItem, { backgroundColor: colors.card, ...Shadows.card }]}
                                onPress={() => {
                                    if (item.action) {
                                        item.action();
                                    } else if (item.route) {
                                        // @ts-ignore - handling generic navigation
                                        navigation.navigate(item.route);
                                    }
                                }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Feather name={item.icon as any} size={24} color={item.color} />
                                </View>
                                <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.sm }}>
                                    {item.title}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    menuItem: {
        width: '47%', // roughly half minus gap
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
});
