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
      function hideButtons() {
        const style = document.createElement('style');
        style.innerHTML = \`
          .map-list-toggle,
          .map-toggle-btn,
          .list-toggle-btn,
          button[aria-label*="mapa"],
          button[aria-label*="listado"],
          .toggle-buttons,
          .view-toggle,
          .map-controls-top {
            display: none !important;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
          }
          .map-container,
          .mapa-pueblos,
          #map-wrapper {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        \`;
        document.head.appendChild(style);
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideButtons);
      } else {
        hideButtons();
      }
      
      setTimeout(hideButtons, 500);
      setTimeout(hideButtons, 1000);
      setTimeout(hideButtons, 2000);
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
