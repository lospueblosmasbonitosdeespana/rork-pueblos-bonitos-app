import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft } from 'lucide-react-native';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { fetchNoticias } from '@/services/api';
import { Noticia } from '@/types/api';

export default function NoticiasScreen() {

  const noticiasQuery = useQuery({
    queryKey: ['noticias'],
    queryFn: fetchNoticias,
  });

  const noticias = noticiasQuery.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&[a-zA-Z0-9#]+;/g, ' ').trim();
  };

  const renderNoticia = ({ item }: { item: Noticia }) => {
    const imageUrl = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const title = stripHtml(item.title.rendered);
    const excerpt = stripHtml(item.excerpt.rendered);

    return (
      <TouchableOpacity
        style={styles.noticiaCard}
        onPress={() => {
          const encodedLink = encodeURIComponent(item.link);
          router.push(`/noticia/${item.id}?link=${encodedLink}` as any);
        }}
        activeOpacity={0.7}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.noticiaImage}
            contentFit="cover"
          />
        )}
        <View style={styles.noticiaContent}>
          <Text style={styles.noticiaDate}>{formatDate(item.date)}</Text>
          <Text style={styles.noticiaTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.noticiaExcerpt} numberOfLines={3}>
            {excerpt}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Últimas Noticias',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {noticiasQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando noticias...</Text>
        </View>
      ) : noticiasQuery.error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error al cargar las noticias</Text>
        </View>
      ) : (
        <FlatList
          data={noticias}
          renderItem={renderNoticia}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No hay noticias disponibles</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  noticiaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  noticiaImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.beige,
  },
  noticiaContent: {
    padding: SPACING.lg,
  },
  noticiaDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  noticiaTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  noticiaExcerpt: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
