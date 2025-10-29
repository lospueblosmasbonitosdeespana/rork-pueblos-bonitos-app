import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/01/logo-lpbe.png' }}
          style={styles.logoTop}
          contentFit="contain"
        />
      </View>
      
      <View style={styles.institutionalContainer}>
        <Image
          source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/12/logos-institucionales.png' }}
          style={styles.logoBottom}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logoTop: {
    width: '100%',
    height: 200,
  },
  institutionalContainer: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoBottom: {
    width: '100%',
    height: 120,
  },
});
