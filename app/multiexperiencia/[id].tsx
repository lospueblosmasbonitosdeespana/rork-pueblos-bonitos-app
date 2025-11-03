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
import { fetchMultiexperienciaDetalle } from '@/services/api';

const { width } = Dimensions.get('window');

export default function MultiexperienciaDetailScreen() {
  const { id } = useLocalSearchParams();
  const experienciaId = Array.isArray(id) ? id[0] : id;
  
  console.log('🆔 MultiexperienciaDetailScreen received id=', id);
  console.log('🆔 processed experienciaId=', experienciaId);
  console.log('🆔 experienciaId type=', typeof experienciaId);

  const experienciaQuery = useQuery({
    queryKey: ['multiexperiencia-detalle', experienciaId],
    queryFn: () => fetchMultiexperienciaDetalle(experienciaId),
    enabled: !!experienciaId,
  });

  const experiencia = experienciaQuery.data;

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

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
          <Text style={styles.loadingText}>Cargando experiencia...</Text>
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
          <Text style={styles.errorText}>No se ha encontrado información para esta experiencia.</Text>
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
        testID="multiexperiencia-detail-scroll"
      >
        <Text style={styles.title} testID="multiexperiencia-title">{experiencia.nombre}</Text>

        {experiencia.descripcion && (
          <View style={styles.textSection}>
            <Text style={styles.description}>
              {stripHtml(experiencia.descripcion)}
            </Text>
          </View>
        )}

        {allImages.length > 0 && (
          <View style={styles.photosSection} testID="multiexperiencia-galeria">
            {allImages.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.photoImage}
                contentFit="cover"
              />
            ))}
          </View>
        )}

        <View style={styles.mapSection} testID="multiexperiencia-mapa">
          <Text style={styles.mapPlaceholder}>Mapa disponible en la web</Text>
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
    paddingBottom: SPACING.xl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    textAlign: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  textSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    lineHeight: 24,
  },
  photosSection: {
    paddingBottom: SPACING.lg,
  },
  photoImage: {
    width: width,
    height: 250,
    backgroundColor: '#F5F5F5',
    marginBottom: 1,
  },
  mapSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  mapPlaceholder: {
    ...TYPOGRAPHY.body,
    color: '#6B7280',
    textAlign: 'center',
    padding: SPACING.xl,
    backgroundColor: '#F5F5F5',
  },
});
