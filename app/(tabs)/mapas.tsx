import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Mapas() {
  const injectedCSS = `
    (function() {
      const style = document.createElement('style');
      style.innerHTML = '
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
      
      function hideAllUIElements() {
        const allButtons = document.querySelectorAll('button, a');
        allButtons.forEach(btn => {
          const text = (btn.textContent?.toLowerCase() || '').trim();
          if (text === 'mapa' || text === 'listado' || text === 'lista') {
            btn.style.display = 'none !important';
            btn.style.visibility = 'hidden !important';
            btn.style.pointerEvents = 'none !important';
            if (btn.parentElement) {
              btn.parentElement.style.display = 'none !important';
            }
          }
        });
        
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const text = (el.textContent?.trim() || '');
          if (text.includes('Disfruta nuestra red de Pueblos') || 
              text === 'Mapa' || 
              text === 'Listado' || 
              text === 'LISTA') {
            if (el.tagName !== 'BODY' && el.id !== 'map' && !el.classList.contains('leaflet-container')) {
              el.style.display = 'none !important';
              el.style.visibility = 'hidden !important';
              el.style.height = '0 !important';
              el.style.overflow = 'hidden !important';
            }
          }
        });
        
        const navs = document.querySelectorAll('nav, header, .header, .nav, .navigation, .toolbar, .top-bar');
        navs.forEach(nav => {
          nav.style.display = 'none !important';
        });
        
        const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        titles.forEach(title => {
          title.style.display = 'none !important';
        });
      }
      
      setTimeout(hideAllUIElements, 0);
      setTimeout(hideAllUIElements, 100);
      setTimeout(hideAllUIElements, 300);
      setTimeout(hideAllUIElements, 500);
      setTimeout(hideAllUIElements, 1000);
      setTimeout(hideAllUIElements, 1500);
      setTimeout(hideAllUIElements, 2000);
      
      const observer = new MutationObserver(hideAllUIElements);
      observer.observe(document.body, { childList: true, subtree: true });
      
      document.addEventListener('DOMContentLoaded', hideAllUIElements);
      window.addEventListener('load', hideAllUIElements);
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
