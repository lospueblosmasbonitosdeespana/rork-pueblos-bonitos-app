import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, View, Text, StyleSheet, ScrollView } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider } from "@/contexts/auth";
import { LanguageProvider } from "@/contexts/language";
import { NotificationsProvider } from "@/contexts/notifications";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
  },
});

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error boundary capturó un error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <ScrollView contentContainerStyle={errorStyles.content}>
            <Text style={errorStyles.title}>⚠️ Error en la App</Text>
            <Text style={errorStyles.message}>
              La aplicación encontró un error. Por favor, reinicia la app.
            </Text>
            <Text style={errorStyles.errorTitle}>Detalles del error:</Text>
            <Text style={errorStyles.errorText}>
              {this.state.error?.toString()}
            </Text>
            {this.state.errorInfo && (
              <Text style={errorStyles.stackText}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#d60000',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#d60000',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    fontFamily: 'monospace',
  },
});

function RootLayoutNav() {
  useEffect(() => {
    console.log('📱 RootLayoutNav montado');
    
    // const clearAllCache = async () => {
    //   try {
    //     console.log('🧹 Limpiando AsyncStorage...');
    //     await AsyncStorage.clear();
    //     console.log('✅ AsyncStorage limpiado');
    //   } catch (error) {
    //     console.error('❌ Error limpiando AsyncStorage:', error);
    //   }
    // };
    
    // clearAllCache();
    
    // console.log('🧹 Limpiando caché de React Query...');
    // queryClient.clear();
    // queryClient.invalidateQueries();
    // console.log('✅ Caché de React Query limpiado');
    
    const timer = setTimeout(() => {
      console.log('👋 Ocultando splash screen nativo');
      SplashScreen.hideAsync().catch(error => {
        console.error('❌ Error ocultando splash screen:', error);
      });
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F1EA"
      />
      <Stack 
      screenOptions={{ 
        headerBackTitle: "Atrás",
        gestureEnabled: true,
        animation: 'default',
        gestureDirection: 'horizontal',
        contentStyle: { flex: 1, backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: true,
          headerTitle: "Iniciar Sesión",
          presentation: "card",
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          headerShown: true,
          headerTitle: "Crear Cuenta",
          presentation: "card",
        }} 
      />


      <Stack.Screen
        name="pueblo/[id]"
        options={{
          headerTitle: "Pueblo",
          presentation: "card",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="noticia/[id]"
        options={{
          headerTitle: "Noticia",
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="pueblo-info/[id]"
        options={{
          headerTitle: "Información del Pueblo",
          presentation: "card",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="centro-notificaciones"
        options={{
          headerTitle: "Centro de Notificaciones",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="cuenta-info"
        options={{
          headerTitle: "Información de Cuenta",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="pueblos-visitados"
        options={{
          headerTitle: "Pueblos Visitados",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="puntos-conseguidos"
        options={{
          headerTitle: "Puntos Conseguidos",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="guia-uso"
        options={{
          headerTitle: "Guía de uso",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="cambiar-password"
        options={{
          headerTitle: "Cambiar contraseña",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="privacidad"
        options={{
          headerTitle: "Privacidad",
          presentation: "card",
        }}
      />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  console.log('🚀 RootLayout inicializando...');
  
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <LanguageProvider>
                  <NotificationsProvider>
                    <RootLayoutNav />
                  </NotificationsProvider>
                </LanguageProvider>
              </AuthProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
