import { router } from 'expo-router';
import { ArrowLeft, Newspaper, AlertTriangle, Navigation, Snowflake } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotifications } from '@/contexts/notifications';

interface NotificationItem {
  id: number;
  tipo: 'noticia' | 'alerta' | 'semaforo' | 'nieve';
  titulo: string;
  mensaje: string;
  enlace: string;
  motivo?: string;
}

function getNotificationIcon(tipo: string) {
  switch (tipo) {
    case 'noticia':
      return { icon: Newspaper, color: '#800000', emoji: '📰' };
    case 'semaforo':
      return { icon: Navigation, color: '#FF6B00', emoji: '🚦' };
    case 'alerta':
      return { icon: AlertTriangle, color: '#FFA500', emoji: '⚠️' };
    case 'nieve':
      return { icon: Snowflake, color: '#4A90E2', emoji: '❄️' };
    default:
      return { icon: Newspaper, color: '#800000', emoji: '📰' };
  }
}

export default function CentroNotificaciones() {
  const { notificaciones, isLoading, error, markAllAsRead, refreshNotifications, unreadCount } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.tipo === 'semaforo') {
      return;
    }

    if (item.enlace && item.enlace.trim() !== '') {
      try {
        const canOpen = await Linking.canOpenURL(item.enlace);
        if (canOpen) {
          await Linking.openURL(item.enlace);
        }
      } catch (error) {
        console.error('Error opening link:', error);
      }
    }
  };

  const getSubtitleText = (tipo: string): string => {
    switch (tipo) {
      case 'noticia':
        return 'Noticia nueva';
      case 'semaforo':
        return 'Actualización de estado';
      case 'alerta':
        return 'Aviso importante';
      case 'nieve':
        return 'Alerta meteorológica';
      default:
        return '';
    }
  };

  if (isLoading && notificaciones.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#800000" />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && notificaciones.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#800000" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centro de Notificaciones</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#FF6B00" />
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorText}>
            No se pudieron cargar las notificaciones. Por favor, verifica tu conexión a internet.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshNotifications}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
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
          <Text style={styles.emptyText}>No hay notificaciones disponibles</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => String(item.id)}
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
            const iconData = getNotificationIcon(item.tipo);
            const IconComponent = iconData.icon;
            const hasLink = item.tipo === 'noticia' && item.enlace && item.enlace.trim() !== '';
            const subtitleText = getSubtitleText(item.tipo);

            const getSemaforoColor = () => {
              if (item.tipo === 'semaforo') {
                const mensaje = item.mensaje.toLowerCase();
                if (mensaje.includes('verde')) return '#22c55e';
                if (mensaje.includes('amarillo')) return '#eab308';
                if (mensaje.includes('rojo')) return '#ef4444';
              }
              return null;
            };

            const getSemaforoMessage = () => {
              if (item.tipo === 'semaforo') {
                const mensaje = item.mensaje.toLowerCase();
                const puebloName = item.titulo.replace('Semáforo de ', '');
                
                if (mensaje.includes('verde')) {
                  return `${puebloName} está en perfecto estado para ser visitado.`;
                }
                if (mensaje.includes('amarillo')) {
                  return `${puebloName} tiene una alta afluencia de visitantes estos días.`;
                }
                if (mensaje.includes('rojo')) {
                  return 'Se recomienda visitar otro pueblo de la asociación.';
                }
              }
              return item.mensaje;
            };

            const renderContent = () => {
              const semaforoColor = getSemaforoColor();
              const semaforoMessage = getSemaforoMessage();
              
              return (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    {item.tipo === 'semaforo' && semaforoColor ? (
                      <View style={[styles.semaforoCircle, { backgroundColor: semaforoColor }]} />
                    ) : (
                      <View style={[styles.iconCircle, { backgroundColor: iconData.color }]}>
                        <IconComponent size={20} color="#fff" strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.headerTextContainer}>
                      <Text style={styles.subtitleText}>{subtitleText}</Text>
                      <Text style={styles.cardTitle}>{item.titulo}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.messageContainer}>
                  <Text style={styles.cardMessage}>
                    {semaforoMessage}
                  </Text>
                </View>
                {item.tipo === 'semaforo' && (
                  <View style={styles.estadoContainer}>
                    <Text style={styles.estadoText}>
                      {item.mensaje}
                    </Text>
                  </View>
                )}
                {item.tipo === 'semaforo' && item.motivo && item.motivo.trim() !== '' && (
                  <View style={styles.motivoContainer}>
                    <Text style={styles.motivoLabel}>Motivo:</Text>
                    <Text style={styles.motivoText}>{item.motivo}</Text>
                  </View>
                )}
                {hasLink && (
                  <View style={styles.linkIndicator}>
                    <Text style={styles.linkText}>Toca para abrir ›</Text>
                  </View>
                )}
              </>
            );
            };

            if (hasLink) {
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#800000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
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
  cardHeader: {
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  semaforoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  subtitleText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  linkIndicator: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  estadoContainer: {
    marginTop: 8,
  },
  estadoText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  motivoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  motivoLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  motivoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  linkText: {
    fontSize: 13,
    color: '#800000',
    fontWeight: '600',
  },
});
