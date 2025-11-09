import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING, TYPOGRAPHY } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Página no encontrada" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta página no existe</Text>

        <Link href="/home" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  link: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
});
