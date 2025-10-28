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
  _ID: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  tipo: 'push' | 'silenciosa' | 'semaforo';
  post_id?: string;
  leida?: boolean;
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
        const response = await fetch(
          'https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/notificaciones'
        );
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        return [];
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
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

    const lastIndex = notificacionesQuery.data.findIndex(n => n._ID === lastNotificationId);
    
    if (lastIndex === -1) {
      return notificacionesQuery.data.length;
    }

    return lastIndex;
  }, [notificacionesQuery.data, lastNotificationId]);

  const markAllAsRead = useCallback(async () => {
    if (notificacionesQuery.data && notificacionesQuery.data.length > 0) {
      const latestId = notificacionesQuery.data[0]._ID;
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
