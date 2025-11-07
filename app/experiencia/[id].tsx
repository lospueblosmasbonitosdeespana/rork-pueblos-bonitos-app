import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

export default function ExperienciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const experienciaUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${id}&app=1`;



  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <WebView
          source={{ uri: experienciaUrl }}
          style={styles.webview}
          originWhitelist={['*']}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          setSupportMultipleWindows={false}
          useWebKit={true}

        />
        
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 16 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#7A1C1C" strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  backButton: {
    position: 'absolute' as const,
    left: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 6,
  },
  backButtonText: {
    color: '#7A1C1C',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
