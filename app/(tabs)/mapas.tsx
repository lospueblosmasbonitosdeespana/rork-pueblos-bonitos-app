import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/pueblos/?app=1' }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        cacheEnabled={false}
        startInLoadingState={true}
        onError={(e) => console.log('WebView error:', e.nativeEvent)}
      />
    </View>
  );
}
