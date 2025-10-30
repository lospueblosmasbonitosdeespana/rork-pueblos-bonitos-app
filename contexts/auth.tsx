import createContextHook from '@nkzw/create-context-hook';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE = 'https://lospueblosmasbonitosdeespana.org/wp-json/um/v2';
const TOKEN_KEY = 'um_token';

interface UMUser {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface AuthState {
  user: UMUser | null;
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

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function deleteStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const token = await getStoredToken();

      if (!token) {
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        await deleteStoredToken();
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await response.json();
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch (error) {
      console.error('Error checking auth:', error);
      await deleteStoredToken();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const loginValue = credentials.username.trim();
      const passwordValue = credentials.password.trim();

      const attempts = [
        { username: loginValue, password: passwordValue },
        { user_login: loginValue, user_password: passwordValue },
      ];

      let token: string | null = null;
      let lastError = 'Credenciales incorrectas o usuario no válido';

      for (const body of attempts) {
        try {
          const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            const data = await response.json();
            token = data.token || data.access_token || data.data?.token;
            
            if (token) {
              break;
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.message || lastError;
          }
        } catch (err) {
          console.log('Login attempt failed:', err);
        }
      }

      if (!token) {
        return { success: false, error: lastError };
      }

      await setStoredToken(token);

      const userResponse = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        await deleteStoredToken();
        return { success: false, error: 'Error al obtener datos del usuario' };
      }

      const user = await userResponse.json();
      setState({ user, token, isLoading: false, isAuthenticated: true });

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
      if (state.token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await deleteStoredToken();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      router.replace('/login');
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
