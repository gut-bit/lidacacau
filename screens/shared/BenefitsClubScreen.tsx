import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface Benefit {
  id: string;
  partner: string;
  category: 'ferramenta' | 'insumo' | 'combustivel' | 'alimentacao' | 'saude' | 'servico';
  discount: string;
  description: string;
  code?: string;
  validUntil: string;
  location: string;
  phone?: string;
  isExclusive?: boolean;
}

const sampleBenefits: Benefit[] = [
  {
    id: '1',
    partner: 'Agropecuaria Uruara',
    category: 'ferramenta',
    discount: '15%',
    description: 'Desconto em ferramentas manuais (facoes, enxadas, podadores)',
    code: 'EMPLEIT15',
    validUntil: '2025-12-31',
    location: 'Centro de Uruara',
    phone: '(93) 99999-1111',
    isExclusive: true,
  },
  {
    id: '2',
    partner: 'Posto Alvorada',
    category: 'combustivel',
    discount: 'R$0.10/L',
    description: 'Desconto por litro de combustivel (gasolina e diesel)',
    validUntil: '2025-12-31',
    location: 'Km 140 - Vila Alvorada',
    phone: '(93) 99999-2222',
  },
  {
    id: '3',
    partner: 'Restaurante Sabor da Terra',
    category: 'alimentacao',
    discount: '10%',
    description: 'Desconto no almoco self-service (segunda a sabado)',
    code: 'EMPLEIT10',
    validUntil: '2025-12-31',
    location: 'Centro de Uruara',
    phone: '(93) 99999-3333',
  },
  {
    id: '4',
    partner: 'Casa dos Insumos',
    category: 'insumo',
    discount: '12%',
    description: 'Desconto em fertilizantes e defensivos agricolas',
    code: 'EMPL12',
    validUntil: '2025-12-31',
    location: 'Av. Principal, Centro',
    phone: '(93) 99999-4444',
    isExclusive: true,
  },
  {
    id: '5',
    partner: 'Farmacia Popular',
    category: 'saude',
    discount: '8%',
    description: 'Desconto em medicamentos (exceto controlados)',
    validUntil: '2025-12-31',
    location: 'Centro de Uruara',
    phone: '(93) 99999-5555',
  },
  {
    id: '6',
    partner: 'Oficina do Joao',
    category: 'servico',
    discount: '20%',
    description: 'Desconto em manutencao de motosserra e rocadeira',
    code: 'EMPLEIT20',
    validUntil: '2025-12-31',
    location: 'Km 138 - Rodovia',
    phone: '(93) 99999-6666',
  },
];

const categoryIcons: Record<string, string> = {
  ferramenta: 'tool',
  insumo: 'box',
  combustivel: 'droplet',
  alimentacao: 'coffee',
  saude: 'heart',
  servico: 'settings',
};

const categoryLabels: Record<string, string> = {
  ferramenta: 'Ferramentas',
  insumo: 'Insumos',
  combustivel: 'Combustivel',
  alimentacao: 'Alimentacao',
  saude: 'Saude',
  servico: 'Servicos',
};

const categoryColors: Record<string, string> = {
  ferramenta: '#3B82F6',
  insumo: '#22C55E',
  combustivel: '#F59E0B',
  alimentacao: '#EF4444',
  saude: '#EC4899',
  servico: '#8B5CF6',
};

export default function BenefitsClubScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredBenefits = selectedCategory
    ? sampleBenefits.filter((b) => b.category === selectedCategory)
    : sampleBenefits;

  const handleCallPartner = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleCopyCode = async (code: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Codigo Copiado!', `Use o codigo "${code}" no estabelecimento parceiro.`);
  };

  const categories = Object.keys(categoryLabels);

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={[styles.headerCard, { backgroundColor: colors.accent + '15' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
            <Feather name="award" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.md }}>
            Clube Empleitapp
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.sm }}>
            Descontos exclusivos para membros da comunidade Empleitapp em Uruara
          </ThemedText>
        </View>

        <View style={styles.categoriesContainer}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Categorias
          </ThemedText>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat ? categoryColors[cat] : colors.backgroundSecondary,
                    borderColor: categoryColors[cat],
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(selectedCategory === cat ? null : cat);
                }}
              >
                <Feather
                  name={categoryIcons[cat] as any}
                  size={16}
                  color={selectedCategory === cat ? '#FFFFFF' : categoryColors[cat]}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: selectedCategory === cat ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                    marginLeft: Spacing.xs,
                  }}
                >
                  {categoryLabels[cat]}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitsHeader}>
            <ThemedText type="h4">
              {selectedCategory ? categoryLabels[selectedCategory] : 'Todos os Beneficios'}
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {filteredBenefits.length} parceiro{filteredBenefits.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {filteredBenefits.map((benefit) => (
            <View
              key={benefit.id}
              style={[styles.benefitCard, { backgroundColor: colors.card }, Shadows.card]}
            >
              <View style={styles.benefitHeader}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColors[benefit.category] + '20' },
                  ]}
                >
                  <Feather
                    name={categoryIcons[benefit.category] as any}
                    size={14}
                    color={categoryColors[benefit.category]}
                  />
                </View>
                <View style={styles.benefitTitleContainer}>
                  <ThemedText type="body" style={{ fontWeight: '700' }}>
                    {benefit.partner}
                  </ThemedText>
                  {benefit.isExclusive && (
                    <View style={[styles.exclusiveBadge, { backgroundColor: colors.accent }]}>
                      <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                        Exclusivo
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={[styles.discountBadge, { backgroundColor: colors.success + '15' }]}>
                  <ThemedText type="body" style={{ color: colors.success, fontWeight: '700' }}>
                    {benefit.discount}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                {benefit.description}
              </ThemedText>

              <View style={styles.benefitDetails}>
                <View style={styles.detailRow}>
                  <Feather name="map-pin" size={14} color={colors.textSecondary} />
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                    {benefit.location}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={colors.textSecondary} />
                  <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: Spacing.xs }}>
                    Valido ate {new Date(benefit.validUntil).toLocaleDateString('pt-BR')}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.benefitActions}>
                {benefit.code && (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => handleCopyCode(benefit.code!)}
                  >
                    <Feather name="copy" size={16} color={colors.primary} />
                    <ThemedText type="small" style={{ color: colors.primary, fontWeight: '600', marginLeft: Spacing.xs }}>
                      {benefit.code}
                    </ThemedText>
                  </Pressable>
                )}
                {benefit.phone && (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
                    onPress={() => handleCallPartner(benefit.phone!)}
                  >
                    <Feather name="phone" size={16} color={colors.success} />
                    <ThemedText type="small" style={{ color: colors.success, fontWeight: '600', marginLeft: Spacing.xs }}>
                      Ligar
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="info" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Quer ser parceiro?
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              Estabelecimentos de Uruara podem se cadastrar como parceiros do Clube Empleitapp.
              Entre em contato pelo WhatsApp da comunidade.
            </ThemedText>
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
    paddingHorizontal: Spacing.lg,
  },
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  benefitsContainer: {
    marginBottom: Spacing.lg,
  },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  benefitCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  exclusiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  benefitDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
