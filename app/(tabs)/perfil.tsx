import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/userContext';

export default function PerfilTabScreen() {
  // TODOS los hooks primero
  const { isAuthenticated, isLoading } = useUser();

  // Lógica después
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  // Redirecciones
  return isAuthenticated ? (
    <Redirect href="/perfil" />
  ) : (
    <Redirect href="/login" />
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
