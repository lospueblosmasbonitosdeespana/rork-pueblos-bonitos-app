import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/constants/api';
import { umLogin, umRegister } from '@/services/api';
import { Usuario } from '@/types/api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  nombre: string;
  email: string;
  password: string;
}

const USER_TOKEN_KEY = '@lpbe_user_token';
const USER_DATA_KEY = '@lpbe_user_data';

export const [UserProvider, useUser] = createContextHook(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const userQuery = useQuery<Usuario | null>({
    queryKey: ['userData'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    },
    staleTime: Infinity,
  });

  const tokenQuery = useQuery<string | null>({
    queryKey: ['userToken'],
    queryFn: async () => {
      const storedToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
      return storedToken;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isInitialized) return;
    if (!userQuery.isSuccess || !tokenQuery.isSuccess) return;
    
    let mounted = true;
    const token = tokenQuery.data;
    const user = userQuery.data;
    
    console.log('🔍 UserContext - Iniciando validación:', { hasToken: !!token, hasUser: !!user });
    
    async function validateToken() {
      if (!mounted) return;
      
      if (token && user) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(`${API_BASE_URL}/wp/v2/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!mounted) return;
          
          console.log('🔍 Token validation status:', response.status);
          
          if (!response.ok) {
            console.log('❌ Token inválido, limpiando sesión...');
            await AsyncStorage.removeItem(USER_TOKEN_KEY);
            await AsyncStorage.removeItem(USER_DATA_KEY);
            queryClient.setQueryData(['userToken'], null);
            queryClient.setQueryData(['userData'], null);
          } else {
            console.log('✅ Token válido');
          }
        } catch (error: any) {
          if (!mounted) return;
          
          if (error.name === 'AbortError') {
            console.error('❌ Timeout validando token, limpiando sesión...');
          } else {
            console.error('❌ Error validando token:', error.message);
          }
          
          await AsyncStorage.removeItem(USER_TOKEN_KEY);
          await AsyncStorage.removeItem(USER_DATA_KEY);
          queryClient.setQueryData(['userToken'], null);
          queryClient.setQueryData(['userData'], null);
        }
      } else {
        console.log('📝 No hay sesión guardada');
      }
      
      if (mounted) {
        setIsInitialized(true);
      }
    }
    
    validateToken();
    
    return () => {
      mounted = false;
    };
  }, [userQuery.isSuccess, tokenQuery.isSuccess]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await umLogin(credentials.username, credentials.password);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        user: result.user,
        token: result.token || '',
      };
    },
    onSuccess: async (data) => {
      await AsyncStorage.setItem(USER_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['userToken'], data.token);
      queryClient.setQueryData(['userData'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const result = await umRegister(
        credentials.nombre,
        credentials.email,
        credentials.password
      );
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        user: result.user,
        token: result.token || '',
      };
    },
    onSuccess: async (data) => {
      await AsyncStorage.setItem(USER_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['userToken'], data.token);
      queryClient.setQueryData(['userData'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('🧹 Limpiando storage...');
      await AsyncStorage.removeItem(USER_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      console.log('✅ Storage limpiado');
    },
    onSuccess: () => {
      console.log('📦 Limpiando queries...');
      queryClient.setQueryData(['userToken'], null);
      queryClient.setQueryData(['userData'], null);
      queryClient.clear();
      console.log('✅ Queries limpiadas');
    },
  });

  const { mutateAsync: loginAsync } = loginMutation;
  const { mutateAsync: registerAsync } = registerMutation;
  const { mutateAsync: logoutAsync } = logoutMutation;

  const login = useCallback((credentials: LoginCredentials) => {
    return loginAsync(credentials);
  }, [loginAsync]);

  const register = useCallback((credentials: RegisterCredentials) => {
    return registerAsync(credentials);
  }, [registerAsync]);

  const logout = useCallback(async () => {
    console.log('🚪 Cerrando sesión...');
    setIsInitialized(false);
    await logoutAsync();
    setIsInitialized(true);
    console.log('✅ Sesión cerrada correctamente');
  }, [logoutAsync]);

  const forceLogout = useCallback(async () => {
    console.log('🚨 Forzando cierre de sesión...');
    setIsInitialized(false);
    await AsyncStorage.removeItem(USER_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    queryClient.setQueryData(['userToken'], null);
    queryClient.setQueryData(['userData'], null);
    queryClient.clear();
    setIsInitialized(true);
  }, [queryClient]);

  return useMemo(() => ({
    user: userQuery.data ?? null,
    token: tokenQuery.data ?? null,
    isAuthenticated: !!userQuery.data && !!tokenQuery.data,
    isLoading: !isInitialized || userQuery.isLoading || tokenQuery.isLoading,
    login,
    register,
    logout,
    forceLogout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }), [
    userQuery.data,
    tokenQuery.data,
    isInitialized,
    userQuery.isLoading,
    tokenQuery.isLoading,
    login,
    register,
    logout,
    forceLogout,
    loginMutation.isPending,
    registerMutation.isPending,
    loginMutation.error,
    registerMutation.error,
  ]);
});
