import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, MapPin, Clock, Route, Info } from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { fetchMultiexperienciaDetalle } from '@/services/api';

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
      <View style={styles.container}>
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
      </View>
    );
  }

  if (experienciaQuery.error || !experiencia) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <View style={styles.content}>
          <Text style={styles.title} testID="multiexperiencia-title">{experiencia.nombre}</Text>

          {experiencia.descripcion && (
            <View style={styles.section} testID="multiexperiencia-intro">
              <Text style={styles.sectionTitle}>Presentación</Text>
              <Text style={styles.description}>
                {stripHtml(experiencia.descripcion)}
              </Text>
            </View>
          )}

          {(experiencia.multimedia && experiencia.multimedia.length > 0) || experiencia.foto ? (
            <View style={styles.section} testID="multiexperiencia-galeria">
              <Text style={styles.sectionTitle}>Fotos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.galleryContainer}
                testID="multiexperiencia-photos-scroll"
              >
                {experiencia.foto && (
                  <Image
                    source={{ uri: experiencia.foto }}
                    style={styles.galleryImage}
                    contentFit="cover"
                  />
                )}
                {experiencia.multimedia?.map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.galleryImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {(experiencia.pueblo_nombre || experiencia.provincia || experiencia.comunidad_autonoma) && (
            <View style={styles.locationCard} testID="multiexperiencia-location">
              <MapPin size={20} color={COLORS.primary} />
              <View style={styles.locationInfo}>
                {experiencia.pueblo_nombre && (
                  <Text style={styles.locationText}>{experiencia.pueblo_nombre}</Text>
                )}
                {(experiencia.provincia || experiencia.comunidad_autonoma) && (
                  <Text style={styles.locationSubtext}>
                    {[experiencia.provincia, experiencia.comunidad_autonoma].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {(experiencia.tiempo || experiencia.kilometros || experiencia.duracion || experiencia.dificultad) && (
            <View style={styles.metaContainer} testID="multiexperiencia-meta">
              {(experiencia.tiempo || experiencia.duracion) && (
                <View style={styles.metaCard}>
                  <Clock size={18} color={COLORS.primary} />
                  <View>
                    <Text style={styles.metaLabel}>Duración</Text>
                    <Text style={styles.metaText}>{experiencia.tiempo || experiencia.duracion}</Text>
                  </View>
                </View>
              )}
              {experiencia.kilometros && (
                <View style={styles.metaCard}>
                  <Route size={18} color={COLORS.primary} />
                  <View>
                    <Text style={styles.metaLabel}>Distancia</Text>
                    <Text style={styles.metaText}>{experiencia.kilometros} km</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {experiencia.dificultad && (
            <View style={styles.difficultyCard}>
              <Info size={18} color={COLORS.primary} />
              <View style={styles.difficultyInfo}>
                <Text style={styles.difficultyLabel}>Dificultad</Text>
                <Text style={styles.difficultyText}>{experiencia.dificultad}</Text>
              </View>
            </View>
          )}

          {experiencia.tipo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Adicional</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tipo de experiencia</Text>
                  <Text style={styles.infoValue}>
                    {experiencia.tipo === 'ruta' ? 'Ruta' : 
                     experiencia.tipo === 'experiencia' ? 'Experiencia' : 
                     experiencia.tipo === 'punto_interes' ? 'Punto de Interés' : 
                     experiencia.tipo}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  headerImage: {
    width: '100%',
    height: 280,
    backgroundColor: COLORS.beige,
    borderRadius: 12,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'justify' as const,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  locationSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  metaLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  metaText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  difficultyInfo: {
    flex: 1,
  },
  difficultyLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  difficultyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  infoGrid: {
    gap: SPACING.sm,
  },
  infoItem: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  galleryContainer: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  galleryImage: {
    width: 300,
    height: 210,
    borderRadius: 12,
    backgroundColor: COLORS.beige,
  },
});
