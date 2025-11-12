import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { Notificacion } from '@/types/api';

const TOKEN_STORAGE_KEY = '@lpbe_expo_push_token';
const LAST_NOTIFICATION_ID_KEY = '@lpbe_last_notification_id';

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
  if (Platform.OS === 'web') {
    console.log('⚠️ Push notifications are not supported on web');
    return null;
  }

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

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
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
  } catch (error: any) {
    if (error?.message?.includes('503') || error?.message?.includes('no healthy upstream')) {
      console.warn('⚠️ Expo push service temporarily unavailable. Will retry later.');
    } else {
      console.error('❌ Error registering for push notifications:', error);
    }
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
        const response = await fetch(
          'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/notificaciones'
        );
        
        if (!response.ok) {
          console.log('⚠️ Notificaciones endpoint returned status:', response.status);
          return getDemoNotifications();
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            tipo: mapTipo(item.tipo),
            titulo: item.titulo,
            mensaje: item.mensaje,
            enlace: item.enlace,
            motivo: item.motivo,
          }));
          mapped.sort((a, b) => b.id - a.id);
          return mapped;
        }
        
        return getDemoNotifications();
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
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
        console.log('⚠️ Register token failed with status:', response.status);
        throw new Error('Failed to register token');
      }

      return await response.json();
    },
    onSuccess: async (_, token) => {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    },
  });

  const { mutate: registerToken } = registerTokenMutation;

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    async function setupPushNotifications() {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (storedToken && isMounted) {
        setExpoPushToken(storedToken);
        return;
      }

      const token = await registerForPushNotificationsAsync();
      
      if (token && isMounted) {
        setExpoPushToken(token);
        registerToken(token);
      } else if (!token && isMounted) {
        console.log('⏳ Will retry push notification registration in 30 seconds...');
        retryTimeout = setTimeout(() => {
          if (isMounted) {
            setupPushNotifications();
          }
        }, 30000);
      }
    }

    setupPushNotifications();

    const notificationListener = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      
      console.log('📬 Notificación tocada - Payload completo:', JSON.stringify(data, null, 2));
      console.log('📬 data.tipo:', data?.tipo);
      console.log('📬 data.id:', data?.id);
      console.log('📬 data.post_id:', data?.post_id);
      console.log('📬 data.slug:', data?.slug);
      console.log('📬 data.link:', data?.link);
      console.log('📬 data.url:', data?.url);
      
      if (data?.url) {
        console.log('🌐 Abriendo URL externa:', data.url);
        try {
          if (Platform.OS === 'web') {
            window.open(data.url, '_blank');
          } else {
            await WebBrowser.openBrowserAsync(data.url);
          }
        } catch (error) {
          console.error('❌ Error al abrir URL:', error);
          Linking.openURL(data.url).catch(err => 
            console.error('❌ Error con Linking.openURL:', err)
          );
        }
        return;
      }
      
      if (data?.post_id) {
        console.log('🚀 Navegando a /noticia/' + data.post_id + ' (usando post_id)');
        router.push(`/noticia/${data.post_id}`);
        return;
      }
      
      if ((data?.tipo === 'noticia' || data?.tipo === 'alerta')) {
        let slugToUse = null;
        
        if (data?.slug) {
          slugToUse = data.slug;
          console.log('✅ Usando slug directo:', slugToUse);
        } else if (data?.link) {
          const parts = data.link.split('/').filter((s: string) => s);
          slugToUse = parts[parts.length - 1];
          console.log('✅ Slug extraído del link:', slugToUse);
        }
        
        if (slugToUse) {
          console.log('🚀 Navegando a /noticia/' + slugToUse);
          router.push(`/noticia/${slugToUse}`);
        } else {
          console.warn('⚠️ Notificación sin slug ni link válido. Data completo:', JSON.stringify(data));
        }
      } else {
        console.log('📬 Notificación de tipo', data?.tipo || 'desconocido', '- no requiere navegación');
      }
    });

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
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
