import { router, Stack } from 'expo-router';
import {
  Heart,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Trophy,
  User,
} from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { useUser } from '@/contexts/userContext';
import { Usuario } from '@/types/api';
import { fetchUserProfile } from '@/services/api';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { user: localUser, token, logout, isAuthenticated, isLoading: contextLoading } = useUser();
  const hasNavigated = useRef(false);

  const profileQuery = useQuery<Usuario>({
    queryKey: ['userProfile', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return fetchUserProfile(token);
    },
    enabled: !!token && isAuthenticated,
    staleTime: 60000,
    retry: 1,
  });

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          hasNavigated.current = false;
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  useEffect(() => {
    if (contextLoading) return;
    if (hasNavigated.current) return;
    
    console.log('🔍 Perfil - isAuthenticated:', isAuthenticated, 'hasToken:', !!token);
    
    if (!isAuthenticated || !token) {
      hasNavigated.current = true;
      console.log('🔄 Redirigiendo a login...');
      router.replace('/login');
    }
  }, [isAuthenticated, token, contextLoading]);

  const isLoading = contextLoading || profileQuery.isLoading;
  const user = profileQuery.data || localUser;

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B0000" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        </View>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRolDisplay = (rol?: string): string => {
    if (rol === 'embajador' || rol === 'administrator') return 'Embajador';
    if (rol === 'premium' || rol === 'viajero_premium') return 'Viajero Premium';
    return 'Explorador';
  };

  const getRolColor = (rol?: string): string => {
    if (rol === 'embajador' || rol === 'administrator') return '#1a4d8f';
    if (rol === 'premium' || rol === 'viajero_premium') return '#d4af37';
    return '#8B0000';
  };

  const rolDisplay: string = getRolDisplay(user.rol);
  const rolColor: string = getRolColor(user.rol);
  const puntos: number = user.puntos || 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={48} color="#8B0000" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{user.display_name || user.username}</Text>
            {user.email && (
              <Text style={styles.email}>{user.email}</Text>
            )}
            <View style={[styles.rolBadge, { backgroundColor: rolColor }]}>
              <Text style={styles.rolText}>{rolDisplay}</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Trophy size={24} color="#8B0000" />
              <Text style={styles.statValue}>{puntos}</Text>
              <Text style={styles.statLabel}>Puntos</Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <ImageIcon size={22} color="#8B0000" />
              </View>
              <Text style={styles.menuText}>Mis fotos</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Heart size={22} color="#8B0000" />
              </View>
              <Text style={styles.menuText}>Mis favoritos</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <MessageSquare size={22} color="#8B0000" />
              </View>
              <Text style={styles.menuText}>Mis reseñas</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFF" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#8B0000',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f5f5f5',
    borderWidth: 3,
    borderColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  rolBadge: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rolText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  menuSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500' as const,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 72,
  },
  logoutButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
});
