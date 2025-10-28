import { Tabs } from "expo-router";
import { Home, MapPin, Compass, Map, User } from "lucide-react-native";
import React from "react";

import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8b2b1a',
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          headerTitle: t.home.title1 + ' ' + t.home.title2,
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="pueblos"
        options={{
          title: t.tabs.pueblos,
          headerTitle: t.explore.title,
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="multiexperiencias"
        options={{
          title: t.tabs.rutas,
          headerTitle: t.tabs.rutas,
          tabBarIcon: ({ color }) => <Compass size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          title: t.tabs.mapas,
          headerTitle: t.mapas.title,
          headerShown: false,
          tabBarIcon: ({ color }) => <Map size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: t.tabs.profile,
          headerTitle: t.profile.title,
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
