import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useUser } from '@/contexts/userContext';

export default function PerfilTabScreen() {
  const hasNavigated = useRef(false);
  const { isAuthenticated, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (hasNavigated.current) return;
    
    if (isAuthenticated) {
      console.log('🔄 Tab Perfil - Navegando a /perfil');
      hasNavigated.current = true;
      router.push('/perfil');
    } else {
      console.log('🔄 Tab Perfil - Navegando a /login');
      hasNavigated.current = true;
      router.push('/login');
    }
  }, [isAuthenticated, isLoading]);

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
