import { MapPin, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

interface PuebloVisita {
  _ID: string;
  pueblo_id: string;
  nombre: string;
  provincia?: string;
  comunidad_autonoma?: string;
  imagen_principal?: string;
  fecha_visita?: string;
  estrellas: number;
  tipo: 'auto' | 'manual';
  checked: number;
  puntos: number;
}

interface EditChanges {
  [pueblo_id: string]: {
    checked: number;
    tipo: 'auto' | 'manual';
    estrellas: number;
    originalChecked?: number;
  };
}

interface PuntosData {
  puntos_totales: number;
  total_pueblos: number;
  nivel: string;
  nivel_siguiente: string;
}

export default function PueblosVisitadosScreen() {
  const { user } = useAuth();
  const [pueblos, setPueblos] = useState<PuebloVisita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editChanges, setEditChanges] = useState<EditChanges>({});
  const [originalState, setOriginalState] = useState<Map<string, PuebloVisita>>(new Map());
  const [puntosData, setPuntosData] = useState<PuntosData | null>(null);

  const fetchPueblosVisitados = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const puntosRes = await fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=${user.id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (puntosRes.ok) {
        const puntosDataFromAPI = await puntosRes.json();
        setPuntosData(puntosDataFromAPI);
        console.log('🎯 [PUEBLOS VISITADOS] Datos de puntos actualizados:', puntosDataFromAPI);
      }

      const [visitadosRes, liteRes, puntosLugaresRes] = await Promise.all([
        fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-visitados?user_id=${user.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-lite`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/lugar`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (!visitadosRes.ok || !liteRes.ok || !puntosLugaresRes.ok) {
        throw new Error('Error al cargar pueblos visitados');
      }

      const visitadosData = await visitadosRes.json();
      const liteData = await liteRes.json();
      const puntosLugaresData = await puntosLugaresRes.json();
      
      const puntosMap = new Map<string, number>();
      if (Array.isArray(puntosLugaresData)) {
        puntosLugaresData.forEach((lugar: any) => {
          if (lugar._ID && lugar.puntos) {
            puntosMap.set(String(lugar._ID), Number(lugar.puntos) || 0);
          }
        });
      }
      
      const pueblosMap = new Map<string, PuebloVisita>();
      
      visitadosData.forEach((pueblo: PuebloVisita) => {
        const puebloId = parseInt(pueblo.pueblo_id);
        if (puebloId <= 200) {
          const puntosDelPueblo = puntosMap.get(pueblo.pueblo_id) || 0;
          const puebloConPuntos = { ...pueblo, puntos: puntosDelPueblo };
          
          const existing = pueblosMap.get(pueblo.pueblo_id);
          if (!existing) {
            pueblosMap.set(pueblo.pueblo_id, puebloConPuntos);
          } else {
            const existingDate = existing.fecha_visita ? new Date(existing.fecha_visita).getTime() : 0;
            const currentDate = pueblo.fecha_visita ? new Date(pueblo.fecha_visita).getTime() : 0;
            
            if (currentDate > existingDate) {
              pueblosMap.set(pueblo.pueblo_id, puebloConPuntos);
            } else if (currentDate === existingDate && pueblo.tipo === 'manual' && existing.tipo === 'auto') {
              pueblosMap.set(pueblo.pueblo_id, puebloConPuntos);
            }
          }
        }
      });
      
      liteData.forEach((pueblo: any) => {
        const puebloId = parseInt(pueblo.id);
        if (puebloId <= 200 && !pueblosMap.has(pueblo.id?.toString())) {
          const puntosDelPueblo = puntosMap.get(pueblo.id?.toString()) || 0;
          pueblosMap.set(pueblo.id?.toString(), {
            _ID: pueblo.id?.toString() || '',
            pueblo_id: pueblo.id?.toString() || '',
            nombre: pueblo.nombre || '',
            provincia: pueblo.provincia || '',
            comunidad_autonoma: pueblo.comunidad_autonoma || '',
            imagen_principal: pueblo.imagen_principal || '',
            estrellas: 0,
            tipo: 'manual',
            checked: 0,
            puntos: puntosDelPueblo,
          });
        }
      });
      
      const pueblosList = Array.from(pueblosMap.values());
      
      const listaSinDuplicados = Object.values(
        pueblosList.reduce((acc: { [key: string]: PuebloVisita }, item) => {
          const key = item.pueblo_id || item._ID;
          if (!acc[key]) acc[key] = item;
          return acc;
        }, {})
      );
      
      const sorted = listaSinDuplicados.sort((a, b) => {
        if (a.checked !== b.checked) {
          return b.checked - a.checked;
        }
        const nameA = a.nombre || '';
        const nameB = b.nombre || '';
        return nameA.localeCompare(nameB);
      });
      
      setPueblos(sorted);
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

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchPueblosVisitados(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchPueblosVisitados]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPueblosVisitados(true);
  };

  const toggleEditMode = async () => {
    if (isEditing) {
      await saveChanges();
    } else {
      setIsEditing(true);
      setEditChanges({});
      const original = new Map<string, PuebloVisita>();
      pueblos.forEach(p => original.set(p.pueblo_id, { ...p }));
      setOriginalState(original);
    }
  };

  const saveChanges = async () => {
    if (!user?.id || Object.keys(editChanges).length === 0) {
      setIsEditing(false);
      setEditChanges({});
      return;
    }

    setIsSaving(true);
    try {
      const modifiedEntries = Object.entries(editChanges).filter(([pueblo_id, changes]) => {
        const original = originalState.get(pueblo_id);
        if (!original) return true;
        return original.checked !== changes.checked || original.estrellas !== changes.estrellas;
      });

      if (modifiedEntries.length === 0) {
        setIsEditing(false);
        setEditChanges({});
        return;
      }

      const promises = modifiedEntries.map(([pueblo_id, changes]) => 
        fetch('https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/visita-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            pueblo_id,
            checked: changes.checked,
            tipo: 'manual',
            estrellas: changes.estrellas,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        await fetchPueblosVisitados(true);
        
        try {
          const puntosRes = await fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=${user.id}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (puntosRes.ok) {
            const puntosData = await puntosRes.json();
            console.log('═══════════════════════════════════════');
            console.log('✅ [SINCRONIZACIÓN POST-GUARDADO]');
            console.log('═══════════════════════════════════════');
            console.log('📥 Datos del endpoint /lpbe/v1/puntos:');
            console.log(`  🎯 Puntos totales: ${puntosData.puntos_totales}`);
            console.log(`  🏘️  Total pueblos: ${puntosData.total_pueblos}`);
            console.log(`  🏆 Nivel: ${puntosData.nivel}`);
            console.log(`  🎖️  Siguiente: ${puntosData.nivel_siguiente}`);
            console.log('═══════════════════════════════════════');
          }
        } catch (err) {
          console.warn('⚠️  Error al sincronizar puntos:', err);
        }
        
        if (Platform.OS === 'web') {
          alert('Cambios guardados con éxito');
        } else {
          Alert.alert('Éxito', 'Cambios guardados con éxito');
        }
      } else {
        throw new Error('Error al guardar algunos cambios');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      if (Platform.OS === 'web') {
        alert('Error al guardar los cambios');
      } else {
        Alert.alert('Error', 'No se pudieron guardar todos los cambios');
      }
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      setEditChanges({});
    }
  };

  const handleToggleVisita = (pueblo: PuebloVisita) => {
    if (!user?.id || pueblo.tipo === 'auto') return;

    const newChecked = pueblo.checked === 1 ? 0 : 1;
    
    setEditChanges(prev => ({
      ...prev,
      [pueblo.pueblo_id]: {
        checked: newChecked,
        tipo: 'manual',
        estrellas: editChanges[pueblo.pueblo_id]?.estrellas ?? pueblo.estrellas,
      },
    }));

    setPueblos(prevPueblos =>
      prevPueblos.map(p =>
        p.pueblo_id === pueblo.pueblo_id ? { ...p, checked: newChecked } : p
      )
    );
  };

  const handleChangeStars = (pueblo: PuebloVisita, newStars: number) => {
    if (!user?.id) return;

    const currentChanges = editChanges[pueblo.pueblo_id];
    setEditChanges(prev => ({
      ...prev,
      [pueblo.pueblo_id]: {
        checked: currentChanges?.checked ?? pueblo.checked,
        tipo: currentChanges?.tipo ?? pueblo.tipo,
        estrellas: newStars,
      },
    }));

    setPueblos(prevPueblos =>
      prevPueblos.map(p =>
        p.pueblo_id === pueblo.pueblo_id ? { ...p, estrellas: newStars } : p
      )
    );
  };

  const visitados = pueblos.filter(p => p.checked === 1);
  const geolocalizados = visitados.filter(p => p.tipo === 'auto').length;
  const manuales = visitados.filter(p => p.tipo === 'manual').length;
  
  const totalVisitados = puntosData?.total_pueblos || visitados.length;
  
  console.log('═══════════════════════════════════════');
  console.log('📊 [PUEBLOS VISITADOS - SINCRONIZADO]');
  console.log('═══════════════════════════════════════');
  console.log(`🏘️  Total pueblos visitados (del endpoint): ${totalVisitados}`);
  console.log(`📍 Geolocalizados (lista local): ${geolocalizados}`);
  console.log(`✍️  Manuales (lista local): ${manuales}`);
  console.log('═══════════════════════════════════════');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando pueblos visitados...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPueblosVisitados()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalVisitados}</Text>
          <Text style={styles.statLabel}>Visitados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{geolocalizados}</Text>
          <Text style={styles.statLabel}>Geolocalizados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{manuales}</Text>
          <Text style={styles.statLabel}>Manuales</Text>
        </View>
      </View>

      <FlatList
        data={pueblos}
        keyExtractor={(item, index) => String(item.pueblo_id || item._ID || index)}
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
          const cardStyle = item.checked === 1 
            ? (item.tipo === 'auto' ? styles.puebloGeolocal : styles.puebloManual)
            : styles.puebloPendiente;
          
          const canToggle = item.tipo !== 'auto';
          
          return (
            <View style={[styles.puebloCard, cardStyle, isEditing && styles.puebloCardEditing]}>
              {item.imagen_principal && (
                <Image
                  source={{ uri: item.imagen_principal }}
                  style={styles.puebloImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.puebloContent}>
                <View style={styles.puebloHeader}>
                  <View style={styles.badgeContainer}>
                    {item.tipo === 'auto' && (
                      <View style={[styles.tipoBadge, styles.tipoGeolocal]}>
                        <Text style={styles.tipoBadgeText}>Geolocalizado</Text>
                      </View>
                    )}
                  </View>
                  {isEditing && canToggle && (
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        item.checked === 1 ? styles.toggleButtonBorrar : styles.toggleButtonVisitado,
                      ]}
                      onPress={() => handleToggleVisita(item)}
                    >
                      <Text style={[
                        styles.toggleButtonText,
                        item.checked === 1 ? styles.toggleButtonTextBorrar : styles.toggleButtonTextVisitado,
                      ]}>
                        {item.checked === 1 ? 'Borrar' : 'Visitado'}
                      </Text>
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
                      style={{ marginRight: 8 }}
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
    </View>
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

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
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
    backgroundColor: '#fff',
  },
  puebloCardEditing: {
    borderWidth: 2,
    borderColor: LPBE_RED,
    borderStyle: 'dashed' as const,
  },
  puebloPendiente: {
    backgroundColor: '#f5f5f5',
  },
  puebloManual: {
    backgroundColor: '#d1fae5',
  },
  puebloGeolocal: {
    backgroundColor: '#dbeafe',
  },
  puebloImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  puebloContent: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  puebloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
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
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  toggleButtonVisitado: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  toggleButtonBorrar: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  toggleButtonTextVisitado: {
    color: '#fff',
  },
  toggleButtonTextBorrar: {
    color: '#fff',
  },
  starsContainer: {
    flexDirection: 'row',
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipoManualBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  tipoBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#333',
  },
});
