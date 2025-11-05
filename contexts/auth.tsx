import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE = 'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1';
const USER_ID_KEY = 'lpbe_user_id';
const JWT_TOKEN_KEY = 'lpbe_jwt_token';

interface LPBEUser {
  id: number;
  user_id?: number;
  username: string;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_photo?: string;
  photo?: string;
}

interface AuthState {
  user: LPBEUser | null;
  userId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

async function getStoredUserId(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(USER_ID_KEY);
  }
  return await SecureStore.getItemAsync(USER_ID_KEY);
}

async function setStoredUserId(userId: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
  }
}

async function deleteStoredUserId(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_ID_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_ID_KEY);
  }
}

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(JWT_TOKEN_KEY);
}

async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(JWT_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(JWT_TOKEN_KEY, token);
  }
}

async function deleteStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(JWT_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(JWT_TOKEN_KEY);
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userId: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = async () => {
    try {
      console.log('🔐 Iniciando checkAuth...');
      const userId = await getStoredUserId();
      console.log('🆔 UserId almacenado:', userId);

      const token = await getStoredToken();
      console.log('🔑 JWT Token almacenado:', token ? 'Existe' : 'No existe');

      if (!userId || !token) {
        console.log('❌ No hay userId o token, marcando como no autenticado');
        setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏱️ Timeout de auth check alcanzado');
        controller.abort();
      }, 3000);

      console.log('📡 Haciendo fetch a:', `${API_BASE}/user-profile?user_id=${userId}`);
      const response = await fetch(`${API_BASE}/user-profile?user_id=${userId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        console.log('❌ Response no OK, limpiando userId y token');
        await deleteStoredUserId();
        await deleteStoredToken();
        setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await response.json();
      console.log('✅ Usuario autenticado:', user.name);
      
      setState({ user, userId, token, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      if ((error as Error).name === 'AbortError') {
        console.log('⏱️ Auth check timed out - continuando sin autenticación');
      }
      setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
    } finally {
      console.log('✅ checkAuth completado');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 Autenticando con LPBE...');
      
      console.log('🧹 Limpiando caché completo antes de login...');
      if (Platform.OS === 'web') {
        localStorage.clear();
        sessionStorage.clear();
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
        await AsyncStorage.clear();
      }
      console.log('✅ AsyncStorage limpiado');
      
      try {
        const { QueryClient } = await import('@tanstack/react-query');
        const queryClient = new QueryClient();
        queryClient.clear();
        console.log('✅ React Query limpiado');
      } catch (qErr) {
        console.warn('⚠️ No se pudo limpiar React Query:', qErr);
      }
      
      const loginResponse = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password.trim(),
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}));
        console.error('❌ Error login:', errorData);
        return { 
          success: false, 
          error: errorData.message || 'Credenciales incorrectas' 
        };
      }

      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso:', loginData);

      if (!loginData.success || !loginData.user_id) {
        return { success: false, error: 'Respuesta del servidor inválida' };
      }

      console.log('📡 Obteniendo perfil completo del usuario...');
      const userResponse = await fetch(`${API_BASE}/user-profile?user_id=${loginData.user_id}`);

      if (!userResponse.ok) {
        console.error('❌ Error obteniendo perfil de usuario');
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      const user = await userResponse.json();

      if (!user.id || !user.username || !user.email || !user.name) {
        return { success: false, error: 'Datos de usuario incompletos' };
      }

      await setStoredUserId(user.id.toString());
      await setStoredToken(loginData.token || 'lpbe_authenticated');
      
      setState({ 
        user: { ...user, role: 'subscriber' }, 
        userId: user.id.toString(), 
        token: loginData.token || 'lpbe_authenticated',
        isLoading: false, 
        isAuthenticated: true 
      });

      console.log('✅ Login completado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Error al registrar usuario' };
      }

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      await deleteStoredUserId();
      await deleteStoredToken();
      
      const keysToDelete = ['um_token', 'lpbe_token', 'user_data', 'auth_token'];
      for (const key of keysToDelete) {
        try {
          if (Platform.OS === 'web') {
            localStorage.removeItem(key);
          } else {
            await SecureStore.deleteItemAsync(key);
          }
        } catch (e) {
          
        }
      }
      
      setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
      
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
      router.replace('/login');
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider montado, ejecutando checkAuth...');
    const initAuth = async () => {
      try {
        await checkAuth();
        console.log('✅ Autenticación inicializada');
      } catch (error) {
        console.error('❌ Error en inicialización de auth:', error);
        setState({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
      }
    };
    initAuth();
  }, []);

  const updateUser = (updates: Partial<LPBEUser>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  return {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
  };
});
