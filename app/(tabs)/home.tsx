import { router } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Newspaper, ShoppingBag } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ImageBackground } from 'react-native';

import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';

export default function HomeScreen() {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2024/01/logo-lpbe.png' }}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.headerTitle}>{t.home.title1}</Text>
            <Text style={[styles.headerTitle, styles.headerTitleAccent]}>
              {t.home.title2}
            </Text>
            <Text style={styles.welcomeText}>{t.home.welcome}</Text>
          </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            onPress={() => router.push('/(tabs)/pueblos')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <MapPin size={28} color={COLORS.card} strokeWidth={1.5} />
            </View>
            <Text style={styles.cardTitle}>{t.home.discoverVillages}</Text>
            <Text style={styles.cardDescription}>{t.home.discoverVillagesDesc}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSecondary]}
            onPress={() => router.push('/noticias' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconContainer, styles.cardIconSecondary]}>
              <Newspaper size={28} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleDark]}>{t.home.latestNews}</Text>
            <Text style={[styles.cardDescription, styles.cardDescriptionDark]}>{t.home.latestNewsDesc}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSecondary]}
            onPress={() => router.push('/tienda' as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconContainer, styles.cardIconSecondary]}>
              <ShoppingBag size={28} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleDark]}>{t.home.shop}</Text>
            <Text style={[styles.cardDescription, styles.cardDescriptionDark]}>{t.home.shopDesc}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 43, 26, 0.1)',
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300' as const,
    lineHeight: 36,
    color: COLORS.text,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerTitleAccent: {
    color: COLORS.primary,
    fontWeight: '700' as const,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  cardsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  cardPrimary: {
    backgroundColor: '#8b2b1a',
    ...SHADOWS.large,
  },
  cardSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(139, 43, 26, 0.15)',
    ...SHADOWS.medium,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardIconSecondary: {
    backgroundColor: COLORS.beige,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    color: COLORS.card,
    marginBottom: SPACING.xs,
  },
  cardTitleDark: {
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardDescriptionDark: {
    color: COLORS.textSecondary,
  },
});
