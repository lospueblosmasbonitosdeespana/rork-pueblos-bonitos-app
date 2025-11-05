import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapaVisitadosScreen() {
  const webViewUrl = 'https://lospueblosmasbonitosdeespana.org/account-2/?um_page=mapa-de-pueblos-visitados&app=1';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mapa visitados',
          headerStyle: {
            backgroundColor: '#c1121f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      {Platform.OS === 'web' ? (
        <iframe
          src={webViewUrl}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Mapa de Pueblos Visitados"
        />
      ) : (
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webview}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
