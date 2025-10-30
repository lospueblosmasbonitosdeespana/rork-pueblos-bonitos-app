import { router } from 'expo-router';
import { ArrowLeft, Award, MapPin, Star, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

interface PuntoDetalle {
  _ID: string;
  pueblo_nombre: string;
  provincia?: string;
  estrellas: number;
  puntos: number;
  fecha_visita?: string;
  tipo: 'visita' | 'manual' | 'qr';
}

export default function PuntosConseguidosScreen() {
  const { user } = useAuth();
  const [puntos, setPuntos] = useState<PuntoDetalle[]>([]);
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

      const response = await fetch(
        `${API_BASE_URL}/jet-cct/visita?user_id=${user.id}&completado=true&per_page=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar puntos');
      }

      const data = await response.json();
      
      const puntosData: PuntoDetalle[] = data.map((item: any) => ({
        _ID: item._ID,
        pueblo_nombre: item.nombre_pueblo,
        provincia: item.provincia,
        estrellas: item.estrellas || 0,
        puntos: (item.estrellas || 0) * 10,
        fecha_visita: item.fecha_visita,
        tipo: item.manual ? 'manual' : item.via_qr ? 'qr' : 'visita',
      }));

      setPuntos(puntosData);
    } catch (err) {
      console.error('Error fetching puntos:', err);
      setError('No se pudieron cargar los puntos');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPuntos();
  }, [fetchPuntos]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPuntos(true);
  };

  const totalPuntos = puntos.reduce((sum, p) => sum + p.puntos, 0);
  const totalEstrellas = puntos.reduce((sum, p) => sum + p.estrellas, 0);
  const totalPueblos = puntos.length;

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
            <Text style={styles.statValue}>
              {totalPueblos > 0 ? (totalEstrellas / totalPueblos).toFixed(1) : '0'}
            </Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Detalle de Puntos</Text>
      </View>

      <FlatList
        data={puntos}
        keyExtractor={(item) => item._ID}
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
            <Text style={styles.emptyText}>No tienes puntos acumulados todavía</Text>
            <Text style={styles.emptySubtext}>
              Visita pueblos y gana estrellas para acumular puntos
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.puntoCard}>
            <View style={styles.puntoHeader}>
              <View style={styles.puntoInfo}>
                <Text style={styles.puebloNombre}>{item.pueblo_nombre}</Text>
                {item.provincia && (
                  <Text style={styles.puebloLocation}>{item.provincia}</Text>
                )}
              </View>
              <View style={styles.puntosBox}>
                <Text style={styles.puntosValue}>+{item.puntos}</Text>
                <Text style={styles.puntosLabel}>pts</Text>
              </View>
            </View>

            <View style={styles.estrellas}>
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={18}
                  color={index < item.estrellas ? '#FFD700' : '#ddd'}
                  fill={index < item.estrellas ? '#FFD700' : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </View>

            {item.fecha_visita && (
              <Text style={styles.fecha}>
                {new Date(item.fecha_visita).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}

            <View style={styles.tipoBadge}>
              <Text style={styles.tipoBadgeText}>
                {item.tipo === 'manual' ? 'Manual' : item.tipo === 'qr' ? 'QR' : 'Visita'}
              </Text>
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
    padding: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  puntoInfo: {
    flex: 1,
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
  puntosBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginLeft: 12,
  },
  puntosValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: LPBE_RED,
  },
  puntosLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600' as const,
  },
  estrellas: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  tipoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tipoBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600' as const,
  },
});
