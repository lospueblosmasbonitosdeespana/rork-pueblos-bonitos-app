import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { RefreshCw } from "lucide-react-native";

interface PuebloVisitado {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  foto?: string;
}

export default function MapaPueblosVisitados() {
  const [MapModule, setMapModule] = useState<any>(null);
  const [pueblos, setPueblos] = useState<PuebloVisitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      import("react-native-maps")
        .then((mod) => setMapModule(mod))
        .catch(() => setMapModule(null));
    }
  }, []);

  const fetchPueblos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/mapa-visitados?user_id=14782"
      );
      
      if (!response.ok) {
        throw new Error("Error al cargar los pueblos visitados");
      }
      
      const data = await response.json();
      setPueblos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching pueblos:", err);
      setError("No se pudieron cargar los pueblos visitados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      fetchPueblos();
    }
  }, []);

  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <Text style={styles.webMessage}>El mapa nativo se muestra solo en la app móvil.</Text>
      </View>
    );
  }

  if (!MapModule) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d60000" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const { default: MapView, Marker, Callout, PROVIDER_GOOGLE } = MapModule;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d60000" />
        <Text style={styles.loadingText}>Cargando pueblos visitados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPueblos}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pueblos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aún no has visitado pueblos</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPueblos}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Recargar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 40.0,
          longitude: -3.7,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {pueblos.map((pueblo) => (
          <Marker
            key={pueblo.id}
            coordinate={{
              latitude: pueblo.lat,
              longitude: pueblo.lng,
            }}
            pinColor="#d60000"
            title={pueblo.nombre}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                {pueblo.foto ? (
                  <Image
                    source={{ uri: pueblo.foto }}
                    style={styles.calloutImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={styles.calloutTitle}>{pueblo.nombre}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.reloadButton}
        onPress={fetchPueblos}
        activeOpacity={0.8}
      >
        <RefreshCw size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  webMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#d60000",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d60000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reloadButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#d60000",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    width: 180,
    alignItems: "center",
    padding: 8,
  },
  calloutImage: {
    width: 160,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
