import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/contexts/auth";
import { LanguageProvider } from "@/contexts/language";
import { NotificationsProvider } from "@/contexts/notifications";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="pueblo/[id]"
        options={{
          headerTitle: "Pueblo",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="noticia/[id]"
        options={{
          headerTitle: "Noticia",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="pueblo-info/[id]"
        options={{
          headerTitle: "Información del Pueblo",
          presentation: "card",
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
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationsProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </NotificationsProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
