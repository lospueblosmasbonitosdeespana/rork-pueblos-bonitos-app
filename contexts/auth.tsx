import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthResponse, Usuario } from '@/types/api';

interface LoginCredentials {
  username: string;
  password: string;
}

const AUTH_TOKEN_KEY = '@lpbe_auth_token';
const AUTH_USER_KEY = '@lpbe_auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const userQuery = useQuery<Usuario | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    },
    staleTime: Infinity,
  });

  const tokenQuery = useQuery<string | null>({
    queryKey: ['authToken'],
    queryFn: async () => {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return storedToken;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (userQuery.isSuccess && tokenQuery.isSuccess) {
      setIsInitialized(true);
    }
  }, [userQuery.isSuccess, tokenQuery.isSuccess]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const loginUrl = 'https://lospueblosmasbonitosdeespana.org/wp-login.php';

      try {
        console.log('🔑 Attempting login with WordPress classic form');
        console.log('🌐 URL:', loginUrl);
        console.log('📝 Username:', credentials.username);

        const formData = new FormData();
        formData.append('log', credentials.username);
        formData.append('pwd', credentials.password);
        formData.append('redirect_to', 'https://lospueblosmasbonitosdeespana.org/account-2/');
        formData.append('wp-submit', 'Log In');
        formData.append('testcookie', '1');

        const response = await fetch(loginUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          redirect: 'manual',
        });

        console.log('📡 Response status:', response.status);
        const responseText = await response.text();
        console.log('📦 Response length:', responseText.length);

        const isSuccess = response.status === 200 || 
                         response.status === 302 || 
                         responseText.includes('Mi cuenta') || 
                         responseText.includes('account-2');

        if (!isSuccess) {
          console.error('❌ Login failed with status:', response.status);
          throw new Error('Usuario o contraseña incorrectos');
        }

        const authResponse: AuthResponse = {
          token: 'cookie-based-auth',
          user: {
            id: Date.now(),
            username: credentials.username,
            email: '',
            display_name: credentials.username,
            roles: ['subscriber'],
          },
        };
        
        console.log('✅ Login successful!');
        console.log('👤 User:', authResponse.user.username);
        return authResponse;
      } catch (error: any) {
        console.error('❌ Login error:', error.message);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log('💾 Storing auth data in AsyncStorage');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(['authToken'], data.token);
      queryClient.setQueryData(['currentUser'], data.user);
      console.log('✅ Auth data stored successfully');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('🚪 Logging out user');
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    },
    onSuccess: () => {
      queryClient.setQueryData(['authToken'], null);
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
      console.log('✅ Logout successful');
    },
  });

  const { mutateAsync: loginAsync } = loginMutation;
  const { mutateAsync: logoutAsync } = logoutMutation;

  const login = useCallback((credentials: LoginCredentials) => {
    return loginAsync(credentials);
  }, [loginAsync]);

  const logout = useCallback(() => {
    return logoutAsync();
  }, [logoutAsync]);

  return useMemo(() => ({
    user: userQuery.data ?? null,
    token: tokenQuery.data ?? null,
    isAuthenticated: !!userQuery.data && !!tokenQuery.data,
    isLoading: !isInitialized || userQuery.isLoading || tokenQuery.isLoading,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  }), [
    userQuery.data,
    tokenQuery.data,
    isInitialized,
    userQuery.isLoading,
    tokenQuery.isLoading,
    login,
    logout,
    loginMutation.isPending,
    loginMutation.error,
  ]);
});
