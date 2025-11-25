import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

interface ScreenInsetsOptions {
  hasTabBar?: boolean;
  hasHeader?: boolean;
}

const DEFAULT_TAB_BAR_HEIGHT = 80;
const DEFAULT_HEADER_HEIGHT = 56;

export function useScreenInsets(options: ScreenInsetsOptions = { hasTabBar: true, hasHeader: true }) {
  const insets = useSafeAreaInsets();
  const { hasTabBar = true, hasHeader = true } = options;

  const tabBarHeight = hasTabBar ? DEFAULT_TAB_BAR_HEIGHT : 0;
  const headerHeight = hasHeader ? DEFAULT_HEADER_HEIGHT : 0;

  return {
    paddingTop: hasHeader ? headerHeight + Spacing.xl : insets.top + Spacing.xl,
    paddingBottom: hasTabBar ? tabBarHeight + Spacing.xl : insets.bottom + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
    tabBarHeight,
    headerHeight,
    insets,
  };
}
