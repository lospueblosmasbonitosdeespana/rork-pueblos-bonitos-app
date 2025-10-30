import { router } from 'expo-router';
import { LogOut, Mail, User } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
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

  if (!isAuthenticated || !user) {
    return null;
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name;
  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=200&background=c1121f&color=fff`;

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
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <User size={24} color={LPBE_RED} strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre Completo</Text>
                  <Text style={styles.infoValue}>{fullName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Mail size={24} color={LPBE_RED} strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Correo Electrónico</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            </View>
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
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600' as const,
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
