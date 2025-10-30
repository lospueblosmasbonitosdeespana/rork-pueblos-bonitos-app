import { router, Tabs } from "expo-router";
import { Bell, Home, MapPin, Compass, Map, User } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useNotifications } from "@/contexts/notifications";

function NotificationBellButton() {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/centro-notificaciones')}
      style={bellStyles.container}
    >
      <Bell size={22} color={COLORS.primary} strokeWidth={2} />
      {unreadCount > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: true,
        headerRight: () => <NotificationBellButton />,
        headerStyle: {
          backgroundColor: COLORS.card,
        },
        headerTintColor: COLORS.text,
        tabBarStyle: {
          backgroundColor: COLORS.card,
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
        name="profile"
        options={{
          title: "Cuenta",
          headerTitle: "Mi Cuenta",
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}

const bellStyles = StyleSheet.create({
  container: {
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
