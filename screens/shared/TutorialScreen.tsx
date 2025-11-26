import React, { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, FlatList, Dimensions, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { updateUser } from '@/utils/storage';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  tips?: string[];
}

const PRODUCER_STEPS: TutorialStep[] = [
  {
    id: '1',
    title: 'Bem-vindo ao Empleitapp',
    description: 'Este e seu espaco para encontrar trabalhadores qualificados para suas demandas de servico rurais. Vamos aprender juntos!',
    icon: 'home',
    tips: ['Voce e um Produtor', 'Sua missao: conectar com bons trabalhadores'],
  },
  {
    id: '2',
    title: 'Crie Sua Primeira Demanda',
    description: 'Toque em "Criar Demanda" para oferecer serviços. Escolha o tipo de trabalho, quantidade, valor e prazo.',
    icon: 'plus-circle',
    tips: ['Fotos ajudam a atrair trabalhos', 'Descreva bem o que você precisa', 'Quanto melhor o trabalho, mais propostas você recebe'],
  },
  {
    id: '3',
    title: 'Gerenciar Propriedades',
    description: 'Configure suas propriedades rurais no Perfil. O GPS marca o local de cada uma automaticamente.',
    icon: 'map-pin',
    tips: ['Nomeie suas propriedades para identificar facilmente', 'O GPS é automático', 'Você pode ter múltiplas propriedades'],
  },
  {
    id: '4',
    title: 'Receba Propostas',
    description: 'Na tela Início, você verá propostas dos trabalhadores. Analise quem é o melhor para o seu trabalho.',
    icon: 'message-circle',
    tips: ['Veja o nível e avaliação de cada um', 'Compare os preços', 'Leia as mensagens deles'],
  },
  {
    id: '5',
    title: 'Acompanhe o Trabalho',
    description: 'Depois de aceitar uma proposta, você recebe um trabalho ativo. Acompanhe com fotos e GPS do trabalhador.',
    icon: 'map',
    tips: ['Receba notificações de check-in/out', 'Veja fotos antes e depois', 'Confirme quando terminar'],
  },
  {
    id: '6',
    title: 'Avalie o Trabalhador',
    description: 'Ao finalizar, deixe uma avaliação honesta. Isso ajuda outros produtores e motiva bons trabalhadores.',
    icon: 'star',
    tips: ['Avalie em 5 critérios', 'Seja justo e honesto', 'Seu feedback melhora a comunidade'],
  },
];

const WORKER_STEPS: TutorialStep[] = [
  {
    id: '1',
    title: 'Bem-vindo ao Empleitapp',
    description: 'Este e seu espaco para ganhar dinheiro com servicos rurais. Suba de nivel e consiga melhores trabalhos!',
    icon: 'home',
    tips: ['Voce e um Trabalhador', 'Sua missao: executar bons trabalhos e subir de nivel'],
  },
  {
    id: '2',
    title: 'Explore Trabalhos Disponíveis',
    description: 'Na tela "Trabalhos", você vê todas as demandas disponíveis. Filtre por tipo de serviço ou valor.',
    icon: 'briefcase',
    tips: ['Veja quantas propostas cada trabalho já tem', 'Aceitar caro não garante ser aceito', 'Qualidade vale mais que preço'],
  },
  {
    id: '3',
    title: 'Envie Suas Propostas',
    description: 'Toque em um trabalho e envie uma proposta. Defina seu preço e mande uma mensagem ao produtor.',
    icon: 'send',
    tips: ['Seja profissional na mensagem', 'Mostre experiência quando tiver', 'Diga por que você é o melhor'],
  },
  {
    id: '4',
    title: 'Acompanhe Seus Níveis',
    description: 'Cada trabalho bem feito soma avaliações. Suba de N1 até N5 e desbloqueie serviços melhores pagos!',
    icon: 'trending-up',
    tips: ['N1 = Iniciante', 'N5 = Mestre (melhor remuneração)', 'Qualidade leva a melhores propostas'],
  },
  {
    id: '5',
    title: 'Execute e Rastreie',
    description: 'Quando sua proposta é aceita, faça check-in na propriedade. O GPS marca seu trabalho. Tire fotos ao terminar.',
    icon: 'map',
    tips: ['Check-in com GPS automático', 'Tire foto antes E depois', 'Check-out com fotos prova seu trabalho'],
  },
  {
    id: '6',
    title: 'Receba Avaliações',
    description: 'Após terminar, o produtor avalia seu trabalho em 5 critérios. Boas avaliações = mais trabalhos pagos!',
    icon: 'award',
    tips: ['Qualidade é tudo', 'Leia os comentários', 'Melhore com base no feedback'],
  },
];

export default function TutorialScreen({ onComplete }: { onComplete?: () => void }) {
  const { user, setUser } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const windowWidth = Dimensions.get('window').width;

  const steps = user?.role === 'producer' ? PRODUCER_STEPS : WORKER_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToNextStep = async () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  };

  const completeTutorial = async () => {
    if (user) {
      try {
        await updateUser(user.id, { tutorialCompleted: true });
        setUser({ ...user, tutorialCompleted: true });
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error completing tutorial:', error);
      }
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStep = ({ item }: { item: TutorialStep }) => (
    <View style={[styles.stepContainer, { width: windowWidth }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Feather name={item.icon as any} size={72} color={colors.primary} />
      </View>

      <ThemedText type="h2" style={styles.title}>
        {item.title}
      </ThemedText>

      <ThemedText type="body" style={[styles.description, { color: colors.textSecondary }]}>
        {item.description}
      </ThemedText>

      {item.tips && item.tips.length > 0 && (
        <View style={styles.tipsContainer}>
          <ThemedText type="h3" style={styles.tipsTitle}>
            Dica:
          </ThemedText>
          {item.tips.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <ThemedText type="body" style={[styles.tipText, { color: colors.text }]}>
                {tip}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h1" style={styles.headerTitle}>
          Guia Rápido
        </ThemedText>
        <Pressable onPress={completeTutorial} style={styles.skipButton}>
          <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600' }}>
            Pular
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${progress}%` },
          ]}
        />
      </View>

      <ThemedText
        type="body"
        style={[styles.stepCounter, { color: colors.textSecondary }]}
      >
        {currentStep + 1} de {steps.length}
      </ThemedText>

      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <Pressable
            onPress={goToPrevStep}
            style={[styles.button, { backgroundColor: colors.backgroundSecondary }]}
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
            <ThemedText type="body" style={{ color: colors.text }}>
              Anterior
            </ThemedText>
          </Pressable>
        )}

        {currentStep < steps.length - 1 ? (
          <Pressable
            onPress={goToNextStep}
            style={[styles.button, { backgroundColor: colors.primary, flex: currentStep === 0 ? 1 : undefined }]}
          >
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Próximo
            </ThemedText>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            onPress={completeTutorial}
            style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
          >
            <Feather name="check" size={24} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              Começar Agora!
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  headerTitle: {
    flex: 1,
  },
  skipButton: {
    paddingHorizontal: Spacing.lg,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  stepCounter: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 24,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: 'rgba(45, 80, 22, 0.05)',
    borderRadius: Spacing.md,
    padding: Spacing.lg,
  },
  tipsTitle: {
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
