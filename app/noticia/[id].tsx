import { Stack, useLocalSearchParams, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function NoticiaDetalleScreen() {
  const params = useLocalSearchParams<{ id: string; link?: string }>();
  const decodedLink = params.link ? decodeURIComponent(params.link) : null;
  const link = decodedLink ? `${decodedLink}${decodedLink.includes('?') ? '&' : '?'}app=1` : null;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.error('❌ Error loading news content:', link);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('✅ News content loaded:', link);
    setIsLoading(false);
  };

  if (!link) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'Noticia no disponible',
            headerStyle: {
              backgroundColor: COLORS.card,
            },
            headerTintColor: COLORS.primary,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Noticia no disponible</Text>
          <Text style={styles.errorText}>
            No se pudo cargar la información de esta noticia.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Noticia',
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTintColor: COLORS.primary,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>
              No se pudo cargar la noticia. Verifica tu conexión a internet.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setHasError(false);
                setIsLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando noticia...</Text>
              </View>
            )}
            <WebView
              source={{ uri: link }}
              style={styles.webview}
              onLoad={handleLoad}
              onError={handleError}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              incognito={false}
              cacheEnabled={true}
              injectedJavaScript={`
                (function() {
                  const style = document.createElement('style');
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
                    #colophon {
                      display: none !important;
                    }

                    .post-navigation,
                    .nav-previous,
                    .nav-next,
                    .navigation.post-navigation,
                    .nav-links,
                    .post-nav-links {
                      display: none !important;
                    }

                    .post-thumbnail img,
                    .wp-post-image,
                    .entry-image img,
                    .featured-image img {
                      width: 100% !important;
                      height: auto !important;
                      object-fit: cover !important;
                      max-width: 100% !important;
                    }

                    body {
                      padding: 16px !important;
                      margin: 0 !important;
                      overflow-x: hidden !important;
                    }

                    .site-content,
                    .entry-content,
                    article,
                    main {
                      max-width: 100% !important;
                      width: 100% !important;
                      overflow-x: hidden !important;
                      margin: 0 !important;
                      padding: 0 !important;
                    }

                    .entry-content img {
                      max-width: 100% !important;
                      height: auto !important;
                    }

                    .entry-title,
                    .post-title,
                    h1 {
                      margin-top: 0 !important;
                    }
                  \`;
                  document.head.appendChild(style);

                  setTimeout(function() {
                    const article = document.querySelector('article, .post, .entry, main');
                    if (article) {
                      article.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      window.scrollTo(0, 0);
                    }
                  }, 300);
                })();
                true;
              `}
              scalesPageToFit={true}
              showsHorizontalScrollIndicator={false}
            />
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 1,
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
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.card,
    fontWeight: '600' as const,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
});
