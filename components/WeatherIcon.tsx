import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherIconProps = {
  lat?: number;
  lon?: number;
  size?: number;
};

const WEATHER_CACHE_KEY = 'weather_emoji_cache';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '8f6d7e4c3b2a1f9e8d7c6b5a4f3e2d1c';

const getWeatherEmoji = (description: string): string => {
  const desc = description.toLowerCase();

  if (desc.includes('clear')) return '☀️';
  if (desc.includes('few clouds')) return '🌤️';
  if (desc.includes('scattered clouds')) return '⛅';
  if (desc.includes('broken clouds')) return '🌥️';
  if (desc.includes('overcast')) return '☁️';
  if (desc.includes('light rain')) return '🌦️';
  if (desc.includes('moderate rain')) return '🌧️';
  if (desc.includes('heavy rain') || desc.includes('extreme rain')) return '⛈️';
  if (desc.includes('snow')) return '❄️';
  if (desc.includes('sleet') || desc.includes('rain and snow')) return '🌨️';
  if (desc.includes('thunderstorm') || desc.includes('thunder')) return '⚡';
  if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) return '🌫️';
  if (desc.includes('wind')) return '🌬️';
  
  return '☀️';
};

export default function WeatherIcon({ lat, lon, size = 32 }: WeatherIconProps) {
  const [emoji, setEmoji] = useState<string>('☀️');

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
          const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
          if (cached) {
            console.log('🌤️ Using cached emoji');
            setEmoji(cached);
          }
          return;
        }

        const data = await res.json();
        console.log('🌤️ Weather data:', data);
        
        const condition = data.weather?.[0]?.description || '';
        console.log('🌤️ Weather condition:', condition);
        
        const newEmoji = getWeatherEmoji(condition);
        console.log('🌤️ Emoji selected:', newEmoji);
        
        setEmoji(newEmoji);
        await AsyncStorage.setItem(WEATHER_CACHE_KEY, newEmoji);
      } catch (e) {
        console.log('🌤️ Error fetching weather:', e);
        const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          console.log('🌤️ Using cached emoji after error');
          setEmoji(cached);
        }
      }
    };

    const loadCachedAndFetch = async () => {
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
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