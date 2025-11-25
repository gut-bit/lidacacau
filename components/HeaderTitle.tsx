import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title?: string;
}

export function HeaderTitle({ title = "Agro work" }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.icon}
        contentFit="contain"
      />
      <ThemedText type="h4">{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.sm,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
});
