import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";

export default function MapaPueblosVisitados() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-mapa")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          setError("No se recibieron pueblos del endpoint.");
          return;
        }

        // Limitamos a 50 pueblos para evitar límite de URL
        const limited = data.slice(0, 50);
        const markers = limited.map((p) => `${p.lat},${p.lng}`).join("|");

        const apiKey = "AIzaSyBjA1ki2LTMj_aMmoNz9ND5OnanBYAD9KQ";
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=40.2,-3.7&zoom=6&size=800x800&maptype=roadmap&markers=color:red|${markers}&key=${apiKey}`;

        setMapUrl(url);
      })
      .catch((err) => {
        setError("Error al cargar datos: " + err.message);
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!mapUrl) {
    return (
      <View style={styles.center}>
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa de Pueblos Visitados</Text>
      <Image
        source={{ uri: mapUrl }}
        style={styles.map}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openURL(mapUrl)}
      >
        <Text style={styles.buttonText}>Abrir en Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 20 },
  map: { width: 320, height: 320, borderRadius: 12 },
  button: {
    marginTop: 20,
    backgroundColor: "#d60000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  error: { color: "red", textAlign: "center", paddingHorizontal: 20 },
});
