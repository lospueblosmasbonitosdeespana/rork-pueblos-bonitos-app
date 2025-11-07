import { Stack, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ExperienciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const experienciaUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${id}`;

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
