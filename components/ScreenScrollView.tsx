import { Platform, ScrollView, ScrollViewProps, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

function useWebSafeInsets() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + Spacing.xl,
    paddingBottom: insets.bottom + Spacing.xl + 80,
    scrollInsetBottom: insets.bottom + 16,
  };
}

function useNativeInsets() {
  const { useHeaderHeight } = require("@react-navigation/elements");
  const { useBottomTabBarHeight } = require("@react-navigation/bottom-tabs");
  const insets = useSafeAreaInsets();
  
  let headerHeight = 0;
  let tabBarHeight = 0;
  
  try {
    headerHeight = useHeaderHeight();
  } catch {
    headerHeight = 0;
  }
  
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 0;
  }

  return {
    paddingTop: headerHeight > 0 ? headerHeight + Spacing.xl : insets.top + Spacing.xl,
    paddingBottom: tabBarHeight > 0 ? tabBarHeight + Spacing.xl : insets.bottom + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
  };
}

export function ScreenScrollView({
  children,
  contentContainerStyle,
  style,
  ...scrollViewProps
}: ScrollViewProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const paddingTop = insets.top + Spacing.xl;
  const paddingBottom = insets.bottom + Spacing.xl + (Platform.OS === 'web' ? 80 : 0);
  const scrollInsetBottom = insets.bottom + 16;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
        style,
      ]}
      contentContainerStyle={[
        {
          paddingTop,
          paddingBottom,
        },
        styles.contentContainer,
        contentContainerStyle,
      ]}
      scrollIndicatorInsets={{ bottom: scrollInsetBottom }}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
});
