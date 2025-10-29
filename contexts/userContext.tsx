import createContextHook from '@nkzw/create-context-hook';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/api';
import { Usuario } from '@/types/api';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('[UserContext] Verificando sesión con WordPress...');
      
      const response = await fetch(`${API_BASE_URL}/wp/v2/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[UserContext] Sesión activa encontrada:', userData.name);
        
        const mappedUser: Usuario = {
          id: userData.id,
          username: userData.slug || userData.username || '',
          email: userData.email || '',
          display_name: userData.name || '',
          roles: userData.roles || ['subscriber'],
        };
        
        setUser(mappedUser);
      } else if (response.status === 401) {
        console.log('[UserContext] No hay sesión activa');
        setUser(null);
      } else {
        console.log('[UserContext] Error verificando sesión:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('[UserContext] Error verificando sesión:', error);
      setUser(null);
    } finally {
      console.log('[UserContext] Verificación completada, isLoading = false');
      setIsLoading(false);
      
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 300);
    }
  };

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      setIsLoggingIn(true);
      console.log('[UserContext] Iniciando login con Ultimate Member...');

      const formData = new FormData();
      formData.append('log', credentials.username);
      formData.append('pwd', credentials.password);
      formData.append('wp-submit', 'Log In');
      formData.append('redirect_to', 'https://lospueblosmasbonitosdeespana.org/account/');
      formData.append('testcookie', '1');

      const loginResponse = await fetch('https://lospueblosmasbonitosdeespana.org/wp-login.php', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        redirect: 'manual',
      });

      console.log('[UserContext] Login response status:', loginResponse.status);

      const isLoginSuccess = loginResponse.status === 200 || loginResponse.status === 302;

      if (!isLoginSuccess) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      console.log('[UserContext] Login exitoso, verificando usuario...');

      const userResponse = await fetch(`${API_BASE_URL}/wp/v2/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('No se pudo verificar la sesión');
      }

      const userData = await userResponse.json();
      console.log('[UserContext] Usuario verificado:', userData.name);

      const mappedUser: Usuario = {
        id: userData.id,
        username: userData.slug || userData.username || '',
        email: userData.email || '',
        display_name: userData.name || '',
        roles: userData.roles || ['subscriber'],
      };

      setUser(mappedUser);
      console.log('[UserContext] Login completado exitosamente');
    } catch (error: any) {
      console.error('[UserContext] Error en login:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[UserContext] Cerrando sesión...');

      await fetch('https://lospueblosmasbonitosdeespana.org/wp-login.php?action=logout', {
        method: 'GET',
        credentials: 'include',
        redirect: 'manual',
      });

      setUser(null);

      console.log('[UserContext] Sesión cerrada, redirigiendo a login...');
      router.replace('/login');
    } catch (error) {
      console.error('[UserContext] Error cerrando sesión:', error);
      setUser(null);
      router.replace('/login');
    }
  }, []);

  return useMemo(
    () => ({
      user,
      token: null,
      isAuthenticated: !!user,
      isLoading,
      isLoggingIn,
      login,
      logout,
    }),
    [user, isLoading, isLoggingIn, login, logout]
  );
});
