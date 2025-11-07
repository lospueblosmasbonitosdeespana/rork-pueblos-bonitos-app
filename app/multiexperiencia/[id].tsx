import { useLocalSearchParams, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

function MultiexperienciaDetailScreen() {
  const { id } = useLocalSearchParams();
  const experienciaId = Array.isArray(id) ? id[0] : id;
  
  const webviewUrl = `https://lospueblosmasbonitosdeespana.org/experiencias-public/?id_lugar=${experienciaId}`;
  
  console.log('🌍 Cargando multiexperiencia con id:', experienciaId);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <WebView
        source={{ uri: webviewUrl }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        useWebKit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default gestureHandlerRootHOC(MultiexperienciaDetailScreen);
