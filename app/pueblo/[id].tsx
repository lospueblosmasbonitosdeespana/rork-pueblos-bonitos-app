import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Map, X, Route, Wind } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView, FlatList, Dimensions, Platform, Linking } from 'react-native';
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

  const multimediaQuery = useQuery({
    queryKey: ['multimedia', id],
    queryFn: async () => {
      try {
        const response = await fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/multimedia?id_lugar=${id}`);
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('❌ Error loading multimedia:', error);
        return [];
      }
    },
    enabled: !!id,
  });

  const lugar = lugarQuery.data;
  const semaforo = semaforoQuery.data;
  const experiencias = experienciasQuery.data || [];
  const multimedia = multimediaQuery.data || [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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

  const imagenesValidas = multimedia
    .filter((item: any) => {
      if (!item || !item.url || typeof item.url !== 'string') return false;
      
      const esImagen = item.tipo === 'Imagen' || 
        item.url.toLowerCase().endsWith('.jpg') || 
        item.url.toLowerCase().endsWith('.jpeg') || 
        item.url.toLowerCase().endsWith('.png') ||
        item.url.toLowerCase().endsWith('.webp');
      
      return esImagen;
    })
    .map((item: any) => item.url);

  const carouselImages = [imageUrl, ...imagenesValidas]
    .filter((url, index, self) => url && self.indexOf(url) === index);

  const mapUrl = `https://maps.lospueblosmasbonitosdeespana.org/es/mapas/PB-${id}#${Date.now()}`;
  const experienciasUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${id}&app=1`;

  const openDirections = () => {
    const lat = lugar.lat;
    const lng = lugar.lng;
    
    console.log('🗺️🗺️🗺️ BOTÓN PRESIONADO - Abriendo direcciones 🗺️🗺️🗺️');
    console.log('📍 Coordenadas:', { lat, lng, latType: typeof lat, lngType: typeof lng });
    console.log('🏘️ Pueblo:', lugar.nombre);
    
    if (!lat || !lng || lat === 0 || lng === 0) {
      console.warn('⚠️⚠️⚠️ NO HAY COORDENADAS VÁLIDAS:', { lat, lng });
      alert(`No hay coordenadas válidas para este pueblo.\nlat: ${lat}\nlng: ${lng}`);
      return;
    }

    const url = Platform.select({
      ios: `maps://?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });

    console.log('🔗 URL del mapa generada:', url);
    console.log('📱 Platform.OS:', Platform.OS);
    
    Linking.openURL(url!).then(() => {
      console.log('✅ Mapa abierto exitosamente');
    }).catch((err) => {
      console.error('❌ Error al abrir el mapa:', err);
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      console.log('🔗 Intentando con URL fallback:', fallbackUrl);
      Linking.openURL(fallbackUrl).catch((fallbackErr) => {
        console.error('❌ Error también con fallback:', fallbackErr);
        alert(`Error al abrir el mapa: ${err.message}`);
      });
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: lugar.nombre }} />
      <ScrollView style={styles.container}>
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={carouselImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image 
                source={{ uri: item }} 
                style={styles.headerImage} 
                contentFit="cover"
                onError={(e) => console.log('❌ Error cargando imagen', e)}
              />
            )}
            keyExtractor={(item, index) => `image-${index}`}
          />
          {carouselImages.length > 1 && (
            <View style={styles.paginationContainer}>
              {carouselImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentImageIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lugar.nombre}</Text>
            {lugar.bandera && (
              <Image 
                source={{ uri: lugar.bandera }} 
                style={styles.banderaImage}
                contentFit="contain"
              />
            )}
          </View>

          <View style={styles.locationContainer}>
            <MapPin size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {lugar.provincia}{lugar.comunidad ? `, ${lugar.comunidad}` : ''}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={openDirections}
              activeOpacity={0.7}
            >
              <Text style={styles.directionsText}>Cómo llegar</Text>
            </TouchableOpacity>

            <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowMapModal(true)}
              activeOpacity={0.7}
            >
              <Map size={24} color={COLORS.card} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExperienciasModal(true)}
              activeOpacity={0.7}
            >
              <Route size={24} color={COLORS.card} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/pueblo-info/${id}` as any)}
              activeOpacity={0.7}
            >
              <Wind size={24} color={COLORS.card} />
            </TouchableOpacity>
            </View>
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
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            incognito={false}
            cacheEnabled={true}
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
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            incognito={false}
            cacheEnabled={true}
            startInLoadingState={true}
            onLoadEnd={() => setExperienciasLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('❌ WebView error:', nativeEvent);
              setExperienciasLoading(false);
            }}
            geolocationEnabled={true}
            allowsInlineMediaPlayback={true}
            injectedJavaScript={`
              (function() {
                try {
                  const header = document.querySelector('header');
                  if (header) header.style.display = 'none';
                  
                  const adminBar = document.querySelector('#wpadminbar');
                  if (adminBar) adminBar.style.display = 'none';
                  
                  document.body.style.marginTop = '0';
                  document.body.style.paddingTop = '0';
                } catch(e) {
                  console.log('Error:', e);
                }
              })();
              true;
            `}
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
  carouselContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  headerImage: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    padding: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    flex: 1,
  },
  banderaImage: {
    width: 60,
    height: 40,
    marginLeft: SPACING.sm,
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
  buttonsContainer: {
    marginBottom: SPACING.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  directionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    height: 32,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    ...SHADOWS.medium,
    minHeight: 56,
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
