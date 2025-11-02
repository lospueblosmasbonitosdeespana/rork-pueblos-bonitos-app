import React from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '@/constants/theme';

export default function MapasScreen() {
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

  return (
    <WebView
      source={{ uri: 'https://lospueblosmasbonitosdeespana.org/pueblos/?app=1' }}
      style={styles.webview}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      scalesPageToFit={true}
      bounces={false}
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
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
