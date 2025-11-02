import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';
const BLUE_VISITED = '#3b82f6';
const GRAY_NOT_VISITED = '#d1d5db';
const SPAIN_CENTER = { latitude: 40.2, longitude: -3.7 };
const CACHE_KEY = 'pueblos_mapa_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface PuebloMapa {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  foto: string;
}

interface CachedData {
  pueblos: PuebloMapa[];
  timestamp: number;
}

export default function MapaPueblosVisitadosScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pueblos, setPueblos] = useState<PuebloMapa[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const loadCachedData = useCallback(async (): Promise<PuebloMapa[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp < CACHE_EXPIRY) {
        console.log('📦 Usando datos cacheados del mapa');
        return data.pueblos;
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando cache:', error);
      return null;
    }
  }, []);

  const saveCachedData = useCallback(async (pueblos: PuebloMapa[]) => {
    try {
      const data: CachedData = {
        pueblos,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log('💾 Datos del mapa guardados en cache');
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }, []);

  const fetchMapData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cachedPueblos = await loadCachedData();
      if (cachedPueblos) {
        setPueblos(cachedPueblos);
      }

      const [pueblosRes, visitadosRes] = await Promise.all([
        fetch('https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-mapa'),
        user?.id
          ? fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-visitados?user_id=${user.id}`)
          : Promise.resolve(null),
      ]);

      if (!pueblosRes.ok) {
        throw new Error('Error al cargar datos del mapa');
      }

      const pueblosData: PuebloMapa[] = await pueblosRes.json();
      setPueblos(pueblosData);
      await saveCachedData(pueblosData);

      if (visitadosRes && visitadosRes.ok) {
        const visitadosData = await visitadosRes.json();
        const visitedSet = new Set<number>();
        visitadosData.forEach((visita: any) => {
          if (visita.checked === 1) {
            const puebloId = parseInt(visita.pueblo_id);
            if (!isNaN(puebloId)) {
              visitedSet.add(puebloId);
            }
          }
        });
        setVisitedIds(visitedSet);
        console.log('✅ Pueblos visitados cargados:', visitedSet.size);
      }
    } catch (error) {
      console.error('❌ Error cargando mapa:', error);
      const cachedPueblos = await loadCachedData();
      if (cachedPueblos) {
        setPueblos(cachedPueblos);
        setError(null);
      } else {
        setError('Mapa no disponible temporalmente');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadCachedData, saveCachedData]);

  useEffect(() => {
    if (!authLoading) {
      fetchMapData();
    }
  }, [authLoading, fetchMapData]);

  const centerOnUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitas activar los permisos de ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          },
          1000
        );
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    }
  }, []);

  const handleMarkerPress = useCallback((pueblo: PuebloMapa) => {
    console.log('🗺️ Marcador presionado:', pueblo.nombre);
  }, []);

  const handleCalloutPress = useCallback((pueblo: PuebloMapa) => {
    console.log('📍 Abriendo ficha del pueblo:', pueblo.id);
    router.push(`/pueblo/${pueblo.id}`);
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.notLoggedText}>Inicia sesión para ver tu mapa de pueblos visitados</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMapData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...SPAIN_CENTER,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {pueblos.map((pueblo) => {
          const isVisited = visitedIds.has(pueblo.id);
          return (
            <Marker
              key={pueblo.id}
              coordinate={{ latitude: pueblo.lat, longitude: pueblo.lng }}
              pinColor={isVisited ? BLUE_VISITED : GRAY_NOT_VISITED}
              onPress={() => handleMarkerPress(pueblo)}
            >
              <Callout onPress={() => handleCalloutPress(pueblo)}>
                <View style={styles.calloutContainer}>
                  {pueblo.foto ? (
                    <Image source={{ uri: pueblo.foto }} style={styles.calloutImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.calloutImagePlaceholder}>
                      <MapPin size={24} color="#999" />
                    </View>
                  )}
                  <Text style={styles.calloutTitle}>{pueblo.nombre}</Text>
                  <Text style={styles.calloutSubtitle}>{isVisited ? 'Visitado' : 'No visitado'}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUserLocation}>
        <Navigation size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  notLoggedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  locationButton: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    backgroundColor: LPBE_RED,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});
