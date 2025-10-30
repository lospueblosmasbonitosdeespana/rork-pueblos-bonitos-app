import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Wind, CloudRain, Mountain, Users } from 'lucide-react-native';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import WeatherIcon from '@/components/WeatherIcon';

const OPENWEATHER_API_KEY = '8a08af2ba8e236a0fbac662a78a7f24b';

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
        
        if (!res.ok) {
          const errorText = await res.text();
          console.log('🌍 Server error:', errorText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        console.log('🌍 pueblo-info json:', JSON.stringify(json, null, 2));
        
        if (!json.clima || !json.clima.temperatura || !json.clima.descripcion) {
          console.log('🌍 Datos meteorológicos incompletos, obteniendo desde OpenWeather...');
          try {
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${json.coordenadas.lat}&lon=${json.coordenadas.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`
            );
            if (weatherRes.ok) {
              const weatherData = await weatherRes.json();
              console.log('🌍 OpenWeather data:', JSON.stringify(weatherData, null, 2));
              json.clima = json.clima || {};
              json.clima.temperatura = json.clima.temperatura || weatherData.main.temp;
              json.clima.descripcion = json.clima.descripcion || weatherData.weather[0].description;
              json.clima.icon = weatherData.weather[0].icon;
            }
          } catch (weatherError) {
            console.log('🌍 Error fetching OpenWeather data:', weatherError);
          }
        }

        if (!json.lluvia_24h) {
          console.log('🌧️ Obteniendo datos de precipitación desde AEMET OpenData...');
          try {
            const url = 'https://opendata.aemet.es/opendata/api/observacion/convencional/todas/?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsb3NwdWVibG9zbWFzYm9uaXRvc2RlZXNwYW5hQGdtYWlsLmNvbSIsImp0aSI6ImZhYWM1NzRkLWNlMGItNDEzMi1iOTM2LWMxNTM4Y2EzZDI1YSIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzYxNzI0MDc2LCJ1c2VySWQiOiJmYWFjNTc0ZC1jZTBiLTQxMzItYjkzNi1jMTUzOGNhM2QyNWEiLCJyb2xlIjoiIn0.MzCfv7virwFAKAiND87V8N5dMgRTpHuWnlQADU3FIfM';
            
            const meta = await fetch(url);
            const metaJson = await meta.json();
            console.log('🌧️ AEMET meta response:', JSON.stringify(metaJson, null, 2));
            
            const dataRes = await fetch(metaJson.datos);
            const estaciones = await dataRes.json();
            console.log('🌧️ AEMET estaciones (primeras 3):', JSON.stringify(estaciones.slice(0, 3), null, 2));
            
            const est = estaciones.find((e: any) =>
              e.ubi && e.ubi.toLowerCase().includes(json.nombre.toLowerCase())
            );
            
            json.lluvia_24h = est?.prec ?? 0;
            console.log(`🌧️ Resultado lluvia para ${json.nombre}: ${json.lluvia_24h} mm`);
          } catch (error) {
            console.log('🌧️ Error al obtener datos AEMET:', error);
            json.lluvia_24h = 0;
          }
        }
        
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
                <WeatherIcon 
                  lat={data.coordenadas?.lat} 
                  lon={data.coordenadas?.lng} 
                  size={40}
                />
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
              <Text style={styles.metricValue}>
                {data.lluvia_24h && data.lluvia_24h > 0 
                  ? `${data.lluvia_24h.toFixed(1)} mm` 
                  : 'Sin lluvia'
                }
              </Text>
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
