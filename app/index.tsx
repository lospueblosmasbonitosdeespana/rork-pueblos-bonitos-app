import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('📱 Splash screen montado');
    
    const fallbackTimer = setTimeout(() => {
      if (!hasNavigated) {
        console.log('⌛ Navegando a home (fallback timer)');
        setHasNavigated(true);
        router.replace('/(tabs)/home');
      }
    }, 3000);

    return () => {
      console.log('🔄 Limpiando splash screen');
      clearTimeout(fallbackTimer);
    };
  }, [hasNavigated]);

  useEffect(() => {
    if (!imageLoaded) return;
    
    console.log('🖼️ Imagen cargada, esperando antes de navegar...');
    const timer = setTimeout(() => {
      if (!hasNavigated) {
        console.log('✅ Navegando a home');
        setHasNavigated(true);
        router.replace('/(tabs)/home');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [imageLoaded, hasNavigated]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/tzxi62phfj1t5m9olic0m' }}
        style={styles.splashImage}
        contentFit="cover"
        onLoad={() => {
          console.log('✅ Imagen del splash cargada');
          setImageLoaded(true);
        }}
        onError={(error) => {
          console.error('❌ Error loading splash image:', error);
          setImageLoaded(true);
        }}
      />
      {!imageLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B4513" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
