import React, { useEffect, useState } from "react";
import { View, Image, Text, ScrollView, StyleSheet } from "react-native";

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

        // Limitamos a 50 marcadores para evitar el error de URL larga
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

  return (
    <ScrollView contentContainerStyle={styles.center}>
      {error && <Text style={styles.error}>{error}</Text>}
      {mapUrl ? (
        <>
          <Text style={styles.text}>Mapa cargado desde Google Static API:</Text>
          <Image
            source={{ uri: mapUrl }}
            style={{ width: 320, height: 320, borderRadius: 12 }}
            resizeMode="cover"
          />
          <Text selectable style={styles.url}>
            {mapUrl}
          </Text>
        </>
      ) : (
        !error && <Text>Cargando mapa...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
  url: { fontSize: 10, color: "#444", marginTop: 10 },
  text: { fontSize: 14, marginVertical: 10 },
});
