import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ChevronDown, Crosshair, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';
import { fetchLugares } from '@/services/api';
import { Lugar } from '@/types/api';

const banderas: Record<string, string> = {
  "andalucia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Andalucia.png",
  "andalucía": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Andalucia.png",

  "aragon": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Bandera_Aragon_escudo.png",

  "principado de asturias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Asturias.png",
  "asturias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Asturias.png",
  "asturias ": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Asturias.png",

  "islas baleares": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Balearic_Islands.png",

  "canarias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Canary_Islands.png",

  "cantabria": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Cantabria.png",

  "castilla y leon": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Castile_and_Leon.png",

  "castilla - la mancha": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Castile-La_Mancha.png",

  "cataluña": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Catalonia.png",
  "cataluna": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Catalonia.png",
  "catalunya": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Catalonia.png",

  "comunidad valenciana": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Valencian_Community.png",
  "valencia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Valencian_Community.png",

  "extremadura": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Extremadura__Spain__with_coat_of_arms_.png",

  "galicia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_Galicia.png",

  "la rioja": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_La_Rioja.png",

  "comunidad de madrid": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Community_of_Madrid.png",
  "madrid": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Community_of_Madrid.png",

  "navarra": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Bandera_de_Navarra.png",
  "comunidad foral de navarra": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Bandera_de_Navarra.png",

  "pais vasco": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Basque_Country.png",
  "país vasco": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Basque_Country.png",
  "murcia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Region_of_Murcia.png",
  "region de murcia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/11/Flag_of_the_Region_of_Murcia.png",
};

const normalizar = (nombre = "") =>
  nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[().,]/g, "")
    .replace("principado de ", "")
    .replace("comunidad de ", "")
    .replace("comunidad autonoma de ", "")
    .replace("comunidad foral de ", "")
    .replace("region de ", "")
    .replace("generalitat de ", "")
    .trim();

const COMUNIDADES_MAP: Record<string, string> = {
  'Todas': 'Todas',
  'Andalucía': 'andalucia',
  'Aragón': 'aragon',
  'Asturias': 'asturias',
  'Baleares': 'islas baleares',
  'Canarias': 'canarias',
  'Cantabria': 'cantabria',
  'Castilla-La Mancha': 'castilla - la mancha',
  'Castilla y León': 'castilla y leon',
  'Cataluña': 'cataluna',
  'Comunidad Valenciana': 'comunidad valenciana',
  'Extremadura': 'extremadura',
  'Galicia': 'galicia',
  'La Rioja': 'la rioja',
  'Madrid': 'madrid',
  'Murcia': 'murcia',
  'Navarra': 'navarra',
  'País Vasco': 'pais vasco',
};

const COMUNIDADES = Object.keys(COMUNIDADES_MAP);

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PueblosScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComunidad, setSelectedComunidad] = useState<string>('Todas');
  const [showNearby, setShowNearby] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showComunidadModal, setShowComunidadModal] = useState<boolean>(false);

  const lugaresQuery = useQuery({
    queryKey: ['lugares'],
    queryFn: fetchLugares,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const lugares = lugaresQuery.data || [];

  const pueblosAsociacion = lugares.filter((lugar) => {
    const id = parseInt(lugar._ID, 10);
    return !isNaN(id) && id <= 200;
  });



  let displayLugares = pueblosAsociacion;

  displayLugares = useMemo(() => {
    let filtered = pueblosAsociacion;

    if (selectedComunidad !== 'Todas') {
      const selectedKey = COMUNIDADES_MAP[selectedComunidad];
      filtered = filtered.filter((lugar) => {
        const key = normalizar(lugar.comunidad);
        return key === selectedKey;
      });
    }

    if (showNearby && userLocation) {
      const withDistances = filtered
        .map((lugar) => ({
          ...lugar,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            lugar.lat,
            lugar.lng
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
      return withDistances;
    }

    return filtered;
  }, [pueblosAsociacion, selectedComunidad, showNearby, userLocation]);
  
  const filteredLugares = searchQuery
    ? displayLugares.filter((lugar) =>
        normalizar(lugar.nombre || '').includes(normalizar(searchQuery))
      )
    : displayLugares;

  const handleLocationPress = async () => {
    try {
      if (showNearby) {
        setShowNearby(false);
        setUserLocation(null);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Ubicación requerida',
          'Activa la ubicación para ver los pueblos más cercanos.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setShowNearby(true);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Error',
        'No se pudo obtener tu ubicación. Por favor, inténtalo de nuevo.'
      );
    }
  };

  const renderPueblo = ({ item }: { item: Lugar }) => {
    const banderaUrl = item.bandera || (item.comunidad ? banderas[normalizar(item.comunidad)] : null);
    
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: COLORS.card, borderBottomColor: COLORS.border }]}
        onPress={() => router.push(`/pueblo/${item._ID}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.listItemContent}>
          {banderaUrl ? (
            <Image
              source={{ uri: banderaUrl }}
              style={styles.banderaImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.banderaPlaceholder} />
          )}
          <View style={styles.puebloInfo}>
            <Text style={[styles.puebloName, { color: COLORS.text }]}>{item.nombre}</Text>
            {item.provincia && (
              <Text style={[styles.puebloLocation, { color: COLORS.textSecondary }]}>
                {item.provincia}{item.comunidad ? `, ${item.comunidad}` : ''}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <Modal
        visible={showComunidadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComunidadModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowComunidadModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]}>Selecciona una comunidad</Text>
            </View>
            <ScrollView style={styles.modalScroll}>
              {COMUNIDADES.map((comunidad, index) => (
                <TouchableOpacity
                  key={`comunidad-${index}-${comunidad}`}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: COLORS.border },
                    selectedComunidad === comunidad && { backgroundColor: COLORS.background },
                  ]}
                  onPress={() => {
                    setSelectedComunidad(comunidad);
                    setShowComunidadModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: COLORS.text },
                      selectedComunidad === comunidad && { fontWeight: '600', color: COLORS.primary },
                    ]}
                  >
                    {comunidad}
                  </Text>
                  {selectedComunidad === comunidad && (
                    <View style={[styles.checkmark, { backgroundColor: COLORS.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.searchContainer, { backgroundColor: COLORS.card }]}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: COLORS.background }]}
            onPress={() => setShowComunidadModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerButtonText, { color: COLORS.text }]}>{selectedComunidad}</Text>
            <ChevronDown size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.locationButton,
              { backgroundColor: COLORS.background },
              showNearby && { backgroundColor: COLORS.primary },
            ]}
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <Crosshair
              size={20}
              color={showNearby ? COLORS.card : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBox, { backgroundColor: COLORS.background }]}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.text }]}
            placeholder={t.explore.searchPlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredLugares}
        renderItem={renderPueblo}
        keyExtractor={(item, index) => `lugar-${item._ID}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={null}
        ListEmptyComponent={
          lugaresQuery.isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: COLORS.text }]}>Cargando pueblos...</Text>
              <Text style={[styles.loadingSubtext, { color: COLORS.textSecondary }]}>Esto puede tardar unos segundos la primera vez</Text>
            </View>
          ) : lugaresQuery.error ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                ❌ Error cargando pueblos: {lugaresQuery.error instanceof Error ? lugaresQuery.error.message : 'Error desconocido'}
              </Text>
              <Text style={[styles.errorDetails, { color: COLORS.textSecondary }]}>
                Por favor, verifica tu conexión a internet e inténtalo de nuevo.
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
                onPress={() => lugaresQuery.refetch()}
              >
                <Text style={[styles.retryButtonText, { color: COLORS.card }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                {searchQuery ? 'No se encontraron pueblos con ese nombre' : 'No hay pueblos disponibles'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  pickerButtonText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    ...SHADOWS.medium,
  },
  modalHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    ...TYPOGRAPHY.body,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
  },
  listContent: {
    paddingVertical: SPACING.md,
  },
  listItem: {
    borderBottomWidth: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  banderaImage: {
    width: 60,
    height: 40,
    borderRadius: 4,
  },
  banderaPlaceholder: {
    width: 60,
    height: 40,
  },
  puebloInfo: {
    flex: 1,
  },
  puebloName: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  puebloLocation: {
    ...TYPOGRAPHY.caption,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  errorDetails: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
  },
});
