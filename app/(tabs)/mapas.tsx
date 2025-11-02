import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const injectedJS = `
    (function() {
      const tryScroll = () => {
        const el =
          document.querySelector('#lpbe-mapa') ||
          document.querySelector('#mapa') ||
          document.querySelector('#map') ||
          document.querySelector('.elementor-widget-map') ||
          document.querySelector('.jet-map') ||
          document.querySelector('.lpbe-mapa-container');

        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
          window.scrollTo(0, 300);
        }
      };
      setTimeout(tryScroll, 600);
      setTimeout(tryScroll, 1200);
      true;
    })();
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/pueblos/?app=1' }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        contentInsetAdjustmentBehavior="never"
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        injectedJavaScript={injectedJS}
      />
    </View>
  );
}
