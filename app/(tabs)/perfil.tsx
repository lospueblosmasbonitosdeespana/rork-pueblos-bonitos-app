import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useUser } from '@/contexts/userContext';

export default function PerfilTabScreen() {
  const { isAuthenticated, isLoading, user, token } = useUser();
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('📦 Tab Perfil - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'hasUser:', !!user, 'hasToken:', !!token);
    
    if (!isLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      if (isAuthenticated) {
        console.log('🔄 Tab Perfil - Navegando a /perfil');
        router.push('/perfil');
      } else {
        console.log('🔄 Tab Perfil - Navegando a /login');
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B0000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});
