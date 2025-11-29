import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'produtor' | 'trabalhador' | 'pagamento' | 'seguranca';
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    category: 'geral',
    question: 'O que e o LidaCacau?',
    answer: 'O LidaCacau e um marketplace que conecta produtores de cacau com trabalhadores rurais qualificados em Uruara/PA. Aqui voce pode publicar demandas de servico, receber propostas, negociar termos e acompanhar o trabalho em tempo real.',
  },
  {
    id: '2',
    category: 'geral',
    question: 'O LidaCacau e gratuito?',
    answer: 'Sim! O cadastro e uso do app sao totalmente gratuitos. Nao cobramos taxas sobre os servicos contratados. O valor negociado entre produtor e trabalhador e o valor final.',
  },
  {
    id: '3',
    category: 'produtor',
    question: 'Como publico uma demanda de servico?',
    answer: 'Va na aba "Inicio" e toque no botao "+" no canto inferior. Selecione o tipo de servico, informe a quantidade, local e valor. Adicione fotos para melhorar a visibilidade. Trabalhadores da regiao receberao notificacao.',
  },
  {
    id: '4',
    category: 'produtor',
    question: 'Como escolho o melhor trabalhador?',
    answer: 'Ao receber propostas, avalie o nivel do trabalhador (N1 a N5), suas avaliacoes anteriores, preco proposto e se ele possui verificacao de identidade. Trabalhadores verificados passaram por validacao de documentos.',
  },
  {
    id: '5',
    category: 'trabalhador',
    question: 'Como subo de nivel?',
    answer: 'Seu nivel aumenta conforme acumula avaliacoes positivas. N1 (Iniciante): inicio. N2 (Experiente): 5+ avaliacoes, media 3.5+. N3 (Profissional): 10+ avaliacoes, media 4.0+. N4 (Especialista): 15+ avaliacoes, media 4.3+. N5 (Mestre): 20+ avaliacoes, media 4.5+.',
  },
  {
    id: '6',
    category: 'trabalhador',
    question: 'Como envio propostas?',
    answer: 'Na aba "Trabalhos", veja as demandas disponiveis na sua regiao. Toque em uma demanda para ver detalhes e clique em "Enviar Proposta". Informe seu preco e uma mensagem explicando sua experiencia.',
  },
  {
    id: '7',
    category: 'pagamento',
    question: 'Como funciona o pagamento?',
    answer: 'O pagamento e combinado diretamente entre produtor e trabalhador. Voces podem negociar: 100% apos conclusao, 50/50, por unidade, por hora ou por diaria. O app facilita a negociacao mas nao intermedia o dinheiro.',
  },
  {
    id: '8',
    category: 'pagamento',
    question: 'Preciso emitir nota fiscal?',
    answer: 'Se voce atua como MEI ou empresa, recomendamos emitir NFS-e. O app tem integracao com o portal da Prefeitura de Uruara. Acesse pelo menu do Perfil > Nota Fiscal Eletronica.',
  },
  {
    id: '9',
    category: 'seguranca',
    question: 'O que e a verificacao de identidade?',
    answer: 'A verificacao de identidade confirma que o usuario e quem diz ser. Enviamos selfie + documento (RG/CNH). Usuarios verificados tem um selo verde no perfil, aumentando a confianca.',
  },
  {
    id: '10',
    category: 'seguranca',
    question: 'O contrato de empreitada tem validade legal?',
    answer: 'Sim! O contrato gerado pelo app segue as normas brasileiras para contratos de empreitada. Ambas as partes assinam digitalmente. Guarde uma copia como comprovante do acordo.',
  },
];

const categoryLabels: Record<string, string> = {
  geral: 'Geral',
  produtor: 'Produtores',
  trabalhador: 'Trabalhadores',
  pagamento: 'Pagamento',
  seguranca: 'Seguranca',
};

const WHATSAPP_SUPPORT = 'https://wa.me/5593999999999?text=Ola!%20Preciso%20de%20ajuda%20com%20o%20LidaCacau.';

export default function FAQSupportScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFaq = selectedCategory
    ? faqItems.filter((item) => item.category === selectedCategory)
    : faqItems;

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleWhatsAppSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(WHATSAPP_SUPPORT);
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
        <View style={[styles.headerCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Feather name="help-circle" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={{ textAlign: 'center', marginTop: Spacing.md }}>
            Central de Ajuda
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.sm }}>
            Encontre respostas para suas duvidas ou fale com nosso suporte
          </ThemedText>
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.success + '15' }, Shadows.card]}>
          <View style={styles.supportContent}>
            <View style={[styles.supportIcon, { backgroundColor: '#25D366' }]}>
              <Feather name="message-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText type="body" style={{ fontWeight: '700' }}>
                Suporte via WhatsApp
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                Atendimento de segunda a sexta, 8h as 18h
              </ThemedText>
            </View>
          </View>
          <Button onPress={handleWhatsAppSupport} style={{ marginTop: Spacing.md }}>
            <View style={styles.whatsappButton}>
              <Feather name="message-circle" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
                Falar com Suporte
              </ThemedText>
            </View>
          </Button>
        </View>

        <View style={styles.categoriesContainer}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Filtrar por Categoria
          </ThemedText>
          <View style={styles.categoryRow}>
            <Pressable
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === null ? colors.primary : colors.backgroundSecondary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(null);
              }}
            >
              <ThemedText
                type="small"
                style={{
                  color: selectedCategory === null ? '#FFFFFF' : colors.text,
                  fontWeight: '600',
                }}
              >
                Todas
              </ThemedText>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.backgroundSecondary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat);
                }}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: selectedCategory === cat ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {categoryLabels[cat]}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.faqContainer}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Perguntas Frequentes ({filteredFaq.length})
          </ThemedText>

          {filteredFaq.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.faqItem, { backgroundColor: colors.card }, Shadows.card]}
              onPress={() => toggleExpand(item.id)}
            >
              <View style={styles.faqHeader}>
                <View style={[styles.categoryDot, { backgroundColor: colors.primary }]} />
                <ThemedText type="body" style={{ flex: 1, fontWeight: '600' }}>
                  {item.question}
                </ThemedText>
                <Feather
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              {expandedId === item.id && (
                <View style={styles.faqAnswer}>
                  <ThemedText type="body" style={{ color: colors.textSecondary, lineHeight: 22 }}>
                    {item.answer}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Feather name="mail" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Nao encontrou sua resposta?
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
              Entre em contato pelo WhatsApp ou envie email para suporte@lidacacau.app
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
  supportCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  supportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  faqContainer: {
    marginBottom: Spacing.lg,
  },
  faqItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  faqAnswer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
