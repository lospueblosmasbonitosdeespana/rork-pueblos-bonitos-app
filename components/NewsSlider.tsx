import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Noticia } from '@/types/api';

interface NewsSliderProps {
  news: Noticia[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

export default function NewsSlider({ news }: NewsSliderProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / CARD_WIDTH);
      setActiveIndex(index);
    },
    []
  );

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handlePress = (url: string) => {
    if (url) {
      console.log('📰 Opening news:', url);
      router.push({
        pathname: '/noticia/[id]',
        params: { id: 'detail', link: url }
      } as any);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING.md}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: handleScroll,
        })}
        scrollEventThrottle={16}
      >
        {news.map((item) => {
          const imageUrl =
            item._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
            'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800';

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              activeOpacity={0.9}
              onPress={() => handlePress(item.link)}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
              <View style={styles.overlay}>
                <Text style={styles.title} numberOfLines={2}>
                  {stripHtml(item.title.rendered)}
                </Text>
                <Text style={styles.excerpt} numberOfLines={2}>
                  {stripHtml(item.excerpt.rendered)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.pagination}>
        {news.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.gold,
    ...SHADOWS.medium,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  excerpt: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
});
