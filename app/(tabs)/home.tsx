import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Building2, Camera, Compass, ShoppingBag, Newspaper, UserCircle } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SPACING } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';

export default function HomeScreen() {
  const { t } = useLanguage();

  const openQRScanner = () => {
    router.push('/qr-scanner' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <Image
          source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2025/10/logo-lpbe.png' }}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.buttonsGrid}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/pueblos')}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Building2 size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>Pueblos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/rutas')}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Compass size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>{t.home.routes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/tienda' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <ShoppingBag size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>Tienda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/noticias' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Newspaper size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>Noticias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={openQRScanner}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Camera size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>Escanear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <UserCircle size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.buttonText}>Mi Cuenta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0xfio467qr4f09jb113gf' }}
          style={styles.footerBanner}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoSection: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  logo: {
    width: 238,
    height: 102,
  },
  buttonsGrid: {
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  button: {
    width: '45%',
    aspectRatio: 1.2,
    backgroundColor: '#8b2b1a',
    borderRadius: 16,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footer: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  footerBanner: {
    width: '100%',
    height: 120,
  },
});
