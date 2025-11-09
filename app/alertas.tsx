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
    (n) => n.tipo === 'alerta'
  );

  const semaforos = (notificacionesQuery.data || []).filter(
    (n) => n.tipo === 'semaforo'
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Alertas y Avisos',
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

          {notificacionesQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.home.loading}</Text>
            </View>
          )}

          {alertas.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Alertas</Text>
              </View>
              <View style={styles.alertsContainer}>
                {alertas.map((notification) => (
                  <View key={notification.id} style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>{notification.titulo}</Text>
                    <Text style={styles.notificationMessage}>{notification.mensaje}</Text>
                  </View>
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
                  <View key={notification.id} style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>{notification.titulo}</Text>
                    <Text style={styles.notificationMessage}>{notification.mensaje}</Text>
                  </View>
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
  notificationItem: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
