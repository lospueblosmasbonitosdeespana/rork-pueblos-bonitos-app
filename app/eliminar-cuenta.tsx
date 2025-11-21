import { X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

const LPBE_RED = '#c1121f';
const DELETE_ACCOUNT_URL = 'https://lospueblosmasbonitosdeespana.org/account-2/delete/';

export default function EliminarCuentaScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={28} color="#333" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
        </View>
      )}

      {Platform.OS === 'web' ? (
        <View style={styles.webview}>
          <iframe
            src={DELETE_ACCOUNT_URL}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              border: 'none',
            } as any}
            onLoad={() => setLoading(false)}
          />
        </View>
      ) : (
        <WebView
          source={{ uri: DELETE_ACCOUNT_URL }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onLoadStart={() => setLoading(true)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 1000,
  },
  webview: {
    flex: 1,
  },
});
