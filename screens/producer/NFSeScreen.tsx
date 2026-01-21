import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable, Linking, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SAMPLE_WORK_ORDERS, SAMPLE_JOBS, SAMPLE_WORKERS, SAMPLE_PRODUCERS } from '@/data/sampleData';
import { SERVICE_TYPES } from '@/data/serviceTypes';
import { formatCurrency, formatDate } from '@/utils/format';
import { WorkOrder, Job, User } from '@/types';

const ISSINTEGRA_URL = 'https://uruara-pa.issintegra.com.br/usuarios/entrar';
const PREFEITURA_URL = 'https://www.uruara.pa.gov.br/';

const ALL_USERS = [...SAMPLE_PRODUCERS, ...SAMPLE_WORKERS];

export default function NFSeScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const completedOrders = useMemo(() => {
    return SAMPLE_WORK_ORDERS
      .filter((order: WorkOrder) => order.status === 'completed')
      .map((order: WorkOrder) => {
        const job = SAMPLE_JOBS.find((j: Job) => j.id === order.jobId);
        const worker = ALL_USERS.find((u: User) => u.id === order.workerId);
        const serviceType = SERVICE_TYPES.find(s => s.id === job?.serviceTypeId);
        return {
          ...order,
          job,
          worker,
          serviceType,
        };
      })
      .slice(0, 5);
  }, []);

  const openISSIntegra = async () => {
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(ISSINTEGRA_URL);
      } else {
        await WebBrowser.openBrowserAsync(ISSINTEGRA_URL, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          toolbarColor: colors.primary,
          controlsColor: '#FFFFFF',
        });
      }
    } catch (error) {
      Linking.openURL(ISSINTEGRA_URL);
    }
  };

  const openPrefeitura = async () => {
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(PREFEITURA_URL);
      } else {
        await WebBrowser.openBrowserAsync(PREFEITURA_URL, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          toolbarColor: colors.primary,
          controlsColor: '#FFFFFF',
        });
      }
    } catch (error) {
      Linking.openURL(PREFEITURA_URL);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <View style={styles.headerIcon}>
            <Feather name="file-text" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={styles.headerTitle}>
            Nota Fiscal Eletrônica
          </ThemedText>
          <ThemedText type="small" style={styles.headerSubtitle}>
            Emita suas notas fiscais de serviço diretamente pelo portal ISSIntegra da Prefeitura de Uruará
          </ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.mainButton,
            { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 },
            Shadows.card,
          ]}
          onPress={openISSIntegra}
        >
          <View style={styles.mainButtonContent}>
            <View style={[styles.mainButtonIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Feather name="external-link" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.mainButtonText}>
              <ThemedText type="h4" style={styles.buttonTitle}>
                Acessar Portal ISSIntegra
              </ThemedText>
              <ThemedText type="small" style={styles.buttonSubtitle}>
                Emitir NFS-e, consultar notas, gerar guias
              </ThemedText>
            </View>
          </View>
          <Feather name="arrow-right" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.infoSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Como Emitir sua Nota Fiscal
          </ThemedText>

          <View style={[styles.stepCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={styles.stepNumberText}>1</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                Acesse o Portal
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Clique no botao acima para acessar o sistema ISSIntegra
              </ThemedText>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={styles.stepNumberText}>2</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                Faça Login
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Use seu CPF/CNPJ e inscrição municipal para entrar
              </ThemedText>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <ThemedText type="small" style={styles.stepNumberText}>3</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                Emita a Nota
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Preencha os dados do serviço e do tomador
              </ThemedText>
            </View>
          </View>
        </View>

        {completedOrders.length > 0 ? (
          <View style={styles.ordersSection}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Serviços Concluídos
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: Spacing.md }}>
              Trabalhos que podem precisar de nota fiscal
            </ThemedText>

            {completedOrders.map((order) => (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card }, Shadows.card]}
              >
                <View style={styles.orderHeader}>
                  <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Feather
                      name={order.serviceType?.icon as any || 'tool'}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.orderInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {order.serviceType?.name || 'Serviço'}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {order.worker?.name || 'Trabalhador'}
                    </ThemedText>
                  </View>
                  <View style={styles.orderValue}>
                    <ThemedText type="body" style={{ fontWeight: '700', color: colors.success }}>
                      {formatCurrency(order.finalPrice)}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>
                      {formatDate(order.checkOutTime || order.createdAt)}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.orderStatus, { backgroundColor: colors.success + '15' }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <ThemedText type="small" style={{ color: colors.success, fontWeight: '500' }}>
                    Concluído
                  </ThemedText>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.copyButton,
                    { opacity: pressed ? 0.7 : 1, marginTop: Spacing.sm },
                  ]}
                  onPress={async () => {
                    const data = `TOMADOR: ${order.worker?.name || 'N/A'}\nCPF: ${order.worker?.id || 'N/A'}\nSERVIÇO: ${order.serviceType?.name || 'N/A'}\nVALOR: ${formatCurrency(order.finalPrice)}\nDATA: ${formatDate(order.createdAt)}`;
                    await Clipboard.setStringAsync(data);
                    Alert.alert('Copiado', 'Dados copiados para a área de transferência');
                  }}
                >
                  <Feather name="copy" size={14} color={colors.primary} />
                  <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600' }}>
                    Copiar Dados
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.linksSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Links Úteis
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.linkCard,
              { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
              Shadows.card,
            ]}
            onPress={openPrefeitura}
          >
            <View style={[styles.linkIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Feather name="globe" size={20} color={colors.secondary} />
            </View>
            <View style={styles.linkContent}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                Site da Prefeitura
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                www.uruara.pa.gov.br
              </ThemedText>
            </View>
            <Feather name="external-link" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={[styles.infoCard, { backgroundColor: colors.link + '10', borderColor: colors.link }]}>
            <Feather name="info" size={20} color={colors.link} />
            <View style={styles.infoCardContent}>
              <ThemedText type="body" style={{ fontWeight: '600', color: colors.link }}>
                Nota Fiscal Avulsa
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                Para quem não possui inscrição municipal, é possível emitir nota fiscal avulsa pelo portal por R$ 22,90 por nota.
              </ThemedText>
            </View>
          </View>
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing['2xl'],
  },
  mainButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mainButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    flex: 1,
  },
  buttonTitle: {
    color: '#FFFFFF',
    marginBottom: 2,
  },
  buttonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  infoSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  ordersSection: {
    marginBottom: Spacing['2xl'],
  },
  orderCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  linksSection: {
    marginBottom: Spacing.xl,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  infoCardContent: {
    flex: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
});
