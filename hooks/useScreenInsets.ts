import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

interface ScreenInsetsOptions {
  hasTabBar?: boolean;
  hasHeader?: boolean;
}

const DEFAULT_TAB_BAR_HEIGHT = 80;
const DEFAULT_HEADER_HEIGHT = 56;
const WEB_EXTRA_BOTTOM_PADDING = 80;

export function useScreenInsets(options: ScreenInsetsOptions = { hasTabBar: true, hasHeader: true }) {
  const insets = useSafeAreaInsets();
  const { hasTabBar = true, hasHeader = true } = options;
  const isWeb = Platform.OS === 'web';

  const tabBarHeight = hasTabBar ? DEFAULT_TAB_BAR_HEIGHT : 0;
  const headerHeight = hasHeader ? DEFAULT_HEADER_HEIGHT : 0;
  const webExtraPadding = isWeb ? WEB_EXTRA_BOTTOM_PADDING : 0;

  const paddingTop = hasHeader ? headerHeight + Spacing.xl : insets.top + Spacing.xl;
  const paddingBottom = hasTabBar 
    ? tabBarHeight + Spacing.xl + webExtraPadding 
    : insets.bottom + Spacing.xl + webExtraPadding;
  const scrollInsetBottom = insets.bottom + 16;

  return {
    paddingTop,
    paddingBottom,
    scrollInsetBottom,
    tabBarHeight,
    headerHeight,
    insets,
    isWeb,
  };
}

export function useSimpleScreenInsets() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const webExtraPadding = isWeb ? WEB_EXTRA_BOTTOM_PADDING : 0;

  return {
    paddingTop: insets.top + Spacing.xl,
    paddingBottom: insets.bottom + Spacing.xl + webExtraPadding,
    scrollInsetBottom: insets.bottom + 16,
    insets,
    isWeb,
  };
}
