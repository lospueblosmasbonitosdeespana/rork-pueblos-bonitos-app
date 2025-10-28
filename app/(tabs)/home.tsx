import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Building2, User, QrCode, MapIcon, ShoppingBag, Newspaper } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import { SPACING } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';

export default function HomeScreen() {
  const { t } = useLanguage();

  const openQRScanner = () => {
    router.push('/qr-scanner' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/01/logo-lpbe.png' }}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.buttonsGrid}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/perfil')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.buttonText}>{t.home.myAccount}</Text>
          </TouchableOpacity>

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
            onPress={openQRScanner}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <QrCode size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.buttonText}>{t.home.qrScanner}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <MapIcon size={32} color="#FFFFFF" strokeWidth={2} />
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
        </View>

        <View style={styles.footerLogo}>
          <Image
            source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/01/logo-lpbe.png' }}
            style={styles.footerLogoImage}
            contentFit="contain"
          />
        </View>

        <View style={styles.footer}>
          <Image
            source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/12/logos-institucionales.png' }}
            style={styles.footerBanner}
            contentFit="contain"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  logoSection: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 100,
    height: 100,
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
  footerLogo: {
    marginTop: SPACING.xl * 2,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  footerLogoImage: {
    width: 200,
    height: 100,
  },
  footer: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  footerBanner: {
    width: '100%',
    height: 120,
  },
});
