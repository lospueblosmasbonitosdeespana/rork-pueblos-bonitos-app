import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

interface PuebloMapa {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  foto: string;
}

const API_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-mapa';

export default function MapasScreen() {
  const router = useRouter();
  const [pueblos, setPueblos] = useState<PuebloMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPueblos();
  }, []);

  const fetchPueblos = async () => {
    try {
      console.log('📍 Cargando pueblos desde:', API_URL);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${data.length} pueblos cargados`);
      setPueblos(data);
    } catch (err) {
      console.error('❌ Error cargando pueblos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (pueblo: PuebloMapa) => {
    console.log('📍 Abriendo pueblo:', pueblo.nombre);
    router.push(`/pueblo/${pueblo.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se pudo cargar el mapa.{"\n"}Verifica tu conexión a internet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: 40.2,
          longitude: -3.7,
          latitudeDelta: 8,
          longitudeDelta: 8,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {pueblos.map((pueblo) => (
          <Marker
            key={pueblo.id}
            coordinate={{
              latitude: pueblo.lat,
              longitude: pueblo.lng,
            }}
            title={pueblo.nombre}
            onPress={() => handleMarkerPress(pueblo)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
