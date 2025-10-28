import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function RutasScreen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/category/rutas/?app=1' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        startInLoadingState={true}
      />
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
});
