import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RutasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/rutas-app/?app=1' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        startInLoadingState={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="always"
        bounces={false}
        showsVerticalScrollIndicator={false}
        injectedJavaScript={`
          const style = document.createElement('style');
          style.innerHTML = 'html, body { overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; touch-action: pan-y !important; }';
          document.head.appendChild(style);
          true;
        `}
      />
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ChevronLeft size={24} color="#fff" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
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
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
