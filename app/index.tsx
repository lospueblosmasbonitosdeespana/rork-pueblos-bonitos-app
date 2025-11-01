import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, imageLoaded ? 2500 : 1500);

    return () => clearTimeout(timer);
  }, [imageLoaded]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/tzxi62phfj1t5m9olic0m' }}
        style={styles.splashImage}
        contentFit="cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          console.log('Error loading splash image');
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
