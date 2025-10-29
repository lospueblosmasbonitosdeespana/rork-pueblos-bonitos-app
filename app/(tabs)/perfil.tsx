import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/userContext';

export default function PerfilTabScreen() {
  const { isAuthenticated, isLoading } = useUser();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;

    if (isAuthenticated) {
      router.replace('/perfil');
    } else {
      router.replace('/login');
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
