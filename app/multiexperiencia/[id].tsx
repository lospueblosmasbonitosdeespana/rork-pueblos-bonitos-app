import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface MultiexperienciaDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  foto: string;
  multimedia: string[];
  latitud: string;
  longitud: string;
}

async function fetchMultiexperienciaDetalle(id: string): Promise<MultiexperienciaDetalle> {
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/multiexperiencia-detalle?id=${id}`;
  console.log('🌐 Fetching multiexperiencia detalle:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error('❌ Error response:', await response.json());
    throw new Error(`Error ${response.status}: No se pudo cargar el detalle de la experiencia`);
  }
  
  const data = await response.json();
  console.log('✅ Multiexperiencia detalle loaded:', data);
  return data;
}

export default function MultiexperienciaDetailScreen() {
  const { id } = useLocalSearchParams();
  const experienciaId = Array.isArray(id) ? id[0] : id;
  
  console.log('🆔 MultiexperienciaDetailScreen id:', experienciaId);

  const experienciaQuery = useQuery({
    queryKey: ['multiexperiencia-detalle', experienciaId],
    queryFn: () => fetchMultiexperienciaDetalle(experienciaId),
    enabled: !!experienciaId,
  });

  const experiencia = experienciaQuery.data;

  if (experienciaQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Cargando...',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={COLORS.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (experienciaQuery.error || !experiencia) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Error',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={COLORS.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar la información de esta experiencia.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const allImages = [
    ...(experiencia.foto ? [experiencia.foto] : []),
    ...(experiencia.multimedia || []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: experiencia.nombre,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>{experiencia.nombre}</Text>

        {allImages.length > 0 && (
          <View style={styles.gallery}>
            {allImages.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.galleryImage}
                contentFit="cover"
              />
            ))}
          </View>
        )}

        <View style={styles.mapContainer}>
          <Text style={styles.mapLabel}>Mapa</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Mapa disponible en la web</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  gallery: {
    width: width,
  },
  galleryImage: {
    width: width,
    height: 250,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: SPACING.md,
  },
  mapPlaceholder: {
    backgroundColor: '#F5F5F5',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
