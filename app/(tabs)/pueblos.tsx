import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Search } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

const API_BASE_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json';

async function fetchImageForPlace(lugarId: string): Promise<string | null> {
  try {
    const url = `${API_BASE_URL}/jet-cct/multimedia?id_lugar=${lugarId}&nocache=${Date.now()}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      
      for (const media of data) {
        const mediaUrl = media.media_url || media.url;
        
        if (mediaUrl && typeof mediaUrl === 'string') {
          const hasValidExtension = imageExtensions.some(ext => 
            mediaUrl.toLowerCase().includes(ext)
          );
          
          if (hasValidExtension) {
            return mediaUrl;
          }
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export default function PueblosScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [lugaresWithImages, setLugaresWithImages] = useState<Lugar[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

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

  console.log('🏘️ Total pueblos cargados:', lugares.length);
  console.log('🏘️ Pueblos asociación (id <= 200):', pueblosAsociacion.length);
  if (pueblosAsociacion.length > 0) {
    console.log('🏘️ Primer pueblo:', pueblosAsociacion[0].nombre, 'ID:', pueblosAsociacion[0]._ID, 'Imagen:', pueblosAsociacion[0].imagen_principal?.substring(0, 50));
  }

  useEffect(() => {
    if (pueblosAsociacion.length > 0 && lugaresWithImages.length === 0) {
      setLoadingImages(true);
      console.log('📸 Iniciando carga de imágenes para', pueblosAsociacion.length, 'pueblos');
      
      const loadImages = async () => {
        const batchSize = 10;
        const updatedLugares: Lugar[] = [];
        
        for (let i = 0; i < pueblosAsociacion.length; i += batchSize) {
          const batch = pueblosAsociacion.slice(i, i + batchSize);
          
          const promises = batch.map(async (lugar) => {
            const imagen = await fetchImageForPlace(lugar._ID);
            return {
              ...lugar,
              imagen_principal: imagen || lugar.imagen_principal,
            };
          });
          
          const results = await Promise.all(promises);
          updatedLugares.push(...results);
          
          setLugaresWithImages([...updatedLugares]);
          
          console.log(`📸 Cargadas ${updatedLugares.length}/${pueblosAsociacion.length} imágenes`);
        }
        
        setLoadingImages(false);
        console.log('✅ Todas las imágenes cargadas');
      };
      
      loadImages();
    }
  }, [pueblosAsociacion.length, lugaresWithImages.length, pueblosAsociacion]);

  const displayLugares = lugaresWithImages.length > 0 ? lugaresWithImages : pueblosAsociacion;
  
  const filteredLugares = searchQuery
    ? displayLugares.filter((lugar) =>
        lugar.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayLugares;

  const renderPueblo = ({ item }: { item: Lugar }) => {
    const imagenUri = item.imagen_principal || 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800';
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => router.push(`/pueblo/${item._ID}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.listItemContent}>
          <Image
            source={{ uri: imagenUri }}
            style={styles.puebloImage}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
          <View style={styles.puebloInfo}>
            <Text style={styles.puebloName}>{item.nombre}</Text>
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
        ListHeaderComponent={
          loadingImages && lugaresWithImages.length > 0 ? (
            <View style={styles.loadingImagesContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingImagesText}>
                Cargando imágenes... {lugaresWithImages.length}/{pueblosAsociacion.length}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          lugaresQuery.isLoading || loadingImages ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                {lugaresQuery.isLoading ? 'Cargando pueblos...' : 'Cargando imágenes...'}
              </Text>
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
    gap: SPACING.md,
  },
  puebloImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.beige,
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
  loadingImagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary + '15',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  loadingImagesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
});
