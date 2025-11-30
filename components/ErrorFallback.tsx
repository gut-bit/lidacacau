import React from "react";
import { reloadAppAsync } from "expo";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Spacing, Colors } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = Colors.light;

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDefault }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Ops! Algo deu errado
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          O LidaCacau encontrou um problema. Por favor, reinicie.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
            Reiniciar App
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  button: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: 8,
    marginTop: Spacing.lg,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
