import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Key,
  LogOut,
  MapPin,
  Map,
  Star,
  User,
  FileText,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { useAuth } from '@/contexts/auth';

const LPBE_RED = '#c1121f';

export default function ProfileScreen() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else {
        Animated.spring(fadeAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás seguro que deseas finalizar sesión?');
      if (confirmed) logout();
      return;
    }

    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas finalizar sesión?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => await logout(),
        },
      ],
      { cancelable: false }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated || !user) return null;

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name;

  // ------------------------------------------------------------
  //  🔥 Avatar dinámico sin keys peligrosas para Android
  // ------------------------------------------------------------
  let displayAvatar = user.photo || user.profile_photo || user.avatar_url;

  // Caso UM: ruta relativa => construir URL absoluta
  if (displayAvatar && !displayAvatar.startsWith('http')) {
    const userId = user.id || user.user_id;
    displayAvatar = `https://lospueblosmasbonitosdeespana.org/wp-content/uploads/ultimatemember/${userId}/${displayAvatar}`;
  }

  // Fallback total
  if (!displayAvatar) {
    displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&size=200&background=c1121f&color=fff`;
  }

  // Forzar refresh del avatar SIN usar keys dinámicas inseguras
  const avatarSrc = { uri: `${displayAvatar}?t=${Date.now()}` };

  const menuOptions = [
    {
      id: 'notifications',
      label: 'Centro de Notificaciones',
      icon: Bell,
      onPress: () => router.push('/centro-notificaciones'),
      active: true,
    },
    {
      id: 'account',
      label: 'Cuenta',
      icon: User,
      onPress: () => router.push('/cuenta-info'),
      active: true,
    },
    {
      id: 'visited',
      label: 'Pueblos Visitados',
      icon: MapPin,
      onPress: () => router.push('/pueblos-visitados'),
      active: true,
    },
    {
      id: 'visited-map',
      label: 'Mapa visitados',
      icon: Map,
      onPress: () => router.push('/mapa-visitados'),
      active: true,
    },
    {
      id: 'points',
      label: 'Puntos Conseguidos',
      icon: Star,
      onPress: () => router.push('/puntos-conseguidos'),
      active: true,
    },
    {
      id: 'guide',
      label: 'Guía de uso',
      icon: FileText,
      onPress: () => router.push('/guia-uso'),
      active: true,
    },
    {
      id: 'password',
      label: 'Cambiar contraseña',
      icon: Key,
      onPress: () => router.push('/cambiar-password'),
      active: true,
    },
  ];

  return (
  <View style={styles.container}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          {/* 🔥 AVATAR FIX PARA ANDROID (expo-image + overflow:hidden) */}
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSrc}
              style={[styles.avatar, { overflow: 'hidden' }]}
              contentFit="cover"
              transition={200}
            />
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.menuSection}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.menuItem]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <option.icon size={22} color={LPBE_RED} strokeWidth={2} />
                </View>
                <Text style={styles.menuLabel}>{option.label}</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={22} color="#fff" strokeWidth={2} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingVertical: 32,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: LPBE_RED,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  avatar: {
  width: 120,
  height: 120,
  borderRadius: 60,
  overflow: 'hidden',   // 🔥 evita el crash en Android
},
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginBottom: 14,
    padding: 16,
    borderRadius: 12,
    borderColor: '#eee',
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: LPBE_RED,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
});