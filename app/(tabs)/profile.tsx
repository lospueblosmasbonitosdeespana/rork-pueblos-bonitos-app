import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Key,
  LogOut,
  MapPin,

  Star,
  User,
  FileText,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  }, [isLoading, isAuthenticated, user, fadeAnim]);



  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás seguro que deseas finalizar sesión?');
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas finalizar sesión?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Sí',
            style: 'destructive',
            onPress: async () => {
              await logout();
            },
          },
        ],
        { cancelable: false }
      );
    }
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

  if (!isAuthenticated || !user) {
    return null;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name;
  
  let displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=200&background=c1121f&color=fff`;
  
  if (user.photo && user.photo.startsWith('http')) {
    displayAvatar = user.photo;
  } else if (user.profile_photo && !user.profile_photo.startsWith('http')) {
    const userId = user.id || user.user_id;
    displayAvatar = `https://lospueblosmasbonitosdeespana.org/wp-content/uploads/ultimatemember/${userId}/${user.profile_photo}`;
  }

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
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: displayAvatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.menuSection}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.menuItem,
                  !option.active && styles.menuItemInactive,
                ]}
                onPress={option.active ? option.onPress : undefined}
                activeOpacity={option.active ? 0.7 : 1}
                disabled={!option.active}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      !option.active && styles.menuIconInactive,
                    ]}
                  >
                    <option.icon
                      size={22}
                      color={option.active ? LPBE_RED : '#999'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      !option.active && styles.menuLabelInactive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={option.active ? '#999' : '#ccc'}
                  strokeWidth={2}
                />
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
    shadowColor: LPBE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemInactive: {
    backgroundColor: '#fafafa',
    opacity: 0.6,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconInactive: {
    backgroundColor: '#f5f5f5',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600' as const,
    flex: 1,
  },
  menuLabelInactive: {
    color: '#999',
  },
  logoutButton: {
    backgroundColor: LPBE_RED,
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: LPBE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
