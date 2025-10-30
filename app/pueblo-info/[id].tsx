import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Wind, Mountain, Users, Thermometer } from 'lucide-react-native';
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
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  aire: {
    ica: number;
    estado: string;
  };
  viento: number;
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
      setLoading(true);
      setData(null);
      setError(null);
      
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
        
        if (json.coordenadas?.lat && json.coordenadas?.lng) {
          console.log('🌍 Obteniendo datos en paralelo...');
          
          const requests = [];
          
          const weatherPromise = fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${json.coordenadas.lat}&lon=${json.coordenadas.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`
          )
            .then(res => res.ok ? res.json() : null)
            .catch(err => {
              console.log('🌍 Error fetching OpenWeather:', err);
              return null;
            });
          requests.push(weatherPromise);
          
          if (!json.altitud) {
            const elevationPromise = fetch(
              `https://api.open-elevation.com/api/v1/lookup?locations=${json.coordenadas.lat},${json.coordenadas.lng}`
            )
              .then(res => res.ok ? res.json() : null)
              .catch(err => {
                console.log('⛰️ Error fetching Open-Elevation:', err);
                return null;
              });
            requests.push(elevationPromise);
          }
          
          const [weatherData, elevationData] = await Promise.all(requests);
          
          if (weatherData) {
            console.log('🌍 OpenWeather data:', JSON.stringify(weatherData, null, 2));
            json.clima = json.clima || {};
            json.clima.temperatura = weatherData.main?.temp ?? json.clima.temperatura ?? null;
            json.clima.feels_like = weatherData.main?.feels_like ?? null;
            json.clima.humidity = weatherData.main?.humidity ?? json.clima.humidity ?? null;
            json.clima.pressure = weatherData.main?.pressure ?? json.clima.pressure ?? null;
            json.clima.descripcion = weatherData.weather?.[0]?.description ?? json.clima.descripcion ?? null;
            json.clima.icon = weatherData.weather?.[0]?.icon ?? null;
            
            json.viento = weatherData.wind?.speed ? Math.round(weatherData.wind.speed * 3.6) : 0;
            console.log(`💨 Viento: ${json.viento} km/h`);
            console.log(`🌡️ Feels like: ${json.clima.feels_like}°C`);
          }
          
          if (!json.altitud) {
            console.log('⛰️ Open-Elevation response:', JSON.stringify(elevationData, null, 2));
            if (elevationData?.results?.[0]?.elevation != null) {
              const elevation = elevationData.results[0].elevation;
              console.log('⛰️ Elevation value:', elevation, 'type:', typeof elevation);
              if (typeof elevation === 'number' && !isNaN(elevation)) {
                json.altitud = Math.round(elevation);
                console.log(`⛰️ Altitud calculada: ${json.altitud} m`);
              } else {
                console.log('⛰️ Altitud inválida:', elevation);
                json.altitud = 0;
              }
            } else {
              console.log('⛰️ No se pudo obtener altitud de Open-Elevation');
              json.altitud = 0;
            }
          } else {
            console.log(`⛰️ Altitud desde JSON: ${json.altitud} m`);
          }
        }
        
        console.log('✅ Datos finales para pueblo:', JSON.stringify({
          temperatura: json.clima?.temperatura,
          feels_like: json.clima?.feels_like,
          viento: json.viento,
          altitud: json.altitud
        }, null, 2));
        
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
              style={[styles.metricButton, { backgroundColor: '#9C27B0' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Thermometer size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Sensación Térmica</Text>
              <Text style={styles.metricValue}>
                {data.clima?.feels_like != null ? `${data.clima.feels_like.toFixed(1)}°C` : '--'}
              </Text>
              <Text style={styles.metricSubtext}>Temperatura percibida</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#00BCD4' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Wind size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Viento</Text>
              <Text style={styles.metricValue}>
                {data.viento != null ? `${data.viento} km/h` : '--'}
              </Text>
              <Text style={styles.metricSubtext}>Velocidad del viento</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, { backgroundColor: '#795548' }]}
              activeOpacity={0.9}
            >
              <View style={styles.iconContainer}>
                <Mountain size={32} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Altitud</Text>
              <Text style={styles.metricValue}>{data.altitud && data.altitud > 0 ? `${data.altitud} m` : '– m'}</Text>
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
