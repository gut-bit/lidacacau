import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { createReview } from '@/utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const CRITERIA = [
  { key: 'quality', label: 'Qualidade', icon: 'star' },
  { key: 'safety', label: 'Segurança', icon: 'shield' },
  { key: 'punctuality', label: 'Pontualidade', icon: 'clock' },
  { key: 'communication', label: 'Comunicação', icon: 'message-circle' },
  { key: 'fairness', label: 'Justiça/Preço', icon: 'dollar-sign' },
] as const;

export default function ReviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { workOrderId, revieweeId, revieweeName } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [ratings, setRatings] = useState<Record<string, number>>({
    quality: 0,
    safety: 0,
    punctuality: 0,
    communication: 0,
    fairness: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 5;
  const isValid = Object.values(ratings).every((r) => r > 0);

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Erro', 'Avalie todos os critérios');
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        workOrderId,
        reviewerId: user!.id,
        revieweeId,
        reviewerRole: user!.role === 'producer' ? 'producer' : 'worker',
        quality: ratings.quality,
        safety: ratings.safety,
        punctuality: ratings.punctuality,
        communication: ratings.communication,
        fairness: ratings.fairness,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Sucesso', 'Avaliação enviada!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar a avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (criteriaKey: string, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRatings({ ...ratings, [criteriaKey]: star })}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather
              name="star"
              size={32}
              color={star <= currentRating ? colors.accent : colors.border}
              style={{ marginHorizontal: 2 }}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h3" style={{ textAlign: 'center' }}>
            Avaliar {revieweeName}
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Como foi sua experiência?
          </ThemedText>
        </View>

        <View style={styles.criteriaContainer}>
          {CRITERIA.map((criteria) => (
            <View
              key={criteria.key}
              style={[styles.criteriaCard, { backgroundColor: colors.card }, Shadows.card]}
            >
              <View style={styles.criteriaHeader}>
                <Feather name={criteria.icon as any} size={20} color={colors.primary} />
                <ThemedText type="h4">{criteria.label}</ThemedText>
              </View>
              {renderStars(criteria.key, ratings[criteria.key])}
            </View>
          ))}
        </View>

        {averageRating > 0 && (
          <View style={[styles.averageCard, { backgroundColor: colors.accent + '20' }]}>
            <ThemedText type="body" style={{ color: colors.accent }}>
              Média
            </ThemedText>
            <ThemedText type="h2" style={{ color: colors.accent }}>
              {averageRating.toFixed(1)}
            </ThemedText>
          </View>
        )}

        <View style={styles.commentSection}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
            Comentário (opcional)
          </ThemedText>
          <View
            style={[
              styles.textAreaWrapper,
              { backgroundColor: colors.backgroundDefault, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Compartilhe sua experiência..."
              placeholderTextColor={colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Button onPress={handleSubmit} disabled={submitting || !isValid} style={styles.submitButton}>
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : 'Enviar Avaliação'}
        </Button>
      </ScreenKeyboardAwareScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  criteriaContainer: {
    gap: Spacing.md,
  },
  criteriaCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  averageCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  commentSection: {
    marginTop: Spacing['2xl'],
  },
  textAreaWrapper: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing['2xl'],
  },
});
