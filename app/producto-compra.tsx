import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

const LPBE_RED = '#d60000';

export default function ProductoCompraScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  
  if (!url) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>URL no disponible</Text>
      </View>
    );
  }

  const decodedUrl = decodeURIComponent(url);
  
  console.log('🛒 Abriendo página de compra:', decodedUrl);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: decodedUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        showsVerticalScrollIndicator={true}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        allowsLinkPreview={false}
        setSupportMultipleWindows={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={LPBE_RED} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        )}
        onScroll={(e) => console.log('📜 SCROLL compra:', e.nativeEvent.contentOffset?.y)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
        }}
      />
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
