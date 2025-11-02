import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

export default function MapaPueblosVisitados() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <Text style={styles.webMessage}>El mapa se muestra solo en la app móvil.</Text>
        <Text style={styles.webMessageSecondary}>Escanea el código QR para ver el mapa.</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.message}>Mapa de pueblos visitados</Text>
      <Text style={styles.secondary}>Esta funcionalidad está en desarrollo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  webMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  webMessageSecondary: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  secondary: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
