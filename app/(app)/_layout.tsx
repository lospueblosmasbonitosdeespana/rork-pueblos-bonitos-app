import { Stack, Redirect } from 'expo-router';
import { useUser } from '@/contexts/userContext';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' }}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
