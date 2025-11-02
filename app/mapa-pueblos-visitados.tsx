import React, { useEffect, useState } from "react";
import { Platform, View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";

export default function MapaPueblosVisitados() {
  const [MapModule, setMapModule] = useState<any>(null);
  const [pueblos, setPueblos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar react-native-maps solo en móvil
  useEffect(() => {
    if (Platform.OS !== "web") {
      import("react-native-maps")
        .then((mod) => setMapModule(mod))
        .catch(() => setMapModule(null));
    }
  }, []);

  // 🔹 Cargar datos de pueblos
  useEffect(() => {
    fetch("https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-mapa")
      .then((res) => res.json())
      .then((data) => {
        setPueblos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <Text>El mapa se muestra solo en la app móvil.</Text>
      </View>
    );
  }

  if (!MapModule) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  const { default: MapView, Marker, Callout } = MapModule;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 40.2,
        longitude: -3.7,
        latitudeDelta: 6,
        longitudeDelta: 6,
      }}
    >
      {pueblos.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          title={p.nombre}
        >
          <Callout>
            <View style={{ width: 150, alignItems: "center" }}>
              {p.foto ? (
                <Image
                  source={{ uri: p.foto }}
                  style={{ width: 120, height: 80, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={{ textAlign: "center", marginTop: 5 }}>{p.nombre}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
