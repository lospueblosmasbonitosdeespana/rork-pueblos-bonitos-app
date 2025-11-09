import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherIconProps = {
  lat?: number;
  lon?: number;
  size?: number;
};

const WEATHER_CACHE_KEY = 'weather_icon_cache';

const OPENWEATHER_API_KEY = '8a08af2ba8e236a0fbac662a78a7f24b';

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
            const cachedWithTimestamp = `${cached}?t=${Date.now()}`;
            console.log('🌤️ Using cached icon URL:', cachedWithTimestamp);
            setIconUrl(cachedWithTimestamp);
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
        
        const baseUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
        const url = `${baseUrl}?t=${Date.now()}`;
        console.log('🌤️ ICONO API:', weatherIcon);
        console.log('🌤️ URL BASE:', baseUrl);
        console.log('🌤️ URL CON TIMESTAMP:', url);
        
        setIconUrl(url);
        setError(false);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`, baseUrl);
        setLoading(false);
      } catch (e) {
        console.log('🌤️ Error fetching weather:', e);
        const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
        if (cached) {
          const cachedWithTimestamp = `${cached}?t=${Date.now()}`;
          console.log('🌤️ Using cached icon URL after error:', cachedWithTimestamp);
          setIconUrl(cachedWithTimestamp);
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
        const cachedWithTimestamp = `${cached}?t=${Date.now()}`;
        console.log('🌤️ Loading cached icon URL:', cachedWithTimestamp);
        setIconUrl(cachedWithTimestamp);
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
      contentFit="contain"
      cachePolicy="none"
      onError={(error) => {
        console.log('🌤️ Image loading error:', error);
        setError(true);
        setIconUrl(null);
      }}
      onLoad={() => {
        console.log('🌤️ Image loaded successfully:', iconUrl);
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
