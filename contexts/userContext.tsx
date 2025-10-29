import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { umLogin } from '@/services/api';
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
      console.log('🔍 Cargando usuario del storage...');
      const [storedToken, storedUserData] = await Promise.all([
        AsyncStorage.getItem(USER_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (storedToken && storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log('✅ Usuario cargado:', userData.display_name);
        setToken(storedToken);
        setUser(userData);
      } else {
        console.log('📝 No hay sesión guardada');
      }
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      setIsLoggingIn(true);
      console.log('🔐 Iniciando login...');

      const result = await umLogin(username, password);

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

      console.log('✅ Login exitoso, redirigiendo a perfil...');
      
      setTimeout(() => {
        router.push('/perfil');
      }, 100);
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Cerrando sesión...');

      await Promise.all([
        AsyncStorage.removeItem(USER_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);

      setUser(null);
      setToken(null);

      console.log('✅ Sesión cerrada');
      
      router.replace('/login');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
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
