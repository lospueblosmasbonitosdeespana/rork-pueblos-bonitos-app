import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/theme';

export default function MapasScreen() {
  const [loading, setLoading] = useState(true);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackText}>
            El mapa interactivo está disponible en la aplicación móvil
          </Text>
        </View>
      </View>
    );
  }

  const mapUrl = 'https://lospueblosmasbonitosdeespana.org/pueblos/?app=1';

  const injectedJavaScript = `
    (function() {
      function applyStyles() {
        const style = document.createElement('style');
        style.innerHTML = \`
          .map-list-toggle,
          .map-toggle-btn,
          .list-toggle-btn,
          button[aria-label*="mapa"],
          button[aria-label*="listado"],
          .toggle-buttons,
          .view-toggle,
          .map-controls-top,
          .tab-buttons,
          .view-switcher,
          nav.navigation-tabs,
          .switch-view-buttons {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
            height: 100% !important;
          }
          .map-container,
          .mapa-pueblos,
          #map-wrapper,
          .pueblos-map-container,
          #pueblos-map,
          .map-view-container {
            margin-top: 0 !important;
            padding-top: 0 !important;
            height: 100% !important;
            width: 100% !important;
          }
          header, .site-header, .page-header {
            display: none !important;
          }
          footer, .site-footer {
            display: none !important;
          }
          main, .main-content, .content {
            margin: 0 !important;
            padding: 0 !important;
          }
        \`;
        document.head.appendChild(style);
      }

      function scrollToMap() {
        window.scrollTo(0, 0);
        const mapElements = [
          document.querySelector('.map-container'),
          document.querySelector('.mapa-pueblos'),
          document.querySelector('#map-wrapper'),
          document.querySelector('.pueblos-map-container'),
          document.querySelector('#pueblos-map'),
          document.querySelector('.map-view-container')
        ];
        
        for (const element of mapElements) {
          if (element) {
            element.scrollIntoView({ behavior: 'instant', block: 'start' });
            break;
          }
        }
      }
      
      function init() {
        applyStyles();
        scrollToMap();
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
      
      setTimeout(init, 100);
      setTimeout(init, 300);
      setTimeout(init, 500);
      setTimeout(init, 1000);
      setTimeout(init, 1500);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      )}
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        scalesPageToFit={true}
        scrollEnabled={true}
      />
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
