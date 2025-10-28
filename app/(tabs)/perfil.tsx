import { useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';

import { COLORS } from '@/constants/theme';

const LOGIN_URL = 'https://lospueblosmasbonitosdeespana.org/login/?app=1';
const ACCOUNT_URL = 'https://lospueblosmasbonitosdeespana.org/account-2/?app=1';
const ALLOWED_DOMAINS = [
  'lospueblosmasbonitosdeespana.org',
  'google.com',
  'gstatic.com',
  'googleapis.com',
  'facebook.com',
  'apple.com'
];

export default function PerfilScreen() {
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(LOGIN_URL);
  const [hasRedirected, setHasRedirected] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    
    console.log('📱 Navigation to:', url);

    if ((url.includes('/account-2/') || url.includes('um_action=profile')) && !hasRedirected) {
      console.log('✅ User logged in, redirecting to account');
      setHasRedirected(true);
      webViewRef.current?.stopLoading();
      setCurrentUrl(ACCOUNT_URL);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const { url } = request;
    
    console.log('🔍 Should load:', url);

    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => url.includes(domain));
    
    if (!isAllowedDomain) {
      console.log('🔗 External link, opening in browser:', url);
      Linking.openURL(url).catch(err => {
        console.warn('❌ Failed to open URL:', err);
      });
      return false;
    }
    
    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        cacheEnabled={false}
        setSupportMultipleWindows={false}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('❌ WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('❌ HTTP error:', nativeEvent.statusCode, nativeEvent.url);
        }}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
