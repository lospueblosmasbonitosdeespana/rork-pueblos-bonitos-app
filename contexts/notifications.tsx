import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const TOKEN_STORAGE_KEY = '@lpbe_expo_push_token';
const LAST_NOTIFICATION_ID_KEY = '@lpbe_last_notification_id';

interface Notificacion {
  id: number;
  tipo: 'noticia' | 'alerta' | 'semaforo' | 'nieve';
  titulo: string;
  mensaje: string;
  enlace: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function mapTipo(tipo: string): 'noticia' | 'alerta' | 'semaforo' | 'nieve' {
  const normalized = tipo.toLowerCase();
  if (normalized.includes('noticia') || normalized.includes('news')) return 'noticia';
  if (normalized.includes('semaforo') || normalized.includes('traffic')) return 'semaforo';
  if (normalized.includes('nieve') || normalized.includes('snow')) return 'nieve';
  if (normalized.includes('alerta') || normalized.includes('alert')) return 'alerta';
  return 'noticia';
}

function getDemoNotifications(): Notificacion[] {
  return [
    {
      id: 1,
      tipo: 'noticia',
      titulo: 'Bienvenido a la App',
      mensaje: 'Descubre los pueblos más bonitos de España. El sistema de notificaciones está configurado correctamente.',
      enlace: '',
    },
    {
      id: 2,
      tipo: 'semaforo',
      titulo: 'Estado de pueblos',
      mensaje: 'Sistema de semáforos activo. Los estados de los pueblos se actualizarán automáticamente.',
      enlace: '',
    },
    {
      id: 3,
      tipo: 'alerta',
      titulo: 'Configuración del servidor',
      mensaje: 'El endpoint de notificaciones se está configurando. Estas son notificaciones de ejemplo.',
      enlace: '',
    },
  ];
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('⚠️ Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission not granted for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '1ff361y9lgfnohgh4dp97';
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    
    console.log('✅ Expo Push Token:', token.data);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const notificacionesQuery = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      try {
        console.log('📡 Intentando obtener notificaciones desde el endpoint actualizado...');
        
        const response = await fetch(
          'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/notificaciones',
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        console.log('📡 Estado respuesta:', response.status);
        
        if (!response.ok) {
          console.warn('⚠️ Endpoint de notificaciones no disponible, usando datos de ejemplo');
          return getDemoNotifications();
        }
        
        const data = await response.json();
        console.log('✅ Notificaciones obtenidas:', data);
        
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            id: item.id || Math.random(),
            tipo: mapTipo(item.tipo || 'noticia'),
            titulo: item.titulo || '',
            mensaje: item.mensaje || '',
            enlace: item.enlace || '',
          }));
          mapped.sort((a, b) => b.id - a.id);
          return mapped;
        }
        
        console.warn('⚠️ Respuesta no es array, usando datos de ejemplo');
        return getDemoNotifications();
      } catch (error) {
        console.error('❌ Error obteniendo notificaciones:', error);
        console.log('💡 Usando notificaciones de demostración');
        return getDemoNotifications();
      }
    },
    retry: 1,
    retryDelay: 2000,
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const registerTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const deviceName = Device.deviceName || Constants.deviceName || 'Unknown Device';
      const deviceId = Constants.sessionId || 'unknown';

      console.log('📤 Registering token with server:', token);

      const response = await fetch(
        'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/register-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            device: deviceName,
            user: deviceId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to register token');
      }

      const result = await response.json();
      console.log('✅ Token registered successfully:', result);
      return result;
    },
    onSuccess: async (_, token) => {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      console.log('💾 Token stored locally');
    },
  });

  const { mutate: registerToken } = registerTokenMutation;

  useEffect(() => {
    let isMounted = true;

    async function setupPushNotifications() {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (storedToken && isMounted) {
        console.log('📱 Using stored token:', storedToken);
        setExpoPushToken(storedToken);
        return;
      }

      const token = await registerForPushNotificationsAsync();
      
      if (token && isMounted) {
        setExpoPushToken(token);
        registerToken(token);
      }
    }

    setupPushNotifications();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      isMounted = false;
      notificationListener.remove();
      responseListener.remove();
    };
  }, [queryClient, registerToken]);

  useEffect(() => {
    async function loadLastNotificationId() {
      const stored = await AsyncStorage.getItem(LAST_NOTIFICATION_ID_KEY);
      if (stored) {
        setLastNotificationId(stored);
      }
    }
    loadLastNotificationId();
  }, []);

  const unreadCount = useMemo(() => {
    if (!notificacionesQuery.data || notificacionesQuery.data.length === 0) {
      return 0;
    }

    if (!lastNotificationId) {
      return notificacionesQuery.data.length;
    }

    const lastIndex = notificacionesQuery.data.findIndex(n => String(n.id) === lastNotificationId);
    
    if (lastIndex === -1) {
      return notificacionesQuery.data.length;
    }

    return lastIndex;
  }, [notificacionesQuery.data, lastNotificationId]);

  const markAllAsRead = useCallback(async () => {
    if (notificacionesQuery.data && notificacionesQuery.data.length > 0) {
      const latestId = String(notificacionesQuery.data[0].id);
      setLastNotificationId(latestId);
      await AsyncStorage.setItem(LAST_NOTIFICATION_ID_KEY, latestId);
      console.log('✅ All notifications marked as read');
    }
  }, [notificacionesQuery.data]);

  const refreshNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
  }, [queryClient]);

  return useMemo(() => ({
    expoPushToken,
    notificaciones: notificacionesQuery.data ?? [],
    isLoading: notificacionesQuery.isLoading,
    error: notificacionesQuery.error,
    unreadCount,
    markAllAsRead,
    refreshNotifications,
  }), [
    expoPushToken,
    notificacionesQuery.data,
    notificacionesQuery.isLoading,
    notificacionesQuery.error,
    unreadCount,
    markAllAsRead,
    refreshNotifications,
  ]);
});
