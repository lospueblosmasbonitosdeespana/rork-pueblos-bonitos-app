import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Wind, Thermometer, CloudRain, Mountain, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';

type PuebloInfo = {
  nombre: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  altitud: number;
  clima: {
    temperatura: number;
    descripcion: string;
  };
  aire: {
    ica: number;
    estado: string;
  };
  lluvia_24h: number;
  afluencia: {
    estado: string;
    descripcion: string;
  };
};

async function fetchPuebloInfo(id: string): Promise<PuebloInfo> {
  const response = await fetch(
    `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblo-info?id=${id}`
  );
  if (!response.ok) {
    throw new Error('Error al cargar la información del pueblo');
  }
  return response.json();
}

export default function PuebloInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const infoQuery = useQuery({
    queryKey: ['pueblo-info', id],
    queryFn: () => fetchPuebloInfo(id),
    enabled: !!id,
  });

  const getAirQualityColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('buena') || estadoLower.includes('bueno')) return '#4CAF50';
    if (estadoLower.includes('moderada') || estadoLower.includes('moderado')) return '#FFC107';
    if (estadoLower.includes('mala') || estadoLower.includes('malo')) return '#FF5722';
    return COLORS.textSecondary;
  };

  const getAfluenciaColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('baja')) return '#4CAF50';
    if (estadoLower.includes('media') || estadoLower.includes('moderada')) return '#FFC107';
    if (estadoLower.includes('alta')) return '#FF5722';
    return COLORS.textSecondary;
  };

  if (infoQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (infoQuery.error || !infoQuery.data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se ha encontrado información para este pueblo</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const info = infoQuery.data;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerTitle: info.nombre,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Bienvenido a {info.nombre}</Text>
          
          <View style={styles.grid}>
            <View style={[styles.card, { borderLeftColor: getAirQualityColor(info.aire.estado) }]}>
              <View style={styles.cardHeader}>
                <Wind size={24} color={getAirQualityColor(info.aire.estado)} />
                <Text style={styles.cardTitle}>Calidad del Aire</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardValue, { color: getAirQualityColor(info.aire.estado) }]}>
                  {info.aire.estado}
                </Text>
                <Text style={styles.cardSubvalue}>ICA: {info.aire.ica}</Text>
              </View>
            </View>

            <View style={[styles.card, { borderLeftColor: '#FF9800' }]}>
              <View style={styles.cardHeader}>
                <Thermometer size={24} color="#FF9800" />
                <Text style={styles.cardTitle}>Temperatura</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardValue, { color: '#FF9800' }]}>
                  {info.clima.temperatura}°C
                </Text>
                <Text style={styles.cardSubvalue}>{info.clima.descripcion}</Text>
              </View>
            </View>

            <View style={[styles.card, { borderLeftColor: '#2196F3' }]}>
              <View style={styles.cardHeader}>
                <CloudRain size={24} color="#2196F3" />
                <Text style={styles.cardTitle}>Lluvia 24h</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardValue, { color: '#2196F3' }]}>
                  {info.lluvia_24h} mm
                </Text>
                <Text style={styles.cardSubvalue}>Últimas 24 horas</Text>
              </View>
            </View>

            <View style={[styles.card, { borderLeftColor: '#795548' }]}>
              <View style={styles.cardHeader}>
                <Mountain size={24} color="#795548" />
                <Text style={styles.cardTitle}>Altitud</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardValue, { color: '#795548' }]}>
                  {info.altitud} m
                </Text>
                <Text style={styles.cardSubvalue}>sobre el nivel del mar</Text>
              </View>
            </View>

            <View style={[styles.card, { borderLeftColor: getAfluenciaColor(info.afluencia.estado) }]}>
              <View style={styles.cardHeader}>
                <Users size={24} color={getAfluenciaColor(info.afluencia.estado)} />
                <Text style={styles.cardTitle}>Afluencia</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardValue, { color: getAfluenciaColor(info.afluencia.estado) }]}>
                  {info.afluencia.estado}
                </Text>
                <Text style={styles.cardSubvalue}>{info.afluencia.descripcion}</Text>
              </View>
            </View>
          </View>

          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Coordenadas GPS</Text>
            <Text style={styles.coordsText}>
              {info.coordenadas.lat.toFixed(6)}, {info.coordenadas.lng.toFixed(6)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.card,
    fontWeight: '700' as const,
  },
  headerBackButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontSize: 18,
  },
  cardBody: {
    gap: SPACING.xs,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  cardSubvalue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  coordsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  coordsTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  coordsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
});
