import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function MapaPueblosVisitados() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-mapa")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const markers = data
          .map((p) => `${p.lat},${p.lng}`)
          .join("|");

        const url = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBjA1ki2LTMj_aMmoNz9ND5OnanBYAD9KQ&center=40.2,-3.7&zoom=6&maptype=roadmap&markers=${markers}`;
        setMapUrl(url);
      })
      .catch(() => setMapUrl(null));
  }, []);

  if (!mapUrl) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: mapUrl }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator style={styles.center} size="large" />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
