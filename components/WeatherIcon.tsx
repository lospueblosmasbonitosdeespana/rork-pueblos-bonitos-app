import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherIconProps = {
  lat?: number;
  lon?: number;
  size?: number;
};

const WEATHER_CACHE_KEY = 'weather_icon_cache';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '8f6d7e4c3b2a1f9e8d7c6b5a4f3e2d1c';

export default function WeatherIcon({ lat, lon, size = 40 }: WeatherIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lon) {
        console.log('🌤️ No coordinates provided');
        setLoading(false);
        return;
      }

      try {
        console.log(`🌤️ Fetching weather for lat=${lat}, lon=${lon}`);
        
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`
        );
        
        if (!res.ok) {
          console.log('🌤️ Weather API error:', res.status);
          const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
          if (cached) {
            console.log('🌤️ Using cached icon URL');
            setIconUrl(cached);
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log('🌤️ Weather data:', data);
        
        const weatherIcon = data.weather?.[0]?.icon;
        
        console.log('🌤️ Weather Icon code:', weatherIcon);
        
        if (!weatherIcon) {
          console.log('🌤️ Missing weather icon data');
          setLoading(false);
          return;
        }
        
        const url = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
        console.log('🌤️ Icon URL:', url);
        
        setIconUrl(url);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`, url);
        setLoading(false);
      } catch (e) {
        console.log('🌤️ Error fetching weather:', e);
        const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
        if (cached) {
          console.log('🌤️ Using cached icon URL after error');
          setIconUrl(cached);
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
      }
      
      fetchWeather();
    };

    loadCachedAndFetch();

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  if (!iconUrl) {
    return <View style={[styles.container, { width: size, height: size }]} />;
  }

  return (
    <Image 
      source={{ uri: iconUrl }} 
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
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
});
