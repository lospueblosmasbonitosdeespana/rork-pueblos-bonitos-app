import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function RutasScreen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://lospueblosmasbonitosdeespana.org/category/rutas/' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
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
