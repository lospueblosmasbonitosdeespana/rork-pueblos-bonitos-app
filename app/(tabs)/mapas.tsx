import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function MapasScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centerContainer}>
        <MapPin size={64} color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  submessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
