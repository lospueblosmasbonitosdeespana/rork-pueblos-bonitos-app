import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Check, Edit3, MapPin, Star, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

interface PuebloVisita {
  _ID?: string;
  pueblo_id: string;
  nombre: string;
  provincia?: string;
  comunidad_autonoma?: string;
  imagen_principal?: string;
  fecha_visita?: string;
  estrellas: number;
  tipo: 'auto' | 'manual';
  checked: number;
}

interface PuebloLite {
  ID: string;
  post_title: string;
  provincia?: string;
  imagen_principal?: string;
}

export default function PueblosVisitadosScreen() {
  const { user } = useAuth();
  const [pueblos, setPueblos] = useState<PuebloVisita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPueblosVisitados = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const [visitadosResponse, liteResponse] = await Promise.all([
        fetch(
          `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-visitados?user_id=${user.id}`,
          { headers: { 'Content-Type': 'application/json' } }
        ),
        fetch(
          `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-lite`,
          { headers: { 'Content-Type': 'application/json' } }
        ),
      ]);

      if (!visitadosResponse.ok || !liteResponse.ok) {
        throw new Error('Error al cargar pueblos');
      }

      const visitadosData: PuebloVisita[] = await visitadosResponse.json();
      const liteData: PuebloLite[] = await liteResponse.json();

      const pueblosMap = new Map<string, PuebloVisita>();
      
      visitadosData.forEach((pueblo: PuebloVisita) => {
        const existing = pueblosMap.get(pueblo.pueblo_id);
        if (!existing || (pueblo.fecha_visita && existing.fecha_visita && pueblo.fecha_visita > existing.fecha_visita)) {
          pueblosMap.set(pueblo.pueblo_id, pueblo);
        }
      });

      liteData.forEach((puebloLite: PuebloLite) => {
        if (!pueblosMap.has(puebloLite.ID)) {
          pueblosMap.set(puebloLite.ID, {
            pueblo_id: puebloLite.ID,
            nombre: puebloLite.post_title,
            provincia: puebloLite.provincia,
            imagen_principal: puebloLite.imagen_principal,
            estrellas: 0,
            tipo: 'manual',
            checked: 0,
          });
        }
      });

      const pueblosList = Array.from(pueblosMap.values());
      pueblosList.sort((a, b) => {
        if (a.checked === b.checked) {
          return a.nombre.localeCompare(b.nombre);
        }
        return b.checked - a.checked;
      });

      setPueblos(pueblosList);
    } catch (err) {
      console.error('Error fetching pueblos:', err);
      setError('No se pudieron cargar los pueblos visitados');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPueblosVisitados();
  }, [fetchPueblosVisitados]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        fetchPueblosVisitados(true);
      }
    }, [fetchPueblosVisitados, isLoading])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPueblosVisitados(true);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleToggleVisita = async (pueblo: PuebloVisita) => {
    if (!user?.id) return;

    const newChecked = pueblo.checked === 1 ? 0 : 1;

    try {
      const response = await fetch(
        `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/visita-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            pueblo_id: pueblo.pueblo_id,
            checked: newChecked,
            tipo: 'manual',
            estrellas: pueblo.estrellas,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar visita');
      }

      const result = await response.json();

      if (result.success) {
        setPueblos((prevPueblos) =>
          prevPueblos.map((p) =>
            p.pueblo_id === pueblo.pueblo_id ? { ...p, checked: newChecked } : p
          )
        );
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error toggling visita:', err);
      if (Platform.OS === 'web') {
        alert('Error al actualizar la visita');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la visita');
      }
    }
  };

  const handleChangeStars = async (pueblo: PuebloVisita, newStars: number) => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/visita-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            pueblo_id: pueblo.pueblo_id,
            checked: pueblo.checked,
            tipo: pueblo.tipo,
            estrellas: newStars,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar estrellas');
      }

      const result = await response.json();

      if (result.success) {
        setPueblos((prevPueblos) =>
          prevPueblos.map((p) =>
            p.pueblo_id === pueblo.pueblo_id ? { ...p, estrellas: newStars } : p
          )
        );
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error changing stars:', err);
      if (Platform.OS === 'web') {
        alert('Error al actualizar las estrellas');
      } else {
        Alert.alert('Error', 'No se pudieron actualizar las estrellas');
      }
    }
  };

  const visitados = pueblos.filter(p => p.checked === 1);
  const totalVisitados = visitados.length;
  const pendientes = 122 - totalVisitados;
  const totalPuntos = pueblos.reduce((sum, p) => sum + p.estrellas, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando pueblos visitados...</Text>
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
          <Text style={styles.headerTitle}>Pueblos Visitados</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPueblosVisitados()}>
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
        <Text style={styles.headerTitle}>Pueblos Visitados</Text>
        <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
          {isEditing ? (
            <X size={24} color={LPBE_RED} strokeWidth={2} />
          ) : (
            <Edit3 size={24} color={LPBE_RED} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalVisitados}</Text>
          <Text style={styles.statLabel}>Visitados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{pendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalPuntos}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
      </View>

      <FlatList
        data={pueblos}
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
            <MapPin size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aún no has visitado ningún pueblo</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const bgColor = item.checked === 1
            ? item.tipo === 'auto'
              ? '#dcfce7'
              : '#dbeafe'
            : '#ffffff';

          return (
            <View style={[styles.puebloCard, { backgroundColor: bgColor }]}>
              {item.imagen_principal && (
                <Image
                  source={{ uri: item.imagen_principal }}
                  style={styles.puebloImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.puebloContent}>
                <View style={styles.puebloHeader}>
                  {item.checked === 1 && (
                    <View
                      style={[
                        styles.tipoBadge,
                        item.tipo === 'auto'
                          ? styles.tipoGeolocal
                          : styles.tipoManualBadge,
                      ]}
                    >
                      <Text style={styles.tipoBadgeText}>
                        {item.tipo === 'auto' ? 'Geolocalizado' : 'Manual'}
                      </Text>
                    </View>
                  )}
                  {isEditing && (
                    <TouchableOpacity
                      style={[
                        styles.visitadoButton,
                        item.checked === 1 && styles.visitadoButtonActive,
                      ]}
                      onPress={() => handleToggleVisita(item)}
                    >
                      {item.checked === 1 ? (
                        <Check size={18} color="#fff" strokeWidth={3} />
                      ) : (
                        <Text style={styles.visitadoButtonText}>Marcar</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.puebloInfo}>
                  <Text style={styles.puebloNombre}>{item.nombre}</Text>
                  {item.provincia && (
                    <Text style={styles.puebloLocation}>{item.provincia}</Text>
                  )}
                </View>

                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => isEditing && handleChangeStars(item, star)}
                      disabled={!isEditing}
                    >
                      <Star
                        size={24}
                        color={star <= item.estrellas ? '#FFD700' : '#ddd'}
                        fill={star <= item.estrellas ? '#FFD700' : 'transparent'}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {item.fecha_visita && (
                  <Text style={styles.fechaVisita}>
                    Visitado: {new Date(item.fecha_visita).toLocaleDateString('es-ES')}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
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
  editButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: LPBE_RED,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
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
  puebloCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  puebloImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  puebloContent: {
    padding: 16,
  },
  puebloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  puebloInfo: {
    marginBottom: 12,
  },
  puebloNombre: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  puebloLocation: {
    fontSize: 14,
    color: '#666',
  },
  visitadoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitadoButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  visitadoButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600' as const,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fechaVisita: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  tipoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tipoGeolocal: {
    backgroundColor: '#dcfce7',
  },
  tipoManualBadge: {
    backgroundColor: '#dbeafe',
  },
  tipoBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
});
