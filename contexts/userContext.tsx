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
  const [isValidating, setIsValidating] = useState(false);
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
    let mounted = true;
    
    async function validateToken() {
      if (isInitialized || !mounted) return;
      
      if (userQuery.isSuccess && tokenQuery.isSuccess) {
        const token = tokenQuery.data;
        const user = userQuery.data;
        
        console.log('🔍 UserContext - Validando sesión:', { hasToken: !!token, hasUser: !!user });
        
        if (token && user) {
          if (!mounted) return;
          setIsValidating(true);
          
          try {
            const response = await fetch(`${API_BASE_URL}/wp/v2/users/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
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
            console.error('❌ Error validando token:', error.message);
            await AsyncStorage.removeItem(USER_TOKEN_KEY);
            await AsyncStorage.removeItem(USER_DATA_KEY);
            queryClient.setQueryData(['userToken'], null);
            queryClient.setQueryData(['userData'], null);
          } finally {
            if (!mounted) return;
            setIsValidating(false);
            setIsInitialized(true);
          }
        } else {
          if (!mounted) return;
          console.log('📝 No hay sesión guardada');
          setIsInitialized(true);
        }
      }
    }
    
    validateToken();
    
    return () => {
      mounted = false;
    };
  }, [isInitialized, userQuery.isSuccess, tokenQuery.isSuccess, userQuery.data, tokenQuery.data, queryClient]);

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
      await AsyncStorage.removeItem(USER_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    },
    onSuccess: () => {
      queryClient.setQueryData(['userToken'], null);
      queryClient.setQueryData(['userData'], null);
      queryClient.clear();
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

  const logout = useCallback(() => {
    return logoutAsync();
  }, [logoutAsync]);

  return useMemo(() => ({
    user: userQuery.data ?? null,
    token: tokenQuery.data ?? null,
    isAuthenticated: !!userQuery.data && !!tokenQuery.data,
    isLoading: !isInitialized || userQuery.isLoading || tokenQuery.isLoading || isValidating,
    login,
    register,
    logout,
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
    isValidating,
    login,
    register,
    logout,
    loginMutation.isPending,
    registerMutation.isPending,
    loginMutation.error,
    registerMutation.error,
  ]);
});
