import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Map, X, Compass, Thermometer } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';
import {
  fetchExperienciasByPueblo,
  fetchLugar,
  fetchSemaforoByPueblo,
} from '@/services/api';
import { Semaforo } from '@/types/api';

export default function PuebloDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [showExperienciasModal, setShowExperienciasModal] = useState(false);
  const [experienciasLoading, setExperienciasLoading] = useState(true);

  console.log('🏘️ PuebloDetailScreen puebloId=', id);
  console.log('🏘️ puebloId type=', typeof id);

  const lugarQuery = useQuery({
    queryKey: ['lugar', id],
    queryFn: () => fetchLugar(id),
    enabled: !!id,
  });

  const semaforoQuery = useQuery({
    queryKey: ['semaforo', id],
    queryFn: () => fetchSemaforoByPueblo(id),
    enabled: !!id,
  });

  const experienciasQuery = useQuery({
    queryKey: ['experiencias', id],
    queryFn: () => fetchExperienciasByPueblo(id),
    enabled: !!id,
  });

  const lugar = lugarQuery.data;
  const semaforo = semaforoQuery.data;
  const experiencias = experienciasQuery.data || [];

  console.log('📊 experiencias=', experiencias);
  console.log('📊 exp completo=', experiencias.map(e => ({
    _ID: e._ID,
    id: (e as any).id,
    nombre: e.nombre,
    type_ID: typeof e._ID,
    type_id: typeof (e as any).id
  })));

  const getSemaforoColor = (estado?: Semaforo['estado']) => {
    switch (estado) {
      case 'verde':
        return COLORS.green;
      case 'amarillo':
        return COLORS.yellow;
      case 'rojo':
        return COLORS.red;
      default:
        return COLORS.border;
    }
  };

  const getSemaforoText = (estado?: Semaforo['estado']) => {
    switch (estado) {
      case 'verde':
        return t.pueblo.trafficLight.green;
      case 'amarillo':
        return t.pueblo.trafficLight.yellow;
      case 'rojo':
        return t.pueblo.trafficLight.red;
      default:
        return t.pueblo.trafficLight.unknown;
    }
  };

  if (lugarQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.pueblo.loading}</Text>
      </View>
    );
  }

  if (!lugar) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.pueblo.notFound}</Text>
      </View>
    );
  }

  const imageUrl =
    lugar.imagen_principal ??
    lugar.multimedia?.[0] ??
    'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800';

  const mapUrl = `https://maps.lospueblosmasbonitosdeespana.org/es/mapas/PB-${id}#${Date.now()}`;
  const experienciasUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${id}&app=1`;

  return (
    <>
      <Stack.Screen options={{ headerTitle: lugar.nombre }} />
      <ScrollView style={styles.container}>
        <Image source={{ uri: imageUrl }} style={styles.headerImage} contentFit="cover" />

        <View style={styles.content}>
          <Text style={styles.title}>{lugar.nombre}</Text>

          <View style={styles.locationContainer}>
            <MapPin size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {lugar.provincia}, {lugar.comunidad_autonoma}
            </Text>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowMapModal(true)}
              activeOpacity={0.7}
            >
              <Map size={20} color={COLORS.card} />
              <Text style={styles.actionButtonText}>{t.pueblo.viewOnMap}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExperienciasModal(true)}
              activeOpacity={0.7}
            >
              <Compass size={20} color={COLORS.card} />
              <Text style={styles.actionButtonText}>Ver experiencias</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/pueblo-info/${id}` as any)}
              activeOpacity={0.7}
            >
              <Thermometer size={20} color={COLORS.card} />
              <Text style={styles.actionButtonText}>Clima</Text>
            </TouchableOpacity>
          </View>

          {semaforo && (
            <View
              style={[
                styles.semaforoCard,
                { borderLeftColor: getSemaforoColor(semaforo.estado) },
              ]}
            >
              <View style={styles.semaforoHeader}>
                <View
                  style={[
                    styles.semaforoDot,
                    { backgroundColor: getSemaforoColor(semaforo.estado) },
                  ]}
                />
                <Text style={styles.semaforoTitle}>
                  {getSemaforoText(semaforo.estado)}
                </Text>
              </View>
              {semaforo.descripcion && (
                <Text style={styles.semaforoDescription}>{semaforo.descripcion}</Text>
              )}
              {semaforo.motivo && (
                <Text style={styles.semaforoMotivo}>Motivo: {semaforo.motivo}</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experiencia disponible</Text>
            {experienciasQuery.isLoading ? (
              <View style={styles.experienciaCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={[styles.experienciaDescription, { marginTop: SPACING.sm, textAlign: 'center' as const }]}>Cargando experiencias...</Text>
              </View>
            ) : experienciasQuery.error ? (
              <View style={styles.experienciaCard}>
                <Text style={[styles.experienciaDescription, { color: COLORS.error, textAlign: 'center' as const }]}>
                  {experienciasQuery.error instanceof Error 
                    ? experienciasQuery.error.message 
                    : 'No se pudieron cargar las experiencias'}
                </Text>
              </View>
            ) : experiencias.length > 0 ? (
              <>
                {experiencias.map((exp, index) => (
                  <TouchableOpacity 
                    key={exp._ID ? `exp-${exp._ID}` : `exp-index-${index}`}
                    style={styles.experienciaCard}
                    onPress={() => {
                      const expData = exp as any;
                      const expId = String(expData.id || exp._ID);
                      console.log('🔓 open exp:', {
                        _ID: exp._ID,
                        id: expData.id,
                        usandoId: expId,
                        nombre: exp.nombre,
                        expCompleto: expData
                      });
                      router.push(`/multiexperiencia/${expId}` as any);
                    }}
                    activeOpacity={0.7}
                  >
                    {exp.foto && (
                      <Image 
                        source={{ uri: exp.foto }} 
                        style={styles.experienciaImage} 
                        contentFit="cover" 
                      />
                    )}
                    <Text style={styles.experienciaName}>{exp.nombre}</Text>
                    {exp.descripcion && (
                      <Text style={styles.experienciaDescription} numberOfLines={3}>
                        {exp.descripcion}
                      </Text>
                    )}
                    {exp.pueblo_nombre && (
                      <Text style={styles.experienciaPueblo}>{exp.pueblo_nombre}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.experienciaCard}>
                <Text style={[styles.experienciaDescription, { textAlign: 'center' as const, fontStyle: 'italic' as const }]}>
                  No hay experiencias disponibles para este pueblo.
                </Text>
              </View>
            )}
          </View>

          {lugar.descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.pueblo.description}</Text>
              <Text style={styles.descripcionText}>{lugar.descripcion}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lugar.nombre}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMapModal(false)}
                activeOpacity={0.7}
              >
                <X size={22} color={COLORS.card} />
                <Text style={styles.closeButtonText}>Volver a la app</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <WebView
            source={{ uri: mapUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadEnd={() => setMapLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('❌ WebView error:', nativeEvent);
              setMapLoading(false);
            }}
            geolocationEnabled={true}
            allowsInlineMediaPlayback={true}
            injectedJavaScript={`
              (function() {
                const header = document.querySelector('header');
                if (header) header.style.display = 'none';
                const wpAdminBar = document.querySelector('#wpadminbar');
                if (wpAdminBar) wpAdminBar.style.display = 'none';
              })();
            `}
          />
          {mapLoading && (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={showExperienciasModal}
        animationType="slide"
        onRequestClose={() => setShowExperienciasModal(false)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Experiencias - {lugar.nombre}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowExperienciasModal(false)}
                activeOpacity={0.7}
              >
                <X size={22} color={COLORS.card} />
                <Text style={styles.closeButtonText}>Volver a la app</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <WebView
            source={{ uri: experienciasUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadEnd={() => setExperienciasLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('❌ WebView error:', nativeEvent);
              setExperienciasLoading(false);
            }}
            geolocationEnabled={true}
            allowsInlineMediaPlayback={true}
          />
          {experienciasLoading && (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  headerImage: {
    width: '100%',
    height: 250,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.gold,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  locationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  semaforoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  semaforoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  semaforoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  semaforoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  semaforoDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  semaforoMotivo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic' as const,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  descripcionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  experienciaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  experienciaName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  experienciaDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  experienciaImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  experienciaPueblo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600' as const,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.card,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalSafeArea: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.card,
    flex: 1,
    marginRight: SPACING.sm,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.card,
  },
  webview: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
