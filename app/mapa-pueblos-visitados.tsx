import React, { useEffect, useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet, Dimensions } from "react-native";

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

        const apiKey = "AIzaSyBjA1ki2LTMj_aMmoNz9ND5OnanBYAD9KQ";
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=40.2,-3.7&zoom=6&size=800x800&maptype=roadmap&markers=color:red|${markers}&key=${apiKey}`;

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
    <View style={styles.center}>
      <Image
        source={{ uri: mapUrl }}
        style={{
          width: Dimensions.get("window").width - 20,
          height: Dimensions.get("window").width - 20,
          borderRadius: 12,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
});
