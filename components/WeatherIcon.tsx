import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherIconProps = {
  lat?: number;
  lon?: number;
  size?: number;
};

const WEATHER_CACHE_KEY = 'weather_icon_cache';

const OPENWEATHER_API_KEY = '9ce45e94ada3e86dab5e89fb11a2d066';

export default function WeatherIcon({ lat, lon, size = 40 }: WeatherIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lon) {
        console.log('🌤️ No coordinates provided');
        setLoading(false);
        setError(true);
        return;
      }

      try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
        console.log(`🌤️ Fetching weather from:`, apiUrl);
        
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          console.log('🌤️ Weather API error:', res.status);
          const errorText = await res.text();
          console.log('🌤️ Error response:', errorText);
          const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
          if (cached) {
            console.log('🌤️ Using cached icon URL');
            setIconUrl(cached);
            setError(false);
          } else {
            setError(true);
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('🌤️ Weather data received:', JSON.stringify(data, null, 2));
        
        const weatherIcon = data.weather?.[0]?.icon;
        
        console.log('🌤️ Weather Icon code:', weatherIcon);
        
        if (!weatherIcon) {
          console.log('🌤️ Missing weather icon data in response');
          setError(true);
          setLoading(false);
          return;
        }
        
        const url = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png?t=${Date.now()}`;
        console.log('🌤️ ICONO API:', weatherIcon);
        console.log('🌤️ URL GENERADA:', url);
        
        setIconUrl(url);
        setError(false);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`, url);
        setLoading(false);
      } catch (e) {
        console.log('🌤️ Error fetching weather:', e);
        const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
        if (cached) {
          console.log('🌤️ Using cached icon URL after error');
          setIconUrl(cached);
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    };

    const loadCachedAndFetch = async () => {
      const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
      if (cached) {
        console.log('🌤️ Loading cached icon URL:', cached);
        setIconUrl(cached);
        setLoading(false);
        setError(false);
      }
      
      fetchWeather();
    };

    loadCachedAndFetch();

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading && !iconUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  if (error && !iconUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.fallbackIcon}>☀️</Text>
      </View>
    );
  }

  if (!iconUrl) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.fallbackIcon}>☀️</Text>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: iconUrl }} 
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
      onError={(e) => {
        console.log('🌤️ Image loading error:', e.nativeEvent.error);
        setError(true);
        setIconUrl(null);
      }}
      onLoad={() => {
        console.log('🌤️ Image loaded successfully');
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
  fallbackIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
});
