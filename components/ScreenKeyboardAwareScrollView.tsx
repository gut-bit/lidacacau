import { Platform, ScrollView, StyleSheet } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

import { useTheme } from "@/hooks/useTheme";
import { useSimpleScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing } from "@/constants/theme";

export function ScreenKeyboardAwareScrollView({
  children,
  contentContainerStyle,
  style,
  keyboardShouldPersistTaps = "handled",
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  const { theme } = useTheme();
  const { paddingTop, paddingBottom, scrollInsetBottom, isWeb } = useSimpleScreenInsets();

  const containerStyles = [
    styles.container,
    { backgroundColor: theme.backgroundRoot },
    style,
  ];

  const contentStyles = [
    { paddingTop, paddingBottom },
    styles.contentContainer,
    contentContainerStyle,
  ];

  if (isWeb) {
    return (
      <ScrollView
        style={containerStyles}
        contentContainerStyle={contentStyles}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={containerStyles}
      contentContainerStyle={contentStyles}
      scrollIndicatorInsets={{ bottom: scrollInsetBottom }}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...scrollViewProps}
    >
      {children}
    </KeyboardAwareScrollView>
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
