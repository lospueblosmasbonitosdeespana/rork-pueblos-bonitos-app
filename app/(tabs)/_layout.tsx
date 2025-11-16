import { router, Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useNotifications } from "@/contexts/notifications";
import { useCart } from "@/contexts/cart";

function NotificationBellButton() {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/centro-notificaciones')}
      style={bellStyles.container}
    >
      <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
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

function CartButton() {
  const { totalItems } = useCart();

  return (
    <TouchableOpacity
      onPress={() => router.push('/carrito')}
      style={bellStyles.container}
    >
      <Ionicons name="cart-outline" size={22} color={COLORS.primary} />

      {totalItems > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {totalItems > 9 ? '9+' : totalItems}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function HeaderButtons() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <CartButton />
      <NotificationBellButton />
    </View>
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
        headerRight: () => <HeaderButtons />,
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
          headerTitle: '',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="pueblos"
        options={{
          title: t.tabs.pueblos,
          headerTitle: t.explore.title,
          tabBarIcon: ({ color }) => (
            <Ionicons name="location-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rutas"
        options={{
          title: t.tabs.rutas,
          headerTitle: t.tabs.rutas,
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mapas"
        options={{
          title: t.tabs.mapas,
          headerTitle: t.mapas.title,
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tienda"
        options={{
          title: "Tienda",
          headerTitle: "Tienda LPBE",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bag-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Cuenta",
          headerTitle: "Mi Cuenta",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
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