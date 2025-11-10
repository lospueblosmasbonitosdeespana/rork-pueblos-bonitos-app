import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { fetchLugaresStable, registrarVisita } from '@/services/api';
import type { Lugar } from '@/types/api';
import { useAuth } from './auth';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface PueblosSaludados {
  [puebloId: string]: string;
}

const STORAGE_KEY = 'pueblosSaludados';
const COOLDOWN_HOURS = 24;

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
  const { isAuthenticated, userId, token } = useAuth();
  
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
      if (!isAuthenticated) {
        console.log('⚠️ Usuario no autenticado, no se solicitarán permisos');
        return false;
      }

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
  }, [isAuthenticated]);

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

  const getPueblosSaludados = useCallback(async (): Promise<PueblosSaludados> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      return JSON.parse(data) as PueblosSaludados;
    } catch (err) {
      console.error('❌ Error al leer pueblos saludados:', err);
      return {};
    }
  }, []);

  const setPuebloSaludado = useCallback(async (puebloId: string) => {
    try {
      const saludados = await getPueblosSaludados();
      saludados[puebloId] = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saludados));
      console.log(`✅ Pueblo ${puebloId} guardado en AsyncStorage`);
    } catch (err) {
      console.error('❌ Error al guardar pueblo saludado:', err);
    }
  }, [getPueblosSaludados]);

  const canShowNotification = useCallback(async (puebloId: string): Promise<boolean> => {
    try {
      const saludados = await getPueblosSaludados();
      const lastGreeted = saludados[puebloId];

      if (!lastGreeted) {
        return true;
      }

      const lastGreetedDate = new Date(lastGreeted);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastGreetedDate.getTime()) / (1000 * 60 * 60);

      const canShow = hoursDiff >= COOLDOWN_HOURS;
      
      if (!canShow) {
        console.log(`⏳ Pueblo ${puebloId} ya saludado hace ${hoursDiff.toFixed(1)} horas (cooldown: ${COOLDOWN_HOURS}h)`);
      }

      return canShow;
    } catch (err) {
      console.error('❌ Error al verificar cooldown:', err);
      return true;
    }
  }, [getPueblosSaludados]);

  const checkNearbyPueblos = useCallback(async (location: LocationData) => {
    try {
      if (!isAuthenticated || !userId) {
        return;
      }

      if (pueblos.length === 0) {
        return;
      }

      if (!hasNotificationPermission) {
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

        if (distance <= 2) {
          if (notifiedPueblosRef.current.has(pueblo._ID)) {
            continue;
          }

          const canNotify = await canShowNotification(pueblo._ID);
          if (!canNotify) {
            continue;
          }

          console.log(`🔔 Usuario cerca de ${pueblo.nombre} (${distance.toFixed(2)} km), enviando notificación`);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Bienvenido a ${pueblo.nombre}`,
              body: 'uno de los Pueblos Más Bonitos de España. ¡Disfruta de tu visita!',
              sound: true,
            },
            trigger: null,
          });

          notifiedPueblosRef.current.add(pueblo._ID);
          await setPuebloSaludado(pueblo._ID);
          console.log(`✅ Notificación enviada para ${pueblo.nombre}`);
          
          try {
            const API_BASE_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json';
            const visitasUrl = `${API_BASE_URL}/jet-cct/visita?user_id=${userId}`;
            
            console.log('🔍 Verificando visitas previas del usuario...');
            const visitasResponse = await fetch(visitasUrl);
            
            if (visitasResponse.ok) {
              const visitasData = await visitasResponse.json();
              const yaVisitado = Array.isArray(visitasData) && visitasData.some(
                (v: any) => String(v.id_lugar) === String(pueblo._ID)
              );
              
              if (yaVisitado) {
                console.log(`⏭️ Usuario ya visitó ${pueblo.nombre} previamente, no se registra de nuevo`);
                continue;
              }
              
              console.log(`📍 Registrando visita automática (geo) para ${pueblo.nombre}...`);
              const result = await registrarVisita(pueblo._ID, token || undefined, 'geo');
              
              if (result.success) {
                console.log(`✅ Visita registrada automáticamente (geo) para ${pueblo.nombre} - ${userId}`);
              } else {
                console.error(`❌ Error al registrar visita para ${pueblo.nombre}:`, result.message);
              }
            } else {
              console.warn(`⚠️ No se pudo verificar visitas previas (status ${visitasResponse.status}), se intentará registrar`);
              
              console.log(`📍 Registrando visita automática (geo) para ${pueblo.nombre}...`);
              const result = await registrarVisita(pueblo._ID, token || undefined, 'geo');
              
              if (result.success) {
                console.log(`✅ Visita registrada automáticamente (geo) para ${pueblo.nombre} - ${userId}`);
              } else {
                console.error(`❌ Error al registrar visita para ${pueblo.nombre}:`, result.message);
              }
            }
          } catch (visitError) {
            console.error(`❌ Error al procesar visita para ${pueblo.nombre}:`, visitError);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error al verificar pueblos cercanos:', err);
    }
  }, [isAuthenticated, userId, token, pueblos, hasNotificationPermission, canShowNotification, setPuebloSaludado]);

  const startLocationTracking = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        console.log('⚠️ Usuario no autenticado, no se iniciará el seguimiento');
        return;
      }

      if (!hasPermission) {
        console.log('⚠️ Sin permisos de ubicación');
        const mensaje = 'La detección por geolocalización está desactivada. Actívala para registrar tus visitas automáticamente.';
        setError(mensaje);
        return;
      }

      if (locationSubscriptionRef.current) {
        return;
      }

      console.log('📍 Iniciando seguimiento de ubicación');

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
          checkNearbyPueblos(locationData);
        }
      );

      console.log('✅ Seguimiento activo');
    } catch (err) {
      console.error('❌ Error al iniciar seguimiento:', err);
    }
  }, [isAuthenticated, hasPermission, checkNearbyPueblos]);

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
      if (!isAuthenticated) {
        return false;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        const mensaje = 'La detección por geolocalización está desactivada. Actívala para registrar tus visitas automáticamente.';
        setError(mensaje);
      }
      
      return granted;
    } catch (err) {
      console.error('❌ Error al verificar permisos:', err);
      return false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ Usuario no autenticado, servicio de geolocalización desactivado');
      stopLocationTracking();
      return;
    }

    console.log('📍 GeolocationProvider inicializando');
    checkPermissions();
    requestNotificationPermission();

    const loadPueblos = async () => {
      try {
        const lugaresData = await fetchLugaresStable();
        setPueblos(lugaresData);
        console.log(`✅ ${lugaresData.length} pueblos cargados`);
      } catch (err) {
        console.error('❌ Error cargando pueblos:', err);
      }
    };

    loadPueblos();
  }, [isAuthenticated, checkPermissions, requestNotificationPermission, stopLocationTracking]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (hasPermission && hasNotificationPermission && pueblos.length > 0) {
      console.log('✅ Iniciando seguimiento de ubicación');
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isAuthenticated, hasPermission, hasNotificationPermission, pueblos.length, startLocationTracking, stopLocationTracking]);

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
