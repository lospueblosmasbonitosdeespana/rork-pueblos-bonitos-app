import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Wind, Thermometer, CloudRain, Mountain, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import { COLORS, SHADOWS, SPACING } from '@/constants/theme';

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
  console.log('🌍 Fetching pueblo info for id:', id);
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblo-info?id=${id}`;
  console.log('🌍 URL:', url);
  
  const response = await fetch(url);
  console.log('🌍 Response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`Error al cargar la información del pueblo: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('🌍 Data received:', data);
  
  return data;
}

export default function PuebloInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log('🏞️ PuebloInfoScreen id:', id);

  const infoQuery = useQuery({
    queryKey: ['pueblo-info', id],
    queryFn: () => fetchPuebloInfo(id),
    enabled: !!id,
  });

  console.log('🏞️ Query status:', {
    isLoading: infoQuery.isLoading,
    isError: infoQuery.isError,
    error: infoQuery.error,
    data: infoQuery.data,
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
    console.error('❌ Error loading pueblo info:', infoQuery.error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se ha encontrado información para este pueblo</Text>
        <Text style={styles.errorSubtext}>
          {infoQuery.error instanceof Error ? infoQuery.error.message : 'Error desconocido'}
        </Text>
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
            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: getAirQualityColor(info.aire.estado) }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Wind size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Calidad del Aire</Text>
              <Text style={styles.metricValue}>{info.aire.ica}</Text>
              <Text style={styles.metricSubtext}>{info.aire.estado}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#FF9800' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Thermometer size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Temperatura</Text>
              <Text style={styles.metricValue}>{info.clima.temperatura}°C</Text>
              <Text style={styles.metricSubtext}>{info.clima.descripcion}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#2196F3' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <CloudRain size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Lluvia 24h</Text>
              <Text style={styles.metricValue}>{info.lluvia_24h} mm</Text>
              <Text style={styles.metricSubtext}>Últimas 24 horas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#795548' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Mountain size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Altitud</Text>
              <Text style={styles.metricValue}>{info.altitud} m</Text>
              <Text style={styles.metricSubtext}>sobre el nivel del mar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: getAfluenciaColor(info.afluencia.estado) }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Users size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Afluencia</Text>
              <Text style={styles.metricValue}>{info.afluencia.estado}</Text>
              <Text style={styles.metricSubtext}>{info.afluencia.descripcion}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coordsCard}>
            <Text style={styles.coordsLabel}>Coordenadas GPS</Text>
            <Text style={styles.coordsValue}>
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
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '600' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    fontSize: 16,
    color: COLORS.card,
    fontWeight: '700' as const,
  },
  headerBackButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.text,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  grid: {
    gap: SPACING.md,
  },
  metricButton: {
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
    minHeight: 160,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  metricSubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    opacity: 0.85,
    textAlign: 'center',
  },
  coordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.small,
    alignItems: 'center',
  },
  coordsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  coordsValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700' as const,
    fontFamily: 'monospace',
  },
});
