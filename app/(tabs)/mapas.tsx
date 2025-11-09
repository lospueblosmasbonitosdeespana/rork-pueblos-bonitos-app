import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const injectedCSS = `
    (function() {
      const style = document.createElement('style');
      style.innerHTML = '
        .view-toggle,
        .view-buttons,
        button[data-view],
        a[href*="mapa"],
        a[href*="listado"],
        nav,
        header,
        footer {
          display: none !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        #map-container,
        .map-wrapper {
          height: 100vh !important;
          width: 100vw !important;
        }
      ';
      document.head.appendChild(style);
    })();
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/pueblos?app=1' }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        allowsInlineMediaPlayback
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
        injectedJavaScript={injectedCSS}
      />
    </View>
  );
}
