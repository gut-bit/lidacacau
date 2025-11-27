import React from 'react';
import { StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'accent';
  size?: 'normal' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  showSuccessAnimation?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  size = 'normal',
  style,
  textStyle,
  showSuccessAnimation = false,
}: AnimatedButtonProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const scale = useSharedValue(1);
  const successScale = useSharedValue(1);

  const getBackgroundColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'success': return colors.success;
      case 'danger': return colors.error;
      case 'secondary': return colors.backgroundSecondary;
      case 'accent': return colors.accent;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') return colors.text;
    if (variant === 'accent') return '#1a1a1a';
    return '#FFFFFF';
  };

  const getSizeStyles = () => {
    if (size === 'large') {
      return {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['2xl'],
        minHeight: 60,
      };
    }
    return {};
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * successScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const triggerSuccessAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    successScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (showSuccessAnimation) {
      triggerSuccessAnimation();
      setTimeout(() => {
        onPress();
      }, 200);
    } else {
      onPress();
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getSizeStyles(),
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size={size === 'large' ? 'large' : 'small'} />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={size === 'large' ? 22 : 18}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <ThemedText
            type={size === 'large' ? 'h4' : 'body'}
            style={[styles.text, { color: getTextColor() }, textStyle]}
          >
            {title}
          </ThemedText>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minHeight: 50,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontWeight: '600',
  },
});
