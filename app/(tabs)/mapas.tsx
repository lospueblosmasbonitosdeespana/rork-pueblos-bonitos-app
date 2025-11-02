import React from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const mapUrl = 'https://maps.lospueblosmasbonitosdeespana.org';

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <iframe
          src={mapUrl}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="geolocation"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: mapUrl }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
      />
    </View>
  );
}
