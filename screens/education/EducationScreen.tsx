import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows, LevelColors } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { SKILLS, getNextLevelInfo, calculateLevel } from '@/data/educationData';
import { Skill, SkillProgress } from '@/types';
import { getSkillProgress, getAllSkillProgress } from '@/utils/storage';

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

export default function EducationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const colors = isDark ? Colors.dark : Colors.light;

  const [skillProgresses, setSkillProgresses] = useState<Record<string, SkillProgress>>({});
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    if (!user) return;
    try {
      const allProgress = await getAllSkillProgress(user.id);
      const progressMap: Record<string, SkillProgress> = {};
      allProgress.forEach(p => {
        progressMap[p.skillId] = p;
      });
      setSkillProgresses(progressMap);
    } catch (error) {
      console.error('Error loading skill progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const totalXP = Object.values(skillProgresses).reduce((sum, p) => sum + p.xpTotal, 0);
  const coursesCompleted = Object.values(skillProgresses).reduce((sum, p) => sum + p.coursesCompleted.length, 0);

  const renderSkillCard = ({ item: skill }: { item: Skill }) => {
    const progress = skillProgresses[skill.id];
    const currentLevel = progress ? calculateLevel(progress.xpTotal, skill.progressionRules) : 'teaser';
    const nextLevelInfo = getNextLevelInfo(progress?.xpTotal || 0, skill.progressionRules);
    const completedCourses = progress?.coursesCompleted.length || 0;
    const totalCourses = skill.courses.length;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.skillCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
          Shadows.card,
        ]}
        onPress={() => navigation.navigate('SkillDetail', { skillId: skill.id })}
      >
        <View style={styles.skillHeader}>
          <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
            <Feather name={skill.icon as any} size={24} color={skill.color} />
          </View>
          <View style={styles.skillInfo}>
            <ThemedText type="h4">{skill.name}</ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {skill.description}
            </ThemedText>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.levelBadgeRow}>
            <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[currentLevel] }]}>
              <ThemedText type="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {LEVEL_LABELS[currentLevel]}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {progress?.xpTotal || 0} XP
            </ThemedText>
          </View>

          {nextLevelInfo ? (
            <View style={styles.progressBarContainer}>
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
            <ThemedText type="small" style={{ color: colors.success }}>
              Nivel maximo alcancado!
            </ThemedText>
          )}
        </View>

        <View style={styles.coursesRow}>
          <Feather name="book" size={14} color={colors.textSecondary} />
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            {completedCourses}/{totalCourses} cursos concluidos
          </ThemedText>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">Capacitacao</ThemedText>
        <ThemedText type="body" style={{ color: colors.textSecondary }}>
          Aprenda novas habilidades e evolua seu nivel
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
            <Feather name="zap" size={20} color={colors.accent} />
          </View>
          <ThemedText type="h3">{totalXP}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>XP Total</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
          </View>
          <ThemedText type="h3">{coursesCompleted}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Cursos</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.card]}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
            <Feather name="award" size={20} color={colors.primary} />
          </View>
          <ThemedText type="h3">{SKILLS.length}</ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>Skills</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Habilidades Disponiveis
        </ThemedText>
        {SKILLS.map(skill => (
          <View key={skill.id}>
            {renderSkillCard({ item: skill })}
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="info" size={20} color={colors.primary} />
        </View>
        <View style={styles.infoContent}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            Como funciona?
          </ThemedText>
          <ThemedText type="small" style={{ color: colors.textSecondary }}>
            Complete cursos e quizzes para ganhar XP. Quanto mais XP, maior seu nivel na habilidade.
            Niveis mais altos desbloqueiam mais tipos de servico e melhores oportunidades!
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  skillCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  skillIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressSection: {
    gap: Spacing.sm,
  },
  levelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressBarContainer: {
    gap: Spacing.xs,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  coursesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(45, 80, 22, 0.1)',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
});
