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
    SplashScreen.hideAsync();
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
          headerShown: false,
          presentation: "modal",
        }}
      />
      </Stack>
    </>
  );
}

export default function RootLayout() {
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
}
