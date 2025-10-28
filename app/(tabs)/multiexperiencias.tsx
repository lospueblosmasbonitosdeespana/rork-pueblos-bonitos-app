import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Search, QrCode, ChevronRight } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';
import { fetchMultiexperiencias } from '@/services/api';
import { Multiexperiencia } from '@/types/api';

interface ExperienciaSection {
  title: string;
  data: Multiexperiencia[];
}

export default function MultiexperienciasScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const experienciasQuery = useQuery({
    queryKey: ['multiexperiencias'],
    queryFn: fetchMultiexperiencias,
  });

  const experiencias = experienciasQuery.data || [];

  const groupedExperiencias = useMemo<ExperienciaSection[]>(() => {
    const filtered = experiencias.filter(
      (exp) =>
        exp.pueblo_nombre &&
        (exp.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.pueblo_nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const grouped = filtered.reduce((acc, exp) => {
      const puebloNombre = exp.pueblo_nombre || 'Sin pueblo';
      if (!acc[puebloNombre]) {
        acc[puebloNombre] = [];
      }
      acc[puebloNombre].push(exp);
      return acc;
    }, {} as Record<string, Multiexperiencia[]>);

    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((pueblo) => ({
        title: pueblo,
        data: grouped[pueblo],
      }));
  }, [experiencias, searchQuery]);

  const renderSectionHeader = ({ section }: { section: ExperienciaSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {section.data.length} experiencia{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderExperiencia = ({ item }: { item: Multiexperiencia }) => {
    return (
      <TouchableOpacity
        style={styles.experienciaCard}
        onPress={() => router.push(`/multiexperiencia/${item._ID}` as any)}
        activeOpacity={0.7}
      >
        {item.foto && (
          <Image
            source={{ uri: item.foto }}
            style={styles.experienciaImage}
            contentFit="cover"
          />
        )}
        <View style={styles.experienciaContent}>
          <Text style={styles.experienciaName} numberOfLines={2}>
            {item.nombre}
          </Text>
          {item.descripcion && (
            <Text style={styles.experienciaDescription} numberOfLines={2}>
              {item.descripcion}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.multiexperiencias.searchPlaceholder}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => router.push('/qr-scanner' as any)}
          activeOpacity={0.7}
        >
          <QrCode size={24} color={COLORS.card} />
        </TouchableOpacity>
      </View>

      {experienciasQuery.isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.multiexperiencias.loading}</Text>
        </View>
      ) : experienciasQuery.error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {experienciasQuery.error instanceof Error 
              ? experienciasQuery.error.message 
              : 'No se pudieron cargar los datos'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => experienciasQuery.refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={groupedExperiencias}
          renderItem={renderExperiencia}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item._ID}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? t.multiexperiencias.noResults
                  : t.multiexperiencias.noResults}
              </Text>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    paddingVertical: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.beige,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  sectionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  experienciaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  experienciaImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.beige,
  },
  experienciaContent: {
    flex: 1,
  },
  experienciaName: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 4,
  },
  experienciaDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600' as const,
    color: COLORS.card,
  },
});
