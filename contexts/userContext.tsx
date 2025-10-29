import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { umLogin, validateUserToken } from '@/services/api';
import { Usuario } from '@/types/api';

const USER_TOKEN_KEY = '@lpbe_user_token';
const USER_DATA_KEY = '@lpbe_user_data';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      console.log('[UserContext] Cargando usuario del storage...');
      const [storedToken, storedUserData] = await Promise.all([
        AsyncStorage.getItem(USER_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          console.log('[UserContext] Usuario encontrado en storage:', userData.display_name);
          
          if (!userData.id || typeof userData.id !== 'number') {
            console.log('[UserContext] Datos de usuario invalidos, limpiando sesion');
            throw new Error('Invalid user data');
          }
          
          console.log('[UserContext] Validando token...');
          const isValid = await validateUserToken(userData.id);
          
          if (isValid) {
            console.log('[UserContext] Token valido, restaurando sesion');
            setToken(storedToken);
            setUser(userData);
          } else {
            console.log('[UserContext] Token invalido, limpiando sesion');
            throw new Error('Invalid token');
          }
        } catch (validationError) {
          console.error('[UserContext] Error validando usuario:', validationError);
          await Promise.all([
            AsyncStorage.removeItem(USER_TOKEN_KEY),
            AsyncStorage.removeItem(USER_DATA_KEY),
          ]);
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('[UserContext] No hay sesion guardada');
      }
    } catch (error) {
      console.error('[UserContext] Error cargando usuario:', error);
      await Promise.all([
        AsyncStorage.removeItem(USER_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      setUser(null);
      setToken(null);
    } finally {
      console.log('[UserContext] Terminando carga inicial, isLoading = false');
      setIsLoading(false);
      
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 300);
    }
  };

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      setIsLoggingIn(true);
      console.log('[UserContext] Iniciando login...');

      const result = await umLogin(credentials.username, credentials.password);

      if (!result.success) {
        throw new Error(result.message);
      }

      const userData = result.user;
      const userToken = result.token || `lpbe_user_${userData.id}`;

      await Promise.all([
        AsyncStorage.setItem(USER_TOKEN_KEY, userToken),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData)),
      ]);

      setUser(userData);
      setToken(userToken);

      console.log('[UserContext] Login exitoso:', userData.display_name);
    } catch (error: any) {
      console.error('[UserContext] Error en login:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[UserContext] Cerrando sesion...');

      await Promise.all([
        AsyncStorage.removeItem(USER_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);

      setUser(null);
      setToken(null);

      console.log('[UserContext] Sesion cerrada, redirigiendo a login...');
      
      router.replace('/login');
    } catch (error) {
      console.error('[UserContext] Error cerrando sesion:', error);
    }
  }, []);

  return useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      isLoggingIn,
      login,
      logout,
    }),
    [user, token, isLoading, isLoggingIn, login, logout]
  );
});
