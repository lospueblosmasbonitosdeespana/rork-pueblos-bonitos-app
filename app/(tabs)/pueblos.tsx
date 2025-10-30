import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
  "andalucia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Andalucia.png",
  "andalucía": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Andalucia.png",

  "aragon": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Bandera_Aragon_escudo.png",

  "principado de asturias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Asturias.png",
  "asturias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Asturias.png",

  "islas baleares": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Balearic_Islands.png",

  "canarias": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Canary_Islands.png",

  "cantabria": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Cantabria.png",

  "castilla y leon": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Castile_and_Leon.png",

  "castilla - la mancha": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Castile-La_Mancha.png",

  "cataluña": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Catalonia.png",
  "cataluna": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Catalonia.png",
  "catalunya": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Catalonia.png",

  "comunidad valenciana": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Valencian_Community.png",
  "valencia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Valencian_Community.png",

  "extremadura": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Extremadura__Spain__with_coat_of_arms_.png",

  "galicia": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_Galicia.png",

  "la rioja": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_La_Rioja.png",

  "comunidad de madrid": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Community_of_Madrid.png",
  "madrid": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Community_of_Madrid.png",

  "navarra": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Bandera_de_Navarra.png",
  "comunidad foral de navarra": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Bandera_de_Navarra.png",

  "pais vasco": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Basque_Country.png",
  "país vasco": "https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/Flag_of_the_Basque_Country.png",
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

export default function PueblosScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const lugaresQuery = useQuery({
    queryKey: ['lugares'],
    queryFn: fetchLugares,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const lugares = lugaresQuery.data || [];

  const pueblosAsociacion = lugares.filter((lugar) => {
    const id = parseInt(lugar._ID, 10);
    return !isNaN(id) && id <= 200;
  });



  const displayLugares = pueblosAsociacion;
  
  const filteredLugares = searchQuery
    ? displayLugares.filter((lugar) =>
        lugar.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayLugares;

  const renderPueblo = ({ item }: { item: Lugar }) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => router.push(`/pueblo/${item._ID}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.listItemContent}>
          <View style={styles.puebloInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.comunidad_autonoma && (() => {
                const key = normalizar(item.comunidad_autonoma);
                console.log('🏴 Comunidad:', item.comunidad_autonoma, '→ Normalizada:', key);
                const bandera = banderas[key];
                return bandera ? (
                  <Image
                    source={{ uri: bandera }}
                    style={{
                      width: 28,
                      height: 18,
                      borderRadius: 2,
                      marginRight: 10,
                    }}
                  />
                ) : null;
              })()}
              <Text style={styles.puebloName}>{item.nombre}</Text>
            </View>
            {item.provincia && (
              <Text style={styles.puebloLocation}>
                {`${item.provincia}${item.comunidad_autonoma ? `, ${item.comunidad_autonoma}` : ''}`}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
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
              <Text style={styles.loadingText}>Cargando pueblos...</Text>
              <Text style={styles.loadingSubtext}>Esto puede tardar unos segundos la primera vez</Text>
            </View>
          ) : lugaresQuery.error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                ❌ Error cargando pueblos: {lugaresQuery.error instanceof Error ? lugaresQuery.error.message : 'Error desconocido'}
              </Text>
              <Text style={styles.errorDetails}>
                Por favor, verifica tu conexión a internet e inténtalo de nuevo.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => lugaresQuery.refetch()}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
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
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  listContent: {
    paddingVertical: SPACING.md,
  },
  listItem: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  puebloInfo: {
    flex: 1,
  },
  puebloName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  puebloLocation: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    color: COLORS.card,
  },
});
