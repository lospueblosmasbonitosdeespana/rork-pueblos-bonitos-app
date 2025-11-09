import { View, StyleSheet, TouchableOpacity, Text, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function RutasScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState('https://lospueblosmasbonitosdeespana.org/rutas-app/?app=1');
  const [canGoBack, setCanGoBack] = useState(false);

  const isInRouteDetail = useCallback((url: string) => {
    return url.includes('lospueblosmasbonitosdeespana.org') && 
           !url.includes('/category/rutas/') && 
           !url.includes('/rutas-app/');
  }, []);

  const handleBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    
    if (isInRouteDetail(currentUrl)) {
      webViewRef.current?.injectJavaScript(`
        window.location.href = 'https://lospueblosmasbonitosdeespana.org/category/rutas/';
        true;
      `);
      return true;
    }
    
    return false;
  }, [canGoBack, currentUrl, isInRouteDetail]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/rutas-app/?app=1' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        incognito={false}
        cacheEnabled={true}
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        startInLoadingState={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="always"
        bounces={false}
        showsVerticalScrollIndicator={false}
        onNavigationStateChange={(navState) => {
          setCurrentUrl(navState.url);
          setCanGoBack(navState.canGoBack);
        }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          
          if (url.includes('lospueblosmasbonitosdeespana.org')) {
            return true;
          }
          
          return false;
        }}
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            window.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                const links = document.querySelectorAll('a, button');
                links.forEach(function(element) {
                  const text = element.textContent || '';
                  if (text.toLowerCase().includes('saber más') || text.toLowerCase().includes('saber mas')) {
                    element.style.pointerEvents = 'none';
                    element.style.cursor = 'default';
                    element.onclick = function(e) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    };
                    if (element.href) {
                      element.removeAttribute('href');
                    }
                  }
                });
              }, 500);
            });
          })();
          true;
        `}
        injectedJavaScript={`
          (function() {
            const style = document.createElement('style');
            style.innerHTML = 'html, body { overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; touch-action: pan-y !important; }';
            document.head.appendChild(style);
            
            const links = document.querySelectorAll('a, button');
            links.forEach(function(element) {
              const text = element.textContent || '';
              if (text.toLowerCase().includes('saber más') || text.toLowerCase().includes('saber mas')) {
                element.style.pointerEvents = 'none';
                element.style.cursor = 'default';
                element.onclick = function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                };
                if (element.href) {
                  element.removeAttribute('href');
                }
              }
            });
          })();
          true;
        `}
      />
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <ChevronLeft size={24} color="#fff" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
