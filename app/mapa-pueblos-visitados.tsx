import { router } from 'expo-router';
import { ArrowLeft, Flag } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth';
import { fetchLugaresStable } from '@/services/api';
import { Lugar } from '@/types/api';
import { API_BASE_URL } from '@/constants/api';

let MapView: any;
let Marker: any;
let Callout: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

const LPBE_RED = '#c1121f';

interface PuebloConVisita extends Lugar {
  visitado: boolean;
}

export default function MapaPueblosVisitadosScreen() {
  const { userId, isAuthenticated } = useAuth();
  const [pueblos, setPueblos] = useState<PuebloConVisita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPueblosConVisitas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗺️ Cargando pueblos...');
      const todosPueblos = await fetchLugaresStable();
      console.log('✅ Pueblos cargados:', todosPueblos.length);

      let visitasIds = new Set<string>();

      if (isAuthenticated && userId) {
        console.log('🔍 Cargando visitas para usuario:', userId);
        try {
          const visitasResponse = await fetch(
            `${API_BASE_URL}/jet-cct/visita?user_id=${userId}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (visitasResponse.ok) {
            const visitasData = await visitasResponse.json();
            console.log('📦 Visitas data:', visitasData);
            
            if (Array.isArray(visitasData)) {
              visitasIds = new Set(
                visitasData.map((v: any) => String(v.id_lugar || v.pueblo || v._ID)).filter(Boolean)
              );
              console.log('✅ Visitas encontradas:', visitasIds.size);
            }
          } else {
            console.warn('⚠️ No se pudieron cargar las visitas');
          }
        } catch (error: any) {
          console.warn('⚠️ Error cargando visitas:', error.message);
        }
      }

      const pueblosConVisitas: PuebloConVisita[] = todosPueblos
        .filter(p => p.latitud && p.longitud && p.latitud !== 0 && p.longitud !== 0)
        .map(pueblo => ({
          ...pueblo,
          visitado: visitasIds.has(pueblo._ID),
        }));

      console.log('✅ Pueblos con coordenadas:', pueblosConVisitas.length);
      console.log('✅ Pueblos visitados:', pueblosConVisitas.filter(p => p.visitado).length);

      setPueblos(pueblosConVisitas);
    } catch (error: any) {
      console.error('❌ Error cargando mapa:', error);
      setError(error.message || 'Error al cargar el mapa');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {    
    loadPueblosConVisitas();
  }, [loadPueblosConVisitas]);

  const handleMarkerPress = (puebloId: string) => {
    console.log('📍 Marcador pulsado:', puebloId);
    router.push(`/pueblo/${puebloId}`);
  };

  const initialRegion = {
    latitude: 40.4637,
    longitude: -3.7492,
    latitudeDelta: 10,
    longitudeDelta: 10,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Pueblos Visitados</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPueblosConVisitas}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.webMapContainer}>
          <View style={styles.webMapPlaceholder}>
            <Flag size={48} color={LPBE_RED} strokeWidth={2} />
            <Text style={styles.webMapTitle}>Mapa de Pueblos</Text>
            <Text style={styles.webMapText}>
              Esta función está disponible en la app móvil.
            </Text>
            <Text style={styles.webMapSubtext}>
              Descarga la app para ver el mapa interactivo de todos los pueblos visitados.
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pueblos.length}</Text>
                <Text style={styles.statLabel}>Pueblos totales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pueblos.filter(p => p.visitado).length}</Text>
                <Text style={styles.statLabel}>Visitados</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {pueblos.map((pueblo) => (
            <Marker
              key={pueblo._ID}
              coordinate={{
                latitude: pueblo.latitud,
                longitude: pueblo.longitud,
              }}
              pinColor={pueblo.visitado ? LPBE_RED : '#d4a373'}
              onPress={() => handleMarkerPress(pueblo._ID)}
            >
              {pueblo.visitado && (
                <View style={styles.flagMarker}>
                  <Flag size={24} color="#fff" fill={LPBE_RED} strokeWidth={2} />
                </View>
              )}
              <Callout onPress={() => handleMarkerPress(pueblo._ID)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{pueblo.nombre}</Text>
                  <Text style={styles.calloutSubtitle}>{pueblo.provincia}</Text>
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>Ver pueblo</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  map: {
    flex: 1,
  },
  flagMarker: {
    backgroundColor: LPBE_RED,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  callout: {
    padding: 12,
    minWidth: 200,
    gap: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  calloutButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webMapPlaceholder: {
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: LPBE_RED,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
