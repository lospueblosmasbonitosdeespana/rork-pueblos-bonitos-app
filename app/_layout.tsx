import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "react-native";

import { AuthProvider } from "@/contexts/auth";
import { LanguageProvider } from "@/contexts/language";
import { NotificationsProvider } from "@/contexts/notifications";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useEffect(() => {
    console.log('📱 RootLayoutNav montado');
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
        name="mapa-pueblos-visitados"
        options={{
          headerTitle: "Mapa de Pueblos Visitados",
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
  
  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error('❌ Error fatal en RootLayout:', error);
    throw error;
  }
}
