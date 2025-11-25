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
import { getSkillById, getNextLevelInfo, calculateLevel } from '@/data/educationData';
import { Skill, SkillProgress, Course } from '@/types';
import { getSkillProgress } from '@/utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'SkillDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_LABELS: Record<string, string> = {
  teaser: 'Iniciante',
  N1_assistido: 'N1 Assistido',
  N2_autonomo: 'N2 Autonomo',
  N3_mentoravel: 'N3 Mentor',
};

const LEVEL_COLORS: Record<string, string> = {
  teaser: '#6C757D',
  N1_assistido: '#28A745',
  N2_autonomo: '#007BFF',
  N3_mentoravel: '#FFD700',
};

export default function SkillDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props['route']>();
  const { skillId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const [progress, setProgress] = useState<SkillProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const skill = getSkillById(skillId);

  const loadProgress = useCallback(async () => {
    if (!user || !skill) return;
    try {
      const p = await getSkillProgress(user.id, skill.id);
      setProgress(p);
    } catch (error) {
      console.error('Error loading skill progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, skill]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  if (!skill) {
    return (
      <ScreenScrollView>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <ThemedText type="h3">Habilidade nao encontrada</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const currentLevel = progress ? calculateLevel(progress.xpTotal, skill.progressionRules) : 'teaser';
  const nextLevelInfo = getNextLevelInfo(progress?.xpTotal || 0, skill.progressionRules);
  const completedCourses = progress?.coursesCompleted || [];

  const isCourseCompleted = (courseId: string) => completedCourses.includes(courseId);
  const isCourseUnlocked = (course: Course) => {
    if (!course.prerequisites || course.prerequisites.length === 0) return true;
    return course.prerequisites.every(prereq => completedCourses.includes(prereq));
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
          <Feather name={skill.icon as any} size={32} color={skill.color} />
        </View>
        <ThemedText type="h2">{skill.name}</ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
          {skill.description}
        </ThemedText>
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.card }, Shadows.card]}>
        <View style={styles.progressHeader}>
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[currentLevel] }]}>
            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600' }}>
              {LEVEL_LABELS[currentLevel]}
            </ThemedText>
          </View>
          <View style={styles.xpContainer}>
            <Feather name="zap" size={18} color={colors.accent} />
            <ThemedText type="h4" style={{ color: colors.accent }}>
              {progress?.xpTotal || 0} XP
            </ThemedText>
          </View>
        </View>

        {nextLevelInfo ? (
          <View style={styles.progressBarSection}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: skill.color,
                    width: `${Math.min(100, nextLevelInfo.progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {nextLevelInfo.xpNeeded} XP para {LEVEL_LABELS[nextLevelInfo.nextLevel.level]}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.maxLevelContainer}>
            <Feather name="award" size={20} color={colors.success} />
            <ThemedText type="body" style={{ color: colors.success }}>
              Nivel maximo alcancado!
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Niveis de Progressao
        </ThemedText>
        {skill.progressionRules.map((rule, index) => {
          const isCurrentLevel = rule.level === currentLevel;
          const isPassed = (progress?.xpTotal || 0) >= rule.xpRequired;
          
          return (
            <View
              key={rule.level}
              style={[
                styles.levelCard,
                { backgroundColor: colors.card },
                isCurrentLevel && { borderColor: skill.color, borderWidth: 2 },
                Shadows.card,
              ]}
            >
              <View style={styles.levelHeader}>
                <View style={[styles.levelIndicator, { backgroundColor: isPassed ? LEVEL_COLORS[rule.level] : colors.backgroundSecondary }]}>
                  {isPassed ? (
                    <Feather name="check" size={16} color="#FFFFFF" />
                  ) : (
                    <ThemedText type="small" style={{ color: colors.textSecondary }}>{index + 1}</ThemedText>
                  )}
                </View>
                <View style={styles.levelInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{rule.title}</ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>{rule.description}</ThemedText>
                </View>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {rule.xpRequired} XP
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Cursos Disponiveis
        </ThemedText>
        {skill.courses.map((course) => {
          const completed = isCourseCompleted(course.id);
          const unlocked = isCourseUnlocked(course);
          
          return (
            <Pressable
              key={course.id}
              style={({ pressed }) => [
                styles.courseCard,
                { backgroundColor: colors.card, opacity: pressed && unlocked ? 0.9 : 1 },
                !unlocked && { opacity: 0.6 },
                Shadows.card,
              ]}
              onPress={() => unlocked && navigation.navigate('CourseDetail', { courseId: course.id })}
              disabled={!unlocked}
            >
              <View style={styles.courseHeader}>
                <View style={[styles.courseIcon, { backgroundColor: completed ? colors.success + '20' : skill.color + '20' }]}>
                  {completed ? (
                    <Feather name="check-circle" size={24} color={colors.success} />
                  ) : unlocked ? (
                    <Feather name="book-open" size={24} color={skill.color} />
                  ) : (
                    <Feather name="lock" size={24} color={colors.textSecondary} />
                  )}
                </View>
                <View style={styles.courseInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{course.title}</ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {course.description}
                  </ThemedText>
                  <View style={styles.courseMetaRow}>
                    <View style={styles.courseMeta}>
                      <Feather name="clock" size={12} color={colors.textSecondary} />
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>{course.duration}</ThemedText>
                    </View>
                    <View style={styles.courseMeta}>
                      <Feather name="zap" size={12} color={colors.accent} />
                      <ThemedText type="small" style={{ color: colors.accent }}>+{course.xpReward} XP</ThemedText>
                    </View>
                    <View style={[styles.levelTag, { backgroundColor: LEVEL_COLORS[course.level] + '20' }]}>
                      <ThemedText type="small" style={{ color: LEVEL_COLORS[course.level], fontSize: 11 }}>
                        {LEVEL_LABELS[course.level]}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={unlocked ? colors.textSecondary : colors.backgroundSecondary} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  skillIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressBarSection: {
    gap: Spacing.xs,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  maxLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  levelCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  levelIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInfo: {
    flex: 1,
    gap: 2,
  },
  courseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 100,
  },
});
