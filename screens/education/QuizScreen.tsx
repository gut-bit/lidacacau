import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getQuizById, getCourseById } from '@/data/educationData';
import { Quiz, QuizQuestion } from '@/types';
import { addXPToSkill, saveQuizAttempt, getQuizAttempts } from '@/utils/storage';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type QuizState = 'intro' | 'questions' | 'results';

export default function QuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props['route']>();
  const { quizId, skillId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    percent: number;
    passed: boolean;
    xpAwarded: number;
  } | null>(null);
  const [bestScore, setBestScore] = useState(0);

  const quiz = getQuizById(quizId);

  useEffect(() => {
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    if (!user) return;
    try {
      const attempts = await getQuizAttempts(user.id, quizId);
      if (attempts.length > 0) {
        const best = Math.max(...attempts.map(a => a.percent));
        setBestScore(best);
      }
    } catch (error) {
      console.error('Error loading best score:', error);
    }
  };

  if (!quiz) {
    return (
      <ScreenScrollView>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="h3">Quiz nao encontrado</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleConfirmAnswer = async () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    
    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setShowExplanation(true);
    setAnswers([...answers, selectedAnswer]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    const correct = answers.concat(selectedAnswer!).filter(
      (answer, index) => answer === quiz.questions[index].correctIndex
    ).length;
    
    const percent = Math.round((correct / totalQuestions) * 100);
    const passed = percent >= quiz.passPercent;

    let xpAwarded = quiz.xp.baseComplete;
    if (passed) {
      xpAwarded += quiz.xp.passBonus;
      const extraPercent = percent - quiz.passPercent;
      if (extraPercent > 0) {
        xpAwarded += Math.min(quiz.xp.maxScoreBonus, Math.floor(extraPercent * 2));
      }
    }

    const previousBestXP = bestScore >= quiz.passPercent 
      ? quiz.xp.baseComplete + quiz.xp.passBonus + Math.min(quiz.xp.maxScoreBonus, Math.floor((bestScore - quiz.passPercent) * 2))
      : bestScore > 0 ? quiz.xp.baseComplete : 0;

    const actualXPAwarded = Math.max(0, xpAwarded - previousBestXP);

    setResults({ correct, total: totalQuestions, percent, passed, xpAwarded: actualXPAwarded });
    setQuizState('results');

    if (user && actualXPAwarded > 0) {
      try {
        await addXPToSkill(user.id, skillId, actualXPAwarded, undefined, { quizId, score: percent });
        await saveQuizAttempt({
          quizId,
          userId: user.id,
          totalQuestions,
          correctQuestions: correct,
          percent,
          passed,
          xpCalculated: xpAwarded,
          xpAwarded: actualXPAwarded,
          answers: answers.concat(selectedAnswer!),
        });
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }

    if (passed) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStartQuiz = () => {
    setQuizState('questions');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleRetry = () => {
    setQuizState('intro');
    setResults(null);
    loadBestScore();
  };

  const renderIntro = () => (
    <ScreenScrollView>
      <View style={styles.introContainer}>
        <View style={[styles.quizIcon, { backgroundColor: colors.accent + '20' }]}>
          <Feather name="help-circle" size={48} color={colors.accent} />
        </View>
        <ThemedText type="h2" style={{ textAlign: 'center' }}>{quiz.title}</ThemedText>
        
        <View style={[styles.infoCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.infoRow}>
            <Feather name="list" size={20} color={colors.textSecondary} />
            <ThemedText type="body">{totalQuestions} questoes</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Feather name="target" size={20} color={colors.textSecondary} />
            <ThemedText type="body">Minimo {quiz.passPercent}% para passar</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Feather name="zap" size={20} color={colors.accent} />
            <ThemedText type="body" style={{ color: colors.accent }}>
              Ate {quiz.xp.baseComplete + quiz.xp.passBonus + quiz.xp.maxScoreBonus} XP
            </ThemedText>
          </View>
          {bestScore > 0 && (
            <View style={styles.infoRow}>
              <Feather name="award" size={20} color={colors.success} />
              <ThemedText type="body" style={{ color: colors.success }}>
                Melhor resultado: {bestScore}%
              </ThemedText>
            </View>
          )}
        </View>

        <Button onPress={handleStartQuiz}>
          Comecar Quiz
        </Button>
      </View>
    </ScreenScrollView>
  );

  const renderQuestion = () => (
    <ThemedView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
        </View>
        <ThemedText type="small" style={{ color: colors.textSecondary }}>
          Questao {currentQuestionIndex + 1} de {totalQuestions}
        </ThemedText>
      </View>

      <ScreenScrollView>
        <View style={styles.questionContainer}>
          <ThemedText type="h3" style={styles.questionText}>
            {currentQuestion.prompt}
          </ThemedText>

          <View style={styles.choicesContainer}>
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showCorrect = showExplanation && isCorrect;
              const showIncorrect = showExplanation && isSelected && !isCorrect;

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.choiceButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && !showExplanation && { borderColor: colors.primary, borderWidth: 2 },
                    showCorrect && { backgroundColor: colors.success + '20', borderColor: colors.success, borderWidth: 2 },
                    showIncorrect && { backgroundColor: colors.error + '20', borderColor: colors.error, borderWidth: 2 },
                    Shadows.card,
                  ]}
                  onPress={() => handleSelectAnswer(index)}
                  disabled={showExplanation}
                >
                  <View style={[
                    styles.choiceLetter,
                    { backgroundColor: colors.backgroundSecondary },
                    isSelected && !showExplanation && { backgroundColor: colors.primary },
                    showCorrect && { backgroundColor: colors.success },
                    showIncorrect && { backgroundColor: colors.error },
                  ]}>
                    <ThemedText 
                      type="small" 
                      style={{ 
                        color: (isSelected || showCorrect || showIncorrect) ? '#FFFFFF' : colors.text,
                        fontWeight: '600',
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={{ flex: 1 }}>{choice}</ThemedText>
                  {showCorrect && <Feather name="check-circle" size={20} color={colors.success} />}
                  {showIncorrect && <Feather name="x-circle" size={20} color={colors.error} />}
                </Pressable>
              );
            })}
          </View>

          {showExplanation && currentQuestion.explanation && (
            <View style={[styles.explanationCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Feather name="info" size={18} color={colors.primary} />
              <ThemedText type="body" style={{ flex: 1, color: colors.textSecondary }}>
                {currentQuestion.explanation}
              </ThemedText>
            </View>
          )}
        </View>
      </ScreenScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: colors.backgroundRoot }]}>
        {!showExplanation ? (
          <Button onPress={handleConfirmAnswer} disabled={selectedAnswer === null}>
            Confirmar Resposta
          </Button>
        ) : (
          <Button onPress={handleNextQuestion}>
            {currentQuestionIndex < totalQuestions - 1 ? 'Proxima Questao' : 'Ver Resultado'}
          </Button>
        )}
      </View>
    </ThemedView>
  );

  const renderResults = () => (
    <ScreenScrollView>
      <View style={styles.resultsContainer}>
        <View style={[
          styles.resultIcon,
          { backgroundColor: results?.passed ? colors.success + '20' : colors.error + '20' }
        ]}>
          <Feather
            name={results?.passed ? 'check-circle' : 'x-circle'}
            size={64}
            color={results?.passed ? colors.success : colors.error}
          />
        </View>

        <ThemedText type="h2" style={{ textAlign: 'center' }}>
          {results?.passed ? 'Parabens!' : 'Nao foi dessa vez'}
        </ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {results?.passed 
            ? 'Voce passou no quiz com sucesso!' 
            : `Voce precisa de ${quiz.passPercent}% para passar. Tente novamente!`}
        </ThemedText>

        <View style={[styles.scoreCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={styles.scoreRow}>
            <ThemedText type="body">Acertos</ThemedText>
            <ThemedText type="h3">{results?.correct}/{results?.total}</ThemedText>
          </View>
          <View style={styles.scoreRow}>
            <ThemedText type="body">Porcentagem</ThemedText>
            <ThemedText type="h3" style={{ color: results?.passed ? colors.success : colors.error }}>
              {results?.percent}%
            </ThemedText>
          </View>
          {results && results.xpAwarded > 0 && (
            <View style={styles.scoreRow}>
              <ThemedText type="body">XP Ganho</ThemedText>
              <ThemedText type="h3" style={{ color: colors.accent }}>+{results.xpAwarded}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.resultActions}>
          <Button onPress={handleRetry} variant="outline">
            Tentar Novamente
          </Button>
          <Button onPress={() => navigation.goBack()}>
            Voltar ao Curso
          </Button>
        </View>
      </View>
    </ScreenScrollView>
  );

  if (quizState === 'intro') return renderIntro();
  if (quizState === 'results') return renderResults();
  return renderQuestion();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  introContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  quizIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  questionContainer: {
    gap: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  questionText: {
    lineHeight: 30,
  },
  choicesContainer: {
    gap: Spacing.md,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  choiceLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explanationCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  resultsContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultActions: {
    width: '100%',
    gap: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 100,
  },
});
