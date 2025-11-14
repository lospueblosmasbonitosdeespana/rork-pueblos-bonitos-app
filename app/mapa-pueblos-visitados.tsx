import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "@/contexts/auth";
import { RefreshCw } from "lucide-react-native";

interface PuebloVisitado {
  id: number;
  name: string;
  lat: number;
  lng: number;
  photo?: string;
}

export default function MapaPueblosVisitados() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [pueblos, setPueblos] = useState<PuebloVisitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPueblosVisitados = useCallback(async () => {
    if (!user?.id) {
      setError("No hay usuario logueado");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("🗺️ Cargando mapa de pueblos visitados...");
      
      const response = await fetch(
        "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/mapa-visitados",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Pueblos visitados cargados:", data.length);
      
      setPueblos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando pueblos visitados:", err);
      setError("Error al cargar el mapa");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      fetchPueblosVisitados();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
      setError("Debes iniciar sesión para ver tus pueblos visitados");
    }
  }, [authLoading, isAuthenticated, user?.id, fetchPueblosVisitados]);

  if (authLoading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d60000" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchPueblosVisitados}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pueblos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aún no tienes pueblos visitados</Text>
        <Text style={styles.emptySubtext}>
          Escanea códigos QR en los pueblos para marcarlos como visitados
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.webTitle}>Pueblos Visitados</Text>
      <Text style={styles.webSubtitle}>
        Has visitado {pueblos.length} {pueblos.length === 1 ? 'pueblo' : 'pueblos'}
      </Text>
      <View style={styles.pueblosList}>
        {pueblos.map((pueblo) => (
          <View key={pueblo.id} style={styles.puebloItem}>
            <Text style={styles.puebloName}>📍 {pueblo.name}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={fetchPueblosVisitados}
      >
        <RefreshCw size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Recargar</Text>
      </TouchableOpacity>
      <Text style={styles.webNote}>
        El mapa interactivo está disponible en la app móvil
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#d60000",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: "#d60000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  reloadButton: {
    position: "absolute",
    right: 16,
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
  counter: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  counterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  pueblosList: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 24,
  },
  puebloItem: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  puebloName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  webNote: {
    marginTop: 24,
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
});
