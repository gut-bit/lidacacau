import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from './ThemedText';
import { User, Badge, Goal, ProfileCompletion, DEFAULT_BADGES } from '@/types';
import { Spacing, BorderRadius, LevelColors } from '@/constants/theme';
import { formatCurrency, getLevelLabel } from '@/utils/format';

interface ProfileStatsProps {
  user: User;
  onBadgePress?: (badge: Badge) => void;
  onGoalPress?: (goal: Goal) => void;
}

export function ProfileStats({ user, onBadgePress, onGoalPress }: ProfileStatsProps) {
  const { theme: colors } = useTheme();
  
  const activeRole = user.activeRole || user.role;
  const isWorker = activeRole === 'worker';
  
  const level = isWorker ? user.level : user.producerLevel;
  const rating = isWorker ? user.averageRating : user.producerRating;
  const reviews = isWorker ? user.totalReviews : user.producerReviews;
  const levelColor = level ? LevelColors[`N${level}` as keyof typeof LevelColors] : colors.textSecondary;
  
  const profileCompletion = user.profileCompletion || {
    hasAvatar: false,
    hasBio: false,
    hasPhone: false,
    hasLocation: false,
    hasProperties: false,
    hasSkills: false,
    hasEquipment: false,
    hasAvailability: false,
    percentage: 0,
  };

  const earnedBadges = user.badges?.filter(b => b.earnedAt) || [];
  const availableBadges = DEFAULT_BADGES.filter(
    b => !earnedBadges.find(eb => eb.id === b.id)
  ).slice(0, 3);

  const goals = user.goals || [];

  const stats = isWorker ? [
    { 
      label: 'Trabalhos', 
      value: user.workerProfile?.totalJobs || 0, 
      icon: 'briefcase',
      color: colors.primary,
    },
    { 
      label: 'Ganhos', 
      value: formatCurrency(user.workerProfile?.totalEarnings || 0), 
      icon: 'dollar-sign',
      color: colors.accent,
    },
    { 
      label: 'Avaliacao', 
      value: rating?.toFixed(1) || '0.0', 
      icon: 'star',
      color: '#FFB800',
    },
  ] : [
    { 
      label: 'Demandas', 
      value: user.producerProfile?.totalJobs || 0, 
      icon: 'file-text',
      color: colors.primary,
    },
    { 
      label: 'Investido', 
      value: formatCurrency(user.producerProfile?.totalSpent || 0), 
      icon: 'trending-up',
      color: colors.secondary,
    },
    { 
      label: 'Avaliacao', 
      value: rating?.toFixed(1) || '0.0', 
      icon: 'star',
      color: '#FFB800',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.levelCard, { backgroundColor: levelColor + '15', borderColor: levelColor }]}>
        <View style={styles.levelHeader}>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
              {getLevelLabel(level || 1)}
            </ThemedText>
          </View>
          <View style={styles.levelInfo}>
            <ThemedText type="h4">
              {isWorker ? 'Trabalhador' : 'Produtor'}
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              {reviews || 0} avaliacoes
            </ThemedText>
          </View>
          <View style={styles.ratingBox}>
            <Feather name="star" size={20} color="#FFB800" />
            <ThemedText type="h3" style={{ color: '#FFB800' }}>
              {rating?.toFixed(1) || '0.0'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Feather name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <ThemedText type="h4" style={{ color: colors.text }}>
                {stat.value}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {stat.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <ThemedText type="h4">Perfil Completo</ThemedText>
          </View>
          <ThemedText type="h3" style={{ color: colors.success }}>
            {profileCompletion.percentage}%
          </ThemedText>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.success,
                  width: `${profileCompletion.percentage}%`,
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.completionItems}>
          <CompletionItem 
            label="Foto de perfil" 
            completed={profileCompletion.hasAvatar} 
            colors={colors}
          />
          <CompletionItem 
            label="Telefone" 
            completed={profileCompletion.hasPhone} 
            colors={colors}
          />
          <CompletionItem 
            label="Localizacao" 
            completed={profileCompletion.hasLocation} 
            colors={colors}
          />
          {isWorker ? (
            <>
              <CompletionItem 
                label="Habilidades" 
                completed={profileCompletion.hasSkills} 
                colors={colors}
              />
              <CompletionItem 
                label="Disponibilidade" 
                completed={profileCompletion.hasAvailability} 
                colors={colors}
              />
            </>
          ) : (
            <CompletionItem 
              label="Propriedades" 
              completed={profileCompletion.hasProperties} 
              colors={colors}
            />
          )}
        </View>
      </View>

      {earnedBadges.length > 0 ? (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="award" size={18} color={colors.accent} />
              <ThemedText type="h4">Suas Conquistas</ThemedText>
            </View>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesList}
          >
            {earnedBadges.map((badge) => (
              <Pressable
                key={badge.id}
                style={[styles.badgeItem, { backgroundColor: badge.color + '15' }]}
                onPress={() => onBadgePress?.(badge)}
              >
                <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                  <Feather name={badge.icon as any} size={20} color="#FFFFFF" />
                </View>
                <ThemedText type="small" style={{ fontWeight: '600', textAlign: 'center' }}>
                  {badge.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {availableBadges.length > 0 ? (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="target" size={18} color={colors.primary} />
              <ThemedText type="h4">Proximas Conquistas</ThemedText>
            </View>
          </View>
          
          {availableBadges.map((badge) => (
            <View 
              key={badge.id} 
              style={[styles.nextBadgeItem, { borderColor: colors.border }]}
            >
              <View style={[styles.badgeIconSmall, { backgroundColor: colors.textSecondary + '30' }]}>
                <Feather name={badge.icon as any} size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.nextBadgeInfo}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  {badge.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {badge.requirement}
                </ThemedText>
              </View>
              <Feather name="lock" size={16} color={colors.textSecondary} />
            </View>
          ))}
        </View>
      ) : null}

      {goals.length > 0 ? (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="flag" size={18} color={colors.secondary} />
              <ThemedText type="h4">Suas Metas</ThemedText>
            </View>
          </View>
          
          {goals.slice(0, 3).map((goal) => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            
            return (
              <Pressable
                key={goal.id}
                style={[styles.goalItem, { borderColor: colors.border }]}
                onPress={() => onGoalPress?.(goal)}
              >
                <View style={[styles.goalIcon, { backgroundColor: colors.secondary + '20' }]}>
                  <Feather name={goal.icon as any} size={18} color={colors.secondary} />
                </View>
                <View style={styles.goalInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {goal.title}
                  </ThemedText>
                  <View style={[styles.goalProgress, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.goalProgressFill, 
                        { 
                          backgroundColor: colors.secondary,
                          width: `${progress}%`,
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    {goal.current} / {goal.target} - {goal.reward}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function CompletionItem({ 
  label, 
  completed, 
  colors 
}: { 
  label: string; 
  completed: boolean; 
  colors: any;
}) {
  return (
    <View style={styles.completionItem}>
      <Feather 
        name={completed ? 'check-circle' : 'circle'} 
        size={16} 
        color={completed ? colors.success : colors.textSecondary} 
      />
      <ThemedText 
        type="small" 
        style={{ 
          color: completed ? colors.text : colors.textSecondary,
          textDecorationLine: completed ? 'line-through' : 'none',
        }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  levelCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
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
  completionItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgesList: {
    gap: Spacing.md,
  },
  badgeItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    width: 90,
    gap: Spacing.sm,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  nextBadgeInfo: {
    flex: 1,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    gap: 4,
  },
  goalProgress: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
