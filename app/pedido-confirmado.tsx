import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LPBE_RED = '#d60000';

export default function PedidoConfirmadoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackToStore = () => {
    router.push('/tienda');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Image
        source={{
          uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2020/01/cropped-logo-pueblos-1.png',
        }}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Gracias por tu compra</Text>
      
      <Text style={styles.message}>
        Tu pedido se ha registrado correctamente.{'\n'}
        Recibirás un email con los detalles.
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleBackToStore}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Volver a la tienda</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 200,
    height: 80,
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
});
