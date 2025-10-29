import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStoredData = async () => {
      try {
        console.log('🔍 Cargando datos almacenados...');
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(USER_TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
        ]);

        if (!isMounted) return;

        if (storedToken && storedUser) {
          console.log('✅ Sesión encontrada');
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          console.log('📝 No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStoredData();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('🔐 Iniciando login...');
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
      console.log('✅ Login exitoso, guardando datos...');
      await Promise.all([
        AsyncStorage.setItem(USER_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user)),
      ]);
      setToken(data.token);
      setUser(data.user);
      console.log('✅ Datos guardados');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log('📝 Iniciando registro...');
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
      console.log('✅ Registro exitoso, guardando datos...');
      await Promise.all([
        AsyncStorage.setItem(USER_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user)),
      ]);
      setToken(data.token);
      setUser(data.user);
      console.log('✅ Datos guardados');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('🧹 Limpiando storage...');
      await Promise.all([
        AsyncStorage.removeItem(USER_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      console.log('✅ Storage limpiado');
    },
    onSuccess: () => {
      console.log('📦 Limpiando estado...');
      setToken(null);
      setUser(null);
      queryClient.clear();
      console.log('✅ Estado limpiado');
    },
  });

  const { mutateAsync: loginAsync } = loginMutation;
  const { mutateAsync: registerAsync } = registerMutation;
  const { mutateAsync: logoutAsync } = logoutMutation;

  const login = useCallback(async (credentials: LoginCredentials) => {
    return loginAsync(credentials);
  }, [loginAsync]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    return registerAsync(credentials);
  }, [registerAsync]);

  const logout = useCallback(async () => {
    console.log('🚪 Cerrando sesión...');
    await logoutAsync();
    console.log('✅ Sesión cerrada correctamente');
  }, [logoutAsync]);

  const forceLogout = useCallback(async () => {
    console.log('🚨 Forzando cierre de sesión...');
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      setToken(null);
      setUser(null);
      queryClient.clear();
      console.log('✅ Cierre forzado completado');
    } catch (error) {
      console.error('❌ Error en cierre forzado:', error);
    }
  }, [queryClient]);

  const isAuthenticated = !!user && !!token;

  return useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forceLogout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }), [
    user,
    token,
    isAuthenticated,
    isLoading,
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
