import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const injectedJS = `
    setTimeout(() => {
      const mapSection = document.querySelector('#map') || document.querySelector('.jet-map') || document.querySelector('.elementor-widget-map');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else {
        window.scrollTo(0, 300);
      }
    }, 1000);
    true;
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/pueblos/?app=1' }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJS}
        startInLoadingState={true}
      />
    </View>
  );
}
