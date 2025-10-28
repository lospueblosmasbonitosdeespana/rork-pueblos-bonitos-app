import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherIconProps = {
  lat?: number;
  lon?: number;
  size?: number;
  onWeatherUpdate?: (data: { emoji: string; description: string; temperature: number }) => void;
};

const WEATHER_CACHE_KEY = 'weather_emoji_cache';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '8f6d7e4c3b2a1f9e8d7c6b5a4f3e2d1c';

const mapWeatherToEmoji = (id: number, icon: string, windSpeed: number): string => {
  const isNight = icon?.endsWith('n');
  
  if (windSpeed >= 10) return '🌬️';
  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌦️';
  if (id === 500) return '🌦️';
  if (id === 501) return '🌧️';
  if (id >= 502 && id <= 531) return '⛈️';
  if (id >= 600 && id <= 602) return '❄️';
  if (id >= 611 && id <= 616) return '🌨️';
  if (id >= 701 && id <= 781) return '🌫️';
  if (id === 800) return isNight ? '🌙' : '☀️';
  if (id === 801) return isNight ? '🌙' : '🌤️';
  if (id === 802) return isNight ? '☁️' : '⛅';
  if (id === 803) return isNight ? '☁️' : '🌥️';
  if (id === 804) return '☁️';
  
  return isNight ? '☁️' : '⛅';
};

const mapWeatherToDescription = (id: number, icon: string, windSpeed: number, description: string): string => {
  const isNight = icon?.endsWith('n');
  
  if (windSpeed >= 10) return 'Viento fuerte';
  if (id >= 200 && id < 300) return 'Tormenta';
  if (id >= 300 && id < 400) return 'Llovizna';
  if (id === 500) return 'Lluvia ligera';
  if (id === 501) return 'Lluvia moderada';
  if (id >= 502 && id <= 531) return 'Lluvia fuerte';
  if (id >= 600 && id <= 602) return 'Nieve';
  if (id >= 611 && id <= 616) return 'Aguanieve';
  if (id >= 701 && id <= 781) return 'Niebla';
  if (id === 800) return isNight ? 'Despejado (noche)' : 'Despejado';
  if (id === 801) return isNight ? 'Pocas nubes (noche)' : 'Pocas nubes';
  if (id === 802) return 'Parcialmente nublado';
  if (id === 803) return 'Muy nublado';
  if (id === 804) return 'Nublado';
  
  return description || (isNight ? 'Nublado' : 'Parcialmente nublado');
};

export default function WeatherIcon({ lat, lon, size = 32, onWeatherUpdate }: WeatherIconProps) {
  const [emoji, setEmoji] = useState<string>('⛅');

  useEffect(() => {
    const fetchWeather = async () => {
      if (!lat || !lon) {
        console.log('🌤️ No coordinates provided, using default emoji');
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
            console.log('🌤️ Using cached emoji');
            setEmoji(cached);
          }
          return;
        }

        const data = await res.json();
        console.log('🌤️ Weather data:', data);
        
        const weatherId = data.weather?.[0]?.id;
        const weatherIcon = data.weather?.[0]?.icon;
        const weatherDescription = data.weather?.[0]?.description;
        const windSpeed = data.wind?.speed || 0;
        const temperature = data.main?.temp || 0;
        
        console.log('🌤️ Weather ID:', weatherId, 'Icon:', weatherIcon, 'Wind:', windSpeed, 'Temp:', temperature);
        
        if (!weatherId || !weatherIcon) {
          console.log('🌤️ Missing weather data, using cached or default');
          return;
        }
        
        const newEmoji = mapWeatherToEmoji(weatherId, weatherIcon, windSpeed);
        const newDescription = mapWeatherToDescription(weatherId, weatherIcon, windSpeed, weatherDescription);
        console.log('🌤️ Emoji selected:', newEmoji, 'Description:', newDescription);
        
        setEmoji(newEmoji);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`, newEmoji);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_desc_${lat}_${lon}`, newDescription);
        await AsyncStorage.setItem(`${WEATHER_CACHE_KEY}_temp_${lat}_${lon}`, String(temperature));
        
        if (onWeatherUpdate) {
          onWeatherUpdate({
            emoji: newEmoji,
            description: newDescription,
            temperature,
          });
        }
      } catch (e) {
        console.log('🌤️ Error fetching weather:', e);
        const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
        if (cached) {
          console.log('🌤️ Using cached emoji after error');
          setEmoji(cached);
        }
      }
    };

    const loadCachedAndFetch = async () => {
      const cached = await AsyncStorage.getItem(`${WEATHER_CACHE_KEY}_${lat}_${lon}`);
      if (cached) {
        console.log('🌤️ Loading cached emoji:', cached);
        setEmoji(cached);
      }
      
      fetchWeather();
    };

    loadCachedAndFetch();

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lat, lon]);

  return <Text style={[styles.emoji, { fontSize: size }]}>{emoji}</Text>;
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center' as const,
  },
});