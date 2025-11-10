import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { fetchLugaresStable } from '@/services/api';
import type { Lugar } from '@/types/api';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const [GeolocationProvider, useGeolocation] = createContextHook(() => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pueblos, setPueblos] = useState<Lugar[]>([]);
  const notifiedPueblosRef = useRef<Set<string>>(new Set());
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

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

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔔 Solicitando permisos de notificaciones...');
      
      if (Platform.OS === 'web') {
        console.log('⚠️ Notificaciones no disponibles en web');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setHasNotificationPermission(granted);
      console.log('🔔 Estado de permisos de notificaciones:', granted);
      
      return granted;
    } catch (err) {
      console.error('❌ Error al solicitar permisos de notificaciones:', err);
      return false;
    }
  }, []);

  const checkNearbyPueblos = useCallback(async (location: LocationData) => {
    try {
      if (pueblos.length === 0) {
        console.log('⚠️ No hay pueblos cargados aún');
        return;
      }

      if (!hasNotificationPermission) {
        console.log('⚠️ Sin permisos de notificaciones');
        return;
      }

      for (const pueblo of pueblos) {
        if (!pueblo.lat || !pueblo.lng) continue;

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          pueblo.lat,
          pueblo.lng
        );

        console.log(`📍 Distancia a ${pueblo.nombre}: ${distance.toFixed(2)} km`);

        if (distance <= 2 && !notifiedPueblosRef.current.has(pueblo._ID)) {
          console.log(`🔔 Usuario cerca de ${pueblo.nombre}, enviando notificación...`);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Bienvenido a ${pueblo.nombre}`,
              body: 'uno de los Pueblos Más Bonitos de España. ¡Disfruta de tu visita!',
              sound: true,
            },
            trigger: null,
          });

          notifiedPueblosRef.current.add(pueblo._ID);
          console.log(`✅ Notificación enviada para ${pueblo.nombre}`);
        }
      }
    } catch (err) {
      console.error('❌ Error al verificar pueblos cercanos:', err);
    }
  }, [pueblos, hasNotificationPermission]);

  const startLocationTracking = useCallback(async () => {
    try {
      if (!hasPermission) {
        console.log('⚠️ Sin permisos de ubicación, no se puede iniciar el seguimiento');
        return;
      }

      if (locationSubscriptionRef.current) {
        console.log('⚠️ El seguimiento de ubicación ya está activo');
        return;
      }

      console.log('📍 Iniciando seguimiento de ubicación...');

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100,
          timeInterval: 30000,
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          setCurrentLocation(locationData);
          console.log('📍 Ubicación actualizada:', locationData);

          checkNearbyPueblos(locationData);
        }
      );

      console.log('✅ Seguimiento de ubicación iniciado');
    } catch (err) {
      console.error('❌ Error al iniciar seguimiento de ubicación:', err);
    }
  }, [hasPermission, checkNearbyPueblos]);

  const stopLocationTracking = useCallback(async () => {
    try {
      if (locationSubscriptionRef.current) {
        await locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
        console.log('✅ Seguimiento de ubicación detenido');
      }
    } catch (err) {
      console.error('❌ Error al detener seguimiento de ubicación:', err);
    }
  }, []);

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
    requestNotificationPermission();

    const loadPueblos = async () => {
      try {
        console.log('🏘️ Cargando lista de pueblos...');
        const lugaresData = await fetchLugaresStable();
        setPueblos(lugaresData);
        console.log(`✅ ${lugaresData.length} pueblos cargados`);
      } catch (err) {
        console.error('❌ Error cargando pueblos:', err);
      }
    };

    loadPueblos();
  }, [checkPermissions, requestNotificationPermission]);

  useEffect(() => {
    if (hasPermission && hasNotificationPermission && pueblos.length > 0) {
      console.log('✅ Condiciones cumplidas, iniciando seguimiento de ubicación');
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [hasPermission, hasNotificationPermission, pueblos.length, startLocationTracking, stopLocationTracking]);

  return useMemo(() => ({
    hasPermission,
    hasNotificationPermission,
    currentLocation,
    isLoading,
    error,
    requestPermission,
    requestNotificationPermission,
    getCurrentLocation,
    checkPermissions,
    startLocationTracking,
    stopLocationTracking,
  }), [
    hasPermission,
    hasNotificationPermission,
    currentLocation,
    isLoading,
    error,
    requestPermission,
    requestNotificationPermission,
    getCurrentLocation,
    checkPermissions,
    startLocationTracking,
    stopLocationTracking,
  ]);
});
