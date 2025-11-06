import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const TIENDA_URL = 'https://lospueblosmasbonitosdeespana.org/tienda/?app=1';

export default function TiendaScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(TIENDA_URL);

  const injectedJavaScript = `
    (function() {
      function addAppParam(url) {
        try {
          const urlObj = new URL(url, window.location.href);
          if (urlObj.hostname === 'lospueblosmasbonitosdeespana.org' && !urlObj.searchParams.has('app')) {
            urlObj.searchParams.set('app', '1');
            return urlObj.toString();
          }
        } catch (e) {
          console.log('Error parsing URL:', e);
        }
        return url;
      }

      function interceptLinks() {
        document.addEventListener('click', function(e) {
          let target = e.target;
          while (target && target.tagName !== 'A') {
            target = target.parentElement;
          }
          
          if (target && target.tagName === 'A' && target.href) {
            const href = target.href;
            const modifiedUrl = addAppParam(href);
            
            if (modifiedUrl !== href) {
              e.preventDefault();
              window.location.href = modifiedUrl;
              console.log('🔗 Navegando con app=1:', modifiedUrl);
            }
          }
        }, true);
      }

      interceptLinks();
      
      const observer = new MutationObserver(function(mutations) {
        interceptLinks();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('✅ Script de intercepción de enlaces inyectado');
    })();
    true;
  `;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerTitle: 'Tienda LPBE',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              No se pudo cargar la tienda.{"\n"}Verifica tu conexión a internet.
            </Text>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: currentUrl }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              injectedJavaScript={injectedJavaScript}
              onLoadEnd={() => {
                console.log('✅ Tienda cargada correctamente:', currentUrl);
                setLoading(false);
              }}
              onNavigationStateChange={(navState) => {
                console.log('🧭 Navegación detectada:', navState.url);
                
                const url = navState.url;
                if (url.includes('lospueblosmasbonitosdeespana.org') && !url.includes('app=1')) {
                  const separator = url.includes('?') ? '&' : '?';
                  const newUrl = url + separator + 'app=1';
                  console.log('🔧 Corrigiendo URL sin app=1:', newUrl);
                  setCurrentUrl(newUrl);
                } else {
                  setCurrentUrl(url);
                }
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('❌ Error cargando tienda:', nativeEvent);
                setError(true);
                setLoading(false);
              }}
              renderLoading={() => (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Cargando tienda...</Text>
                </View>
              )}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              allowsInlineMediaPlayback={true}
              allowsBackForwardNavigationGestures={true}
            />
            {loading && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando tienda...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </>
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
  headerButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});
