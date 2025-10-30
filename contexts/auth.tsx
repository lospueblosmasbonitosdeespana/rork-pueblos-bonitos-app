import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE = 'https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1';
const USER_ID_KEY = 'lpbe_user_id';

interface LPBEUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: LPBEUser | null;
  userId: string | null;
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

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    userId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const userId = await getStoredUserId();

      if (!userId) {
        setState({ user: null, userId: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await fetch(`${API_BASE}/user/${userId}`);

      if (!response.ok) {
        await deleteStoredUserId();
        setState({ user: null, userId: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await response.json();
      setState({ user, userId, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error('Error checking auth:', error);
      await deleteStoredUserId();
      setState({ user: null, userId: null, isLoading: false, isAuthenticated: false });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || 'Credenciales incorrectas o usuario no válido' 
        };
      }

      const user = await response.json();

      if (!user.id || !user.username || !user.email || !user.name || !user.role) {
        return { success: false, error: 'Respuesta del servidor inválida' };
      }

      await setStoredUserId(user.id.toString());
      setState({ user, userId: user.id.toString(), isLoading: false, isAuthenticated: true });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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
      setState({ user: null, userId: null, isLoading: false, isAuthenticated: false });
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    checkAuth,
  };
});
