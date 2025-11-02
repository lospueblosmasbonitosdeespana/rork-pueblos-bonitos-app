import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LPBE_RED = '#c1121f';

export default function MapaPueblosVisitadosScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centerContainer}>
        <MapPin size={64} color={LPBE_RED} />
        <Text style={styles.message}>Mapa desactivado temporalmente</Text>
        <Text style={styles.submessage}>
          Esta función se encuentra en mantenimiento
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 16,
  },
  submessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
