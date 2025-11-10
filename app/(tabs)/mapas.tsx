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
        const listadoBtns = document.querySelectorAll('button, a');
        listadoBtns.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('listado')) {
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
            btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'default';
            if (btn.href) btn.removeAttribute('href');
          }
        });
        
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const text = el.textContent?.trim() || '';
          if (text === 'Disfruta nuestra red de Pueblos' || text.includes('Disfruta nuestra red de Pueblos')) {
            if (el.children.length === 0 || (el.children.length === 1 && el.children[0].textContent.trim() === text)) {
              el.remove();
            }
          }
        });
      }
      
      setTimeout(disableElements, 500);
      setTimeout(disableElements, 1000);
      setTimeout(disableElements, 1500);
      
      const observer = new MutationObserver(disableElements);
      observer.observe(document.body, { childList: true, subtree: true });
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
