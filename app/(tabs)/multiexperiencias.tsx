import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const RUTAS_URL = 'https://lospueblosmasbonitosdeespana.org/category/rutas/?app=1';

const RUTAS_PATHS = [
  '/ruta-pueblos-del-blanco-infinito/',
  '/ruta-jucar-y-el-mediterraneo/',
  '/ruta-senda-de-los-caballeros/',
  '/ruta-pueblos-alma-canaria/',
  '/ruta-de-los-pueblos-encantados-2/',
  '/ruta-de-los-pueblos-nazaries/',
  '/ruta-pueblos-de-los-cuatro-reinos/',
  '/pueblos-del-sol-y-la-tramuntana/',
  '/ruta-pueblos-senorio-y-la-corona/',
  '/ruta-pueblos-reino-y-el-califato/',
  '/ruta-iberico-y-la-frontera/',
  '/ruta-pueblos-orden-y-la-espada/',
  '/ruta-pueblos-castilla-eterna/',
  '/ruta-druidas-y-la-mar/',
  '/ruta-de-los-pueblos-celtas/',
  '/mas-bonitos-de-los-pirineos/',
  '/ficha-pueblo/',
];

export default function RutasScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const injectedJavaScript = `
    (function() {
      const PATHS_TO_HIDE = ${JSON.stringify(RUTAS_PATHS)};
      
      function shouldHideHeaderFooter() {
        const currentUrl = window.location.href;
        return PATHS_TO_HIDE.some(path => currentUrl.includes(path)) || currentUrl.includes('category/rutas');
      }
      
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
      
      function hideHeaderFooter() {
        const style = document.createElement('style');
        style.id = 'lpbe-hide-header-footer';
        style.innerHTML = \`
          header,
          .site-header,
          .main-navigation,
          nav,
          .nav-menu,
          #masthead,
          .header,
          .menu,
          .top-bar,
          footer,
          .site-footer,
          .footer,
          #colophon,
          .bottom-bar,
          #wpadminbar {
            display: none !important;
          }

          body {
            padding-top: 0 !important;
            margin-top: 0 !important;
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
            overflow-x: hidden !important;
          }

          .site-content,
          .entry-content,
          article {
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          img {
            max-width: 100% !important;
            height: auto !important;
          }
        \`;
        
        if (!document.getElementById('lpbe-hide-header-footer')) {
          document.head.appendChild(style);
          console.log('✅ Header y footer ocultados en:', window.location.href);
        }
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
      
      hideHeaderFooter();
      interceptLinks();
      
      const observer = new MutationObserver(() => {
        hideHeaderFooter();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('📍 Script de rutas cargado en:', window.location.href);
    })();
    true;
  `;

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
            source={{ uri: RUTAS_URL }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            injectedJavaScript={injectedJavaScript}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
            onLoadEnd={() => {
              console.log('✅ Rutas cargadas correctamente');
              setLoading(false);
            }}
            onNavigationStateChange={(navState) => {
              console.log('🧭 Navegación detectada:', navState.url);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Error cargando rutas:', nativeEvent);
              setError(true);
              setLoading(false);
            }}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando rutas...</Text>
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
