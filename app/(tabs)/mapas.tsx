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
      
      function disableElements() {
        const listadoBtns = document.querySelectorAll('button, a, div, span');
        listadoBtns.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('listado')) {
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            btn.style.pointerEvents = 'none !important';
            btn.style.opacity = '0.3';
            btn.style.cursor = 'default';
            btn.style.display = 'none !important';
            if (btn.href) btn.removeAttribute('href');
          }
        });
        
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const text = el.textContent?.trim() || '';
          if (text === 'Disfruta nuestra red de Pueblos' || text.includes('Disfruta nuestra red de Pueblos')) {
            el.style.display = 'none !important';
            el.style.visibility = 'hidden !important';
            el.style.height = '0 !important';
            el.style.overflow = 'hidden !important';
            el.remove();
          }
        });
        
        const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        headers.forEach(header => {
          const text = header.textContent?.trim() || '';
          if (text === 'Disfruta nuestra red de Pueblos' || text.includes('Disfruta nuestra red de Pueblos')) {
            header.style.display = 'none !important';
            header.remove();
          }
        });
      }
      
      setTimeout(disableElements, 100);
      setTimeout(disableElements, 300);
      setTimeout(disableElements, 500);
      setTimeout(disableElements, 1000);
      setTimeout(disableElements, 1500);
      setTimeout(disableElements, 2000);
      
      const observer = new MutationObserver(disableElements);
      observer.observe(document.body, { childList: true, subtree: true });
      
      document.addEventListener('DOMContentLoaded', disableElements);
      window.addEventListener('load', disableElements);
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
