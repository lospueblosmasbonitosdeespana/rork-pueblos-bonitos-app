import { router } from 'expo-router';
import { ArrowLeft, Award, MapPin, Star, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

interface PuntosData {
  puntos_totales: number;
  nivel: string;
  nivel_siguiente: string;
  total_pueblos: number;
  favoritos: PuebloFavorito[];
}

interface PuebloFavorito {
  pueblo_id: string;
  nombre: string;
  provincia?: string;
  puntos: number;
  estrellas: number;
}

export default function PuntosConseguidosScreen() {
  const { user } = useAuth();
  const [puntosData, setPuntosData] = useState<PuntosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPuntos = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const puntosRes = await fetch(
        `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=${user.id}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!puntosRes.ok) {
        throw new Error('Error al cargar puntos');
      }

      const data = await puntosRes.json();
      console.log('📥 [PUNTOS ENDPOINT] Datos recibidos:', {
        puntos_totales: data.puntos_totales,
        total_pueblos: data.total_pueblos,
        nivel: data.nivel,
        nivel_siguiente: data.nivel_siguiente,
        favoritos_count: data.favoritos?.length || 0
      });
      setPuntosData(data || null);
    } catch (err) {
      console.error('Error fetching puntos:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPuntos();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchPuntos(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchPuntos]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPuntos(true);
  };

  const totalPuntos = puntosData?.puntos_totales || 0;
  const nivel = puntosData?.nivel || 'Sin nivel';
  const nivelSiguiente = puntosData?.nivel_siguiente || 'N/A';
  const totalPueblos = puntosData?.total_pueblos || 0;
  const pueblosFavoritos = puntosData?.favoritos || [];
  const totalEstrellas = pueblosFavoritos.reduce((acc, p) => acc + (Number(p.estrellas) || 0), 0);
  const promedioEstrellas = pueblosFavoritos.length > 0 ? (totalEstrellas / pueblosFavoritos.length).toFixed(1) : '0';
  
  console.log('═══════════════════════════════════════');
  console.log('📊 [PUNTOS CONSEGUIDOS - PANTALLA]');
  console.log('═══════════════════════════════════════');
  console.log(`🏘️  Pueblos visitados: ${totalPueblos}`);
  console.log(`🎯 Puntos totales: ${totalPuntos}`);
  console.log(`⭐ Estrellas totales: ${totalEstrellas}`);
  console.log(`🏆 Nivel actual: ${nivel}`);
  console.log(`🎖️  Siguiente nivel: ${nivelSiguiente}`);
  console.log('═══════════════════════════════════════');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando puntos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Puntos Conseguidos</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPuntos()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={LPBE_RED} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Puntos Conseguidos</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.totalPointsCard}>
          <Award size={48} color={LPBE_RED} strokeWidth={2} />
          <Text style={styles.totalPointsValue}>{totalPuntos}</Text>
          <Text style={styles.totalPointsLabel}>Puntos Totales</Text>
          <View style={styles.nivelContainer}>
            <Text style={styles.nivelActual}>{nivel}</Text>
            <Text style={styles.nivelSiguiente}>Siguiente: {nivelSiguiente}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MapPin size={24} color={LPBE_RED} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{totalPueblos}</Text>
            <Text style={styles.statLabel}>Pueblos</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Star size={24} color="#FFD700" fill="#FFD700" strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{totalEstrellas}</Text>
            <Text style={styles.statLabel}>Estrellas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={24} color="#22c55e" strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{promedioEstrellas}</Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
        </View>
      </View>

      {pueblosFavoritos.length > 0 && (
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Pueblos Favoritos</Text>
          <Text style={styles.listHeaderSubtitle}>Pueblos con 5 estrellas</Text>
        </View>
      )}

      <FlatList
        data={pueblosFavoritos}
        keyExtractor={(item) => item.pueblo_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[LPBE_RED]}
            tintColor={LPBE_RED}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Award size={48} color="#ccc" />
            <Text style={styles.emptyText}>Todavía no tienes pueblos favoritos</Text>
            <Text style={styles.emptySubtext}>
              Dale 5 estrellas a tus pueblos preferidos
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.puntoCard}>
            <View style={styles.puntoHeader}>
              <View style={styles.puntoInfo}>
                <Text style={styles.puebloNombre}>{item.nombre}</Text>
                {item.provincia && (
                  <Text style={styles.puebloLocation}>{item.provincia}</Text>
                )}
              </View>
              <View style={styles.estrellas}>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={20}
                    color="#FFD700"
                    fill="#FFD700"
                    strokeWidth={2}
                  />
                ))}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalPointsCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    marginBottom: 20,
  },
  totalPointsValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: LPBE_RED,
    marginTop: 12,
    marginBottom: 4,
  },
  totalPointsLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  listHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  listHeaderSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  nivelContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  nivelActual: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  nivelSiguiente: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
  puntoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  puntoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puntoInfo: {
    flex: 1,
    marginRight: 12,
  },
  puebloNombre: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  puebloLocation: {
    fontSize: 14,
    color: '#666',
  },
  estrellas: {
    flexDirection: 'row',
    gap: 4,
  },

});
