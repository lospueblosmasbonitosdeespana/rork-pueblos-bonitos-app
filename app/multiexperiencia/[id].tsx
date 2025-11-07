import { useLocalSearchParams, Stack } from 'expo-router';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { useState } from 'react';

function MultiexperienciaDetailScreen() {
  const { id } = useLocalSearchParams();
  const experienciaId = Array.isArray(id) ? id[0] : id;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  console.log('🌍 Cargando multiexperiencia con id:', experienciaId);
  
  const webviewUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${experienciaId}`;
  console.log('🔗 URL completa:', webviewUrl);

  const injectedJavaScript = `
    (function() {
      try {
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'auto';
        document.body.style.webkitOverflowScrolling = 'touch';
        console.log('✅ Scroll configurado correctamente');
      } catch (e) {
        console.error('❌ Error configurando scroll:', e);
      }
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A1C1C" />
        </View>
      )}
      
      <WebView
        source={{ uri: webviewUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ Error cargando WebView:', nativeEvent);
          setIsLoading(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
});

export default gestureHandlerRootHOC(MultiexperienciaDetailScreen);
