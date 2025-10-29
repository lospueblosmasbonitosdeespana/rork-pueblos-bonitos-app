import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/userContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function PerfilTabScreen() {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return isAuthenticated ? (
    <Redirect href="/(app)/perfil" />
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
