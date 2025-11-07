import { Stack, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ExperienciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const experienciaUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${id}`;

  const injectedScript = `
    (function() {
      try {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
        document.body.style.marginTop = '0';
        document.body.style.paddingTop = '0';
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'auto';
        console.log('✅ Header y footer ocultos correctamente');
      } catch (e) {
        console.error('❌ Error al ocultar header/footer:', e);
      }
    })();
    true;
  `;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <WebView
          source={{ uri: experienciaUrl }}
          style={styles.webview}
          originWhitelist={['*']}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          setSupportMultipleWindows={false}
          useWebKit={true}
          injectedJavaScript={injectedScript}
        />
      </View>
    </>
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
