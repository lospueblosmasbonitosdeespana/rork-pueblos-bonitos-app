import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/contexts/auth';

export default function MapaVisitadosScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
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
        <ActivityIndicator size="large" color="#c1121f" />
      </View>
    );
  }

  if (!user || !user.id) {
    return (
      <View style={[styles.container, styles.centered]}>
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
        <Text style={styles.errorText}>Debes iniciar sesión para ver el mapa</Text>
      </View>
    );
  }

  const webViewUrl = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/mapa-visitados-html?user_id=${user.id}`;

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
          source={{ 
            uri: webViewUrl,
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          }}
          style={styles.webview}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent.statusCode);
          }}
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
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
});
