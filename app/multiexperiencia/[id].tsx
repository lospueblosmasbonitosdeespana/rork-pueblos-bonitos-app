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
  console.log('🌐 Fetching multiexperiencia detalle from:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Error response:', errorData);
    throw new Error(`Error ${response.status}: No se pudo cargar el detalle de la experiencia`);
  }
  
  const data = await response.json();
  console.log('✅ Multiexperiencia detalle loaded successfully');
  console.log('📊 DATA COMPLETO:', JSON.stringify(data, null, 2));
  console.log('📊 Título:', data?.nombre);
  console.log('📊 Foto principal:', data?.foto);
  console.log('📊 Multimedia array:', data?.multimedia);
  console.log('📊 Total multimedia:', data?.multimedia?.length || 0);
  console.log('📊 Latitud:', data?.latitud);
  console.log('📊 Longitud:', data?.longitud);
  return data;
}

export default function MultiexperienciaDetailScreen() {
  const { id } = useLocalSearchParams();
  const experienciaId = Array.isArray(id) ? id[0] : id;
  
  console.log('🆔 ===== MULTIEXPERIENCIA DETALLE SCREEN =====');
  console.log('🆔 ID recibido:', experienciaId);
  console.log('🆔 Tipo de ID:', typeof experienciaId);

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
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#1F2937',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7A1C1C" />
        </View>
      </SafeAreaView>
    );
  }

  if (experienciaQuery.error || !experiencia) {
    console.error('❌ Error loading experiencia:', experienciaQuery.error);
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Error',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#1F2937',
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

  console.log('📸 ===== GALERÍA DE IMÁGENES =====');
  console.log('📸 Foto principal:', experiencia.foto || 'NO HAY');
  console.log('📸 Multimedia array completo:', experiencia.multimedia);
  console.log('📸 Total imágenes a mostrar:', allImages.length);
  console.log('📸 URLs de todas las imágenes:', allImages);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: experiencia.nombre,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1F2937',
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
                key={`image-${index}`}
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
            <Text style={styles.mapText}>
              Ubicación: {experiencia.latitud}, {experiencia.longitud}
            </Text>
            <Text style={styles.mapSubtext}>Mapa disponible en la web</Text>
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
    padding: 8,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  gallery: {
    width: width,
  },
  galleryImage: {
    width: width,
    height: 250,
    backgroundColor: '#F5F5F5',
    marginBottom: 2,
  },
  mapContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: '#F5F5F5',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
});
