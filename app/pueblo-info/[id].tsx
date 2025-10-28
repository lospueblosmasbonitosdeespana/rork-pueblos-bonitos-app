import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Wind, Thermometer, CloudRain, Mountain, Users } from 'lucide-react-native';
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

export default function PuebloInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<PuebloInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🏞️ PuebloInfo id:', id);

  useEffect(() => {
    async function load() {
      try {
        console.log('🌍 Fetching pueblo-info for id:', id);
        const res = await fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblo-info?id=${id}`);
        console.log('🌍 Response status:', res.status);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const json = await res.json();
        console.log('🌍 pueblo-info json:', json);
        
        setData(json);
      } catch (e) {
        console.log('🌍 pueblo-info error:', e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      load();
    }
  }, [id]);

  const getAirQualityColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('buena') || estadoLower.includes('bueno')) return '#4CAF50';
    if (estadoLower.includes('moderada') || estadoLower.includes('moderado') || estadoLower.includes('regular')) return '#FFC107';
    if (estadoLower.includes('mala') || estadoLower.includes('malo')) return '#FF5722';
    return COLORS.textSecondary;
  };

  const getAfluenciaColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('baja') || estadoLower.includes('verde')) return '#4CAF50';
    if (estadoLower.includes('media') || estadoLower.includes('moderada') || estadoLower.includes('amarillo')) return '#FFC107';
    if (estadoLower.includes('alta') || estadoLower.includes('rojo')) return '#FF5722';
    return COLORS.textSecondary;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            headerTitle: 'Información del Pueblo',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                <ArrowLeft size={24} color={COLORS.text} />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No se ha encontrado información para este pueblo</Text>
          <Text style={styles.errorSubtext}>{error || 'Sin datos'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerTitle: data.nombre,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Bienvenido a {data.nombre}</Text>
          
          <View style={styles.grid}>
            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: getAirQualityColor(data.aire?.estado || '') }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Wind size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Calidad del Aire</Text>
              <Text style={styles.metricValue}>{data.aire?.ica || '—'}</Text>
              <Text style={styles.metricSubtext}>ICA: {data.aire?.estado || '—'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#FF9800' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Thermometer size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Temperatura</Text>
              <Text style={styles.metricValue}>
                {data.clima?.temperatura ? `${data.clima.temperatura.toFixed(1)}°C` : '—'}
              </Text>
              <Text style={styles.metricSubtext}>{data.clima?.descripcion || '—'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#2196F3' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <CloudRain size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Lluvia últimas 24h</Text>
              <Text style={styles.metricValue}>{data.lluvia_24h ?? '0'} mm</Text>
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
              <Text style={styles.metricValue}>{data.altitud ?? '—'} m</Text>
              <Text style={styles.metricSubtext}>sobre el nivel del mar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: getAfluenciaColor(data.afluencia?.estado || '') }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Users size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Afluencia</Text>
              <Text style={styles.metricValue}>{data.afluencia?.estado || '—'}</Text>
              <Text style={styles.metricSubtext}>{data.afluencia?.descripcion || '—'}</Text>
            </TouchableOpacity>
          </View>

          {data.coordenadas && (
            <View style={styles.coordsCard}>
              <Text style={styles.coordsLabel}>Coordenadas GPS</Text>
              <Text style={styles.coordsValue}>
                {data.coordenadas.lat ? Number(data.coordenadas.lat).toFixed(6) : '—'}, {data.coordenadas.lng ? Number(data.coordenadas.lng).toFixed(6) : '—'}
              </Text>
            </View>
          )}
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
    fontWeight: '600',
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
    fontWeight: '700',
  },
  headerBackButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
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
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  metricSubtext: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
