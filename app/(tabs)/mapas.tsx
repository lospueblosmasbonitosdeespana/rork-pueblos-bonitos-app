import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const injectedCSS = `
    (function() {
      function limpiarMapa() {
        // Ocultar títulos y botones de arriba
        const textos = document.querySelectorAll('h1, h2, h3, .page-title, .elementor-heading-title');
        textos.forEach(el => {
          if (el.innerText && el.innerText.toLowerCase().includes('disfruta nuestra red de pueblos')) {
            el.style.display = 'none';
          }
        });

        // Ocultar los botones "Mapa" y "Listado"
        const botones = document.querySelectorAll('a, button, div');
        botones.forEach(el => {
          const texto = (el.textContent || '').toLowerCase();
          if (texto.includes('mapa') || texto.includes('listado')) {
            el.style.display = 'none';
          }
        });

        // Ocultar cualquier bloque de cabecera superior
        const cabecera = document.querySelector('header, .elementor-location-header');
        if (cabecera) cabecera.style.display = 'none';

        // Ajustar el mapa a pantalla completa
        const mapa = document.querySelector('#map, .elementor-widget-google_maps, .elementor-widget');
        if (mapa) {
          mapa.style.position = 'fixed';
          mapa.style.top = '0';
          mapa.style.left = '0';
          mapa.style.width = '100vw';
          mapa.style.height = '100vh';
          mapa.style.zIndex = '1';
        }
      }

      limpiarMapa();
      new MutationObserver(limpiarMapa).observe(document.documentElement, {childList: true, subtree: true});
    })();

    true;
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
