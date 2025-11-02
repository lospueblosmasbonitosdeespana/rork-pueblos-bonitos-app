import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function MapaPueblosVisitados() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <Text>El mapa se muestra solo en la app móvil.</Text>
      </View>
    );
  }

  const mapaUrl = "https://lospueblosmasbonitosdeespana.org/account-2/mapa-de-pueblos-visitados/?app=1";

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: mapaUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});
