import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CircleDot } from 'lucide-react-native';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  RefreshControl,
} from 'react-native';

import NotificationCard from '@/components/NotificationCard';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';
import { fetchNotificaciones } from '@/services/api';

export default function AlertasScreen() {
  const { t } = useLanguage();

  const notificacionesQuery = useQuery({
    queryKey: ['notificaciones'],
    queryFn: fetchNotificaciones,
  });

  const alertas = (notificacionesQuery.data || []).filter(
    (n) => n.tipo === 'alerta' || n.tipo === 'urgente'
  ).sort(
    (a, b) =>
      new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
  );

  const semaforos = (notificacionesQuery.data || []).filter(
    (n) => n.tipo === 'info'
  ).sort(
    (a, b) =>
      new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t.home.alertsAndNotifications,
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTintColor: COLORS.primary,
        }} 
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={notificacionesQuery.isRefetching} 
              onRefresh={() => notificacionesQuery.refetch()} 
            />
          }
        >
          <View style={styles.header}>
            <AlertTriangle size={32} color={COLORS.primary} />
            <Text style={styles.headerTitle}>{t.home.alertsAndNotifications}</Text>
            <Text style={styles.headerSubtitle}>{t.home.alertsDesc}</Text>
          </View>

          {notificacionesQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.home.loading}</Text>
            </View>
          )}

          {alertas.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t.home.alertsAndNotifications}</Text>
              </View>
              <View style={styles.alertsContainer}>
                {alertas.map((notification) => (
                  <NotificationCard key={notification._ID} notification={notification} />
                ))}
              </View>
            </View>
          )}

          {semaforos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CircleDot size={24} color={COLORS.green} />
                <Text style={styles.sectionTitle}>Estado de Semáforos</Text>
              </View>
              <View style={styles.alertsContainer}>
                {semaforos.map((notification) => (
                  <NotificationCard key={notification._ID} notification={notification} />
                ))}
              </View>
            </View>
          )}

          {alertas.length === 0 && semaforos.length === 0 && !notificacionesQuery.isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay avisos disponibles</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.beige,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  section: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.beige,
    marginHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.beige,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  alertsContainer: {
    backgroundColor: COLORS.beige,
    paddingBottom: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
