import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Talhao, HarvestLog, ExpenseLog } from '@/types';
import { getPropertyById } from '@/utils/storage';
import { formatCurrency } from '@/utils/format';
import { RootStackParamList } from '@/navigation/RootNavigator';

type ProfitDashboardRouteProp = RouteProp<RootStackParamList, 'ProfitDashboard'>;

interface FinancialSummary {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    yieldKg: number;
}

type ActivityItem =
    | (HarvestLog & { isExpense: false; talhaoName: string })
    | (ExpenseLog & { isExpense: true; talhaoName: string });

export default function ProfitDashboardScreen() {
    const { theme, isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ProfitDashboardRouteProp>();

    const { propertyId } = route.params;

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<FinancialSummary>({ totalRevenue: 0, totalExpenses: 0, profit: 0, yieldKg: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

    useEffect(() => {
        loadData();
    }, [propertyId]);

    const loadData = async () => {
        try {
            const property = await getPropertyById(propertyId);
            if (!property) return;

            let revenue = 0;
            let expenses = 0;
            let yieldTotal = 0;
            const activity: any[] = [];

            property.talhoes.forEach(talhao => {
                // Harvest Logs
                talhao.harvestLogs?.forEach(log => {
                    if (log.priceSold) {
                        revenue += log.priceSold;
                    }
                    yieldTotal += log.weightKg;
                    activity.push({ ...log, isExpense: false, talhaoName: talhao.name });
                });

                // Expense Logs
                talhao.expenseLogs?.forEach(log => {
                    expenses += log.amount;
                    activity.push({ ...log, isExpense: true, talhaoName: talhao.name });
                });
            });

            setSummary({
                totalRevenue: revenue,
                totalExpenses: expenses,
                profit: revenue - expenses,
                yieldKg: yieldTotal,
            });

            // Sort by date desc
            activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentActivity(activity.slice(0, 50)); // Limit to last 50

        } catch (error) {
            console.error('Error loading dashboard:', error);
            Alert.alert('Erro', 'Nao foi possivel carregar os dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    const getProfitMargin = () => {
        if (summary.totalRevenue === 0) return 0;
        return (summary.profit / summary.totalRevenue) * 100;
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundRoot, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const maxVal = Math.max(summary.totalRevenue, summary.totalExpenses, 1);
    const revenueBarWidth = (summary.totalRevenue / maxVal) * 100;
    const expenseBarWidth = (summary.totalExpenses / maxVal) * 100;

    return (
        <ScreenScrollView>
            <View style={styles.content}>
                <View style={styles.header}>
                    <ThemedText type="h2">Painel de Lucros</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary }}>Visao geral da safra</ThemedText>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card, ...Shadows.card }]}>
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>Lucro Liquido</ThemedText>
                        <ThemedText type="h3" style={{ color: summary.profit >= 0 ? colors.success : colors.error }}>
                            {formatCurrency(summary.profit)}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: summary.profit >= 0 ? colors.success : colors.error }}>
                            {getProfitMargin().toFixed(1)}% Margem
                        </ThemedText>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card, ...Shadows.card }]}>
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>Producao Total</ThemedText>
                        <ThemedText type="h3" style={{ color: colors.primary }}>
                            {summary.yieldKg.toFixed(1)} kg
                        </ThemedText>
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>
                            Colhido
                        </ThemedText>
                    </View>
                </View>

                {/* Chart */}
                <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Receita vs Despesas</ThemedText>

                    <View style={styles.barGroup}>
                        <View style={[styles.barLabelRow]}>
                            <ThemedText>Receita</ThemedText>
                            <ThemedText>{formatCurrency(summary.totalRevenue)}</ThemedText>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                            <View style={[styles.barFill, { width: `${revenueBarWidth}%`, backgroundColor: colors.success }]} />
                        </View>
                    </View>

                    <View style={styles.barGroup}>
                        <View style={[styles.barLabelRow]}>
                            <ThemedText>Despesas</ThemedText>
                            <ThemedText>{formatCurrency(summary.totalExpenses)}</ThemedText>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                            <View style={[styles.barFill, { width: `${expenseBarWidth}%`, backgroundColor: colors.error }]} />
                        </View>
                    </View>
                </View>

                {/* Activity Feed */}
                <View style={styles.section}>
                    <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Historico Recente</ThemedText>
                    {recentActivity.map((item, index) => (
                        <View key={index} style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: item.isExpense ? colors.error + '20' : colors.success + '20' }]}>
                                <Feather
                                    name={item.isExpense ? 'trending-down' : 'trending-up'}
                                    size={20}
                                    color={item.isExpense ? colors.error : colors.success}
                                />
                            </View>
                            <View style={styles.activityInfo}>
                                <ThemedText type="body" style={{ fontWeight: '600' }}>
                                    {item.isExpense ? item.description : 'Colheita'}
                                </ThemedText>
                                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                                    {item.talhaoName} • {new Date(item.date).toLocaleDateString()}
                                </ThemedText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <ThemedText type="body" style={{
                                    color: item.isExpense ? colors.error : colors.success,
                                    fontWeight: '600'
                                }}>
                                    {item.isExpense ? `- ${formatCurrency(item.amount)}` : item.priceSold ? `+ ${formatCurrency(item.priceSold)}` : `${item.weightKg} kg`}
                                </ThemedText>
                                {!item.isExpense && !item.priceSold && (
                                    <ThemedText type="small" style={{ color: colors.warning }}>Em estoque</ThemedText>
                                )}
                            </View>
                        </View>
                    ))}
                    {recentActivity.length === 0 && (
                        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg }}>
                            N nenhuma atividade registrada.
                        </ThemedText>
                    )}
                </View>

            </View>
        </ScreenScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
    },
    chartContainer: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
    },
    barGroup: {
        marginBottom: Spacing.md,
    },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    barTrack: {
        height: 12,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    activityInfo: {
        flex: 1,
    },
});
