import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getCourseById, getQuizById } from '@/data/educationData';
import { CourseModule, SkillProgress } from '@/types';
import { getSkillProgress, addXPToSkill } from '@/utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_LABELS: Record<string, string> = {
  teaser: 'Iniciante',
  N1_assistido: 'N1 Assistido',
  N2_autonomo: 'N2 Autonomo',
  N3_mentoravel: 'N3 Mentor',
};

export default function CourseDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props['route']>();
  const { courseId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<SkillProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const courseData = getCourseById(courseId);

  const loadProgress = useCallback(async () => {
    if (!user || !courseData) return;
    try {
      const p = await getSkillProgress(user.id, courseData.skill.id);
      setProgress(p);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, courseData]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  if (!courseData) {
    return (
      <ScreenScrollView>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="h3">Curso nao encontrado</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const { skill, course } = courseData;
  const isCourseCompleted = progress?.coursesCompleted?.includes(courseId);
  const quiz = course.quizId ? getQuizById(course.quizId) : null;
  const allModulesCompleted = completedModules.size === course.modules.length;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const markModuleComplete = (moduleId: string) => {
    setCompletedModules(prev => {
      const newSet = new Set(prev);
      newSet.add(moduleId);
      return newSet;
    });
  };

  const handleStartQuiz = () => {
    if (quiz) {
      navigation.navigate('Quiz', { quizId: quiz.id, skillId: skill.id });
    }
  };

  const handleCompleteCourse = async () => {
    if (!user || isCourseCompleted) return;
    try {
      await addXPToSkill(user.id, skill.id, course.xpReward, courseId);
      loadProgress();
    } catch (error) {
      console.error('Error completing course:', error);
    }
  };

  const renderModuleContent = (module: CourseModule) => {
    if (module.contentType === 'checklist') {
      return (
        <View style={styles.checklistContainer}>
          {module.content.map((item, idx) => (
            <View key={idx} style={styles.checklistItem}>
              <View style={[styles.checklistBullet, { backgroundColor: skill.color }]} />
              <ThemedText type="body" style={{ flex: 1 }}>{item}</ThemedText>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.textContent}>
        {module.content.map((paragraph, idx) => (
          <ThemedText key={idx} type="body" style={{ color: colors.textSecondary, lineHeight: 24 }}>
            {paragraph}
          </ThemedText>
        ))}
      </View>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.levelTag, { backgroundColor: skill.color + '20' }]}>
          <ThemedText type="small" style={{ color: skill.color }}>
            {LEVEL_LABELS[course.level]}
          </ThemedText>
        </View>
        <ThemedText type="h2">{course.title}</ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary }}>
          {course.description}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={16} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>{course.duration}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="book" size={16} color={colors.textSecondary} />
            <ThemedText type="small" style={{ color: colors.textSecondary }}>{course.modules.length} modulos</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="zap" size={16} color={colors.accent} />
            <ThemedText type="small" style={{ color: colors.accent }}>+{course.xpReward} XP</ThemedText>
          </View>
        </View>
      </View>

      {isCourseCompleted && (
        <View style={[styles.completedBanner, { backgroundColor: colors.success + '20' }]}>
          <Feather name="check-circle" size={20} color={colors.success} />
          <ThemedText type="body" style={{ color: colors.success, fontWeight: '600' }}>
            Curso concluido!
          </ThemedText>
        </View>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>Progresso</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {completedModules.size}/{course.modules.length} modulos
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: skill.color,
                width: `${(completedModules.size / course.modules.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.modulesSection}>
        <ThemedText type="h4" style={styles.sectionTitle}>Conteudo do Curso</ThemedText>
        {course.modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.id);
          const isCompleted = completedModules.has(module.id);
          
          return (
            <View
              key={module.id}
              style={[styles.moduleCard, { backgroundColor: colors.card }, Shadows.card]}
            >
              <Pressable
                style={styles.moduleHeader}
                onPress={() => toggleModule(module.id)}
              >
                <View style={[styles.moduleNumber, { backgroundColor: isCompleted ? colors.success : skill.color }]}>
                  {isCompleted ? (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  ) : (
                    <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>{index + 1}</ThemedText>
                  )}
                </View>
                <View style={styles.moduleInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{module.title}</ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>{module.description}</ThemedText>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
              
              {isExpanded && (
                <View style={styles.moduleContent}>
                  {renderModuleContent(module)}
                  {!isCompleted && (
                    <Pressable
                      style={[styles.markCompleteButton, { borderColor: skill.color }]}
                      onPress={() => markModuleComplete(module.id)}
                    >
                      <Feather name="check" size={16} color={skill.color} />
                      <ThemedText type="small" style={{ color: skill.color, fontWeight: '600' }}>
                        Marcar como lido
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.actionsSection}>
        {quiz && (
          <View style={[styles.quizCard, { backgroundColor: colors.card }, Shadows.card]}>
            <View style={styles.quizInfo}>
              <View style={[styles.quizIcon, { backgroundColor: colors.accent + '20' }]}>
                <Feather name="help-circle" size={24} color={colors.accent} />
              </View>
              <View style={styles.quizDetails}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Quiz Final</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {quiz.questions.length} questoes - Minimo {quiz.passPercent}% para passar
                </ThemedText>
              </View>
            </View>
            <Button onPress={handleStartQuiz}>
              Iniciar Quiz
            </Button>
          </View>
        )}

        {!isCourseCompleted && allModulesCompleted && !quiz && (
          <Button onPress={handleCompleteCourse}>
            Concluir Curso (+{course.xpReward} XP)
          </Button>
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  levelTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  progressSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modulesSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  moduleCard: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  moduleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleInfo: {
    flex: 1,
    gap: 2,
  },
  moduleContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.lg,
  },
  textContent: {
    gap: Spacing.md,
  },
  checklistContainer: {
    gap: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checklistBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  markCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
  },
  actionsSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  quizCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.lg,
  },
  quizInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quizIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizDetails: {
    flex: 1,
    gap: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 100,
  },
});
