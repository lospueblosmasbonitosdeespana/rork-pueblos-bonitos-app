import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export const [GeolocationProvider, useGeolocation] = createContextHook(() => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('📍 Solicitando permisos de geolocalización...');
      setIsLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      console.log('📍 Estado de permisos:', status);
      
      if (status === 'granted') {
        setHasPermission(true);
        console.log('✅ Permisos de geolocalización concedidos');
        return true;
      } else {
        setHasPermission(false);
        const mensaje = 'La detección por geolocalización está desactivada. Actívala para registrar tus visitas automáticamente.';
        setError(mensaje);
        
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Permisos de ubicación',
            mensaje,
            [{ text: 'Entendido', style: 'default' }]
          );
        }
        
        console.log('❌ Permisos de geolocalización denegados');
        return false;
      }
    } catch (err) {
      console.error('❌ Error al solicitar permisos:', err);
      setError('Error al solicitar permisos de ubicación');
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      console.log('📍 Obteniendo ubicación actual...');
      setIsLoading(true);
      setError(null);

      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      setCurrentLocation(locationData);
      console.log('✅ Ubicación obtenida:', locationData);
      
      return locationData;
    } catch (err) {
      console.error('❌ Error al obtener ubicación:', err);
      setError('Error al obtener la ubicación');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermission]);

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      console.log('📍 Estado actual de permisos:', granted);
      return granted;
    } catch (err) {
      console.error('❌ Error al verificar permisos:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('📍 GeolocationProvider inicializando...');
    checkPermissions();
  }, [checkPermissions]);

  return useMemo(() => ({
    hasPermission,
    currentLocation,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    checkPermissions,
  }), [
    hasPermission,
    currentLocation,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
    checkPermissions,
  ]);
});
