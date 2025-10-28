import { router } from 'expo-router';
import { ArrowLeft, Zap } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotifications } from '@/contexts/notifications';

function formatDate(fecha: string | undefined | null): string {
  if (!fecha) {
    return '';
  }

  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return '';
  }
}

export default function CentroNotificaciones() {
  const { notificaciones, isLoading, markAllAsRead, refreshNotifications, unreadCount } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = (item: any) => {
    if (item.tipo === 'push' && item.post_id) {
      router.push(`/noticia/${item.post_id}`);
    }
  };

  const getDateText = (item: any): string => {
    const formattedDate = formatDate(item.fecha);
    
    if (formattedDate) {
      return formattedDate;
    }

    if (item.tipo === 'semaforo') {
      return 'Actualización de semáforo';
    }

    if (item.tipo === 'silenciosa') {
      return 'Notificación automática';
    }

    return '';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#800000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#800000" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Notificaciones</Text>
        <View style={styles.placeholder} />
      </View>

      {notificaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay notificaciones</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item._ID}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshNotifications}
              colors={['#800000']}
              tintColor="#800000"
            />
          }
          renderItem={({ item, index }) => {
            const isUnread = index < unreadCount;
            const isPush = item.tipo === 'push';
            const isClickable = isPush && item.post_id;
            const dateText = getDateText(item);

            const renderContent = () => (
              <>
                {dateText ? (
                  <Text style={styles.cardDate}>{dateText}</Text>
                ) : null}
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    {isPush && (
                      <View style={styles.pushBadge}>
                        <Zap size={14} color="#fff" fill="#fff" strokeWidth={2} />
                      </View>
                    )}
                    <Text style={[styles.cardTitle, isPush && styles.cardTitleWithBadge]}>
                      {item.titulo}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMessage}>{item.mensaje}</Text>
              </>
            );

            if (isClickable) {
              return (
                <TouchableOpacity
                  style={[styles.card, isUnread && styles.cardUnread]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                >
                  {renderContent()}
                </TouchableOpacity>
              );
            }

            return (
              <View style={[styles.card, isUnread && styles.cardUnread]}>
                {renderContent()}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pushBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  cardTitleWithBadge: {
    flex: 1,
  },
  cardMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
});
