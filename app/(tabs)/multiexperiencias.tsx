import { useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const RUTAS_URL = 'https://lospueblosmasbonitosdeespana.org/category/rutas/?app=1';

function addAppParam(url: string): string {
  if (!url || url.includes('?app=1') || url.includes('&app=1')) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}app=1`;
}

export default function RutasScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const { url } = request;
    
    console.log('🔗 Navegación interceptada:', url);
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    if (url.includes('lospueblosmasbonitosdeespana.org')) {
      const urlWithParam = addAppParam(url);
      
      if (urlWithParam !== url && webViewRef.current) {
        console.log('✅ Añadiendo ?app=1 a:', url);
        webViewRef.current.injectJavaScript(`window.location.href = '${urlWithParam}';`);
        return false;
      }
    }
    
    return true;
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudieron cargar las rutas.{"\n"}Verifica tu conexión a internet.
          </Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: RUTAS_URL }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
            startInLoadingState={true}
            onLoadStart={() => {
              console.log('🔄 Iniciando carga de rutas');
            }}
            onLoadEnd={() => {
              console.log('✅ Rutas cargadas correctamente');
              setLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Error cargando rutas:', nativeEvent);
              setError(true);
              setLoading(false);
            }}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            allowsInlineMediaPlayback={true}
            allowsBackForwardNavigationGestures={true}
            mixedContentMode="always"
          />
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando rutas...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
