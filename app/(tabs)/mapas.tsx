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
        footer,
        h1:contains("Disfruta nuestra red de Pueblos"),
        .page-title,
        .hero-title {
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
      
      setTimeout(() => {
        const listadoBtn = document.querySelector('button[data-view="listado"], a[href*="listado"], button:contains("Listado")');
        if (listadoBtn) {
          listadoBtn.style.pointerEvents = 'none';
          listadoBtn.style.opacity = '0.5';
        }
        
        const titles = document.querySelectorAll('h1, h2, .title, .page-title');
        titles.forEach(title => {
          if (title.textContent.includes('Disfruta nuestra red de Pueblos')) {
            title.style.display = 'none';
          }
        });
      }, 500);
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
