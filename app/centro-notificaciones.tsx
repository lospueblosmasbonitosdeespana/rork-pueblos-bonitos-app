import { Newspaper, AlertTriangle, Snowflake } from 'lucide-react-native';
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
import { router } from 'expo-router';

import { useNotifications } from '@/contexts/notifications';
import { Notificacion } from '@/types/api';

function getSemaforoColor(mensaje: string): string {
  if (!mensaje) return '#9ca3af';
  const text = mensaje.toLowerCase();
  if (text.includes('rojo') || text.includes('recomienda visitar otro')) return '#ef4444';
  if (text.includes('amarillo') || text.includes('alta afluencia')) return '#eab308';
  if (text.includes('verde') || text.includes('perfecto estado')) return '#22c55e';
  return '#9ca3af';
}

function getNotificationIcon(tipo: string) {
  switch (tipo) {
    case 'noticia':
      return { icon: Newspaper, color: '#800000' };
    case 'alerta':
      return { icon: AlertTriangle, color: '#FFA500' };
    case 'nieve':
      return { icon: Snowflake, color: '#4A90E2' };
    case 'semaforo':
      return null;
    default:
      return { icon: Newspaper, color: '#800000' };
  }
}

export default function CentroNotificaciones() {
  const { notificaciones, isLoading, error, markAllAsRead, refreshNotifications, unreadCount } = useNotifications();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = async (item: Notificacion) => {
    if (item.tipo === 'semaforo') {
      return;
    }

    if (item.enlace && item.enlace.trim() !== '') {
      try {
        if (item.tipo === 'noticia') {
          router.push(`/noticia/${item.id}` as any);
        } else {
          let enlaceConParametro = item.enlace;
          if (!enlaceConParametro.includes('?app=1')) {
            enlaceConParametro = enlaceConParametro.includes('?') 
              ? `${enlaceConParametro}&app=1` 
              : `${enlaceConParametro}?app=1`;
          }
          
          const canOpen = await Linking.canOpenURL(enlaceConParametro);
          if (canOpen) {
            await Linking.openURL(enlaceConParametro);
          }
        }
      } catch (error) {
        console.error('❌ Error opening notification:', error);
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
            const IconComponent = iconData?.icon;
            const hasLink = item.tipo !== 'noticia' && item.tipo !== 'alerta' && item.enlace && item.enlace.trim() !== '';
            const subtitleText = getSubtitleText(item.tipo);



            const getSemaforoMessage = () => {
              if (item.tipo === 'semaforo') {
                const mensaje = item.mensaje.toLowerCase();
                const puebloName = item.titulo.replace(/^Semáforo de /i, '').trim();
                
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
              const semaforoMessage = getSemaforoMessage();
              
              return (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    {item.tipo === 'semaforo' ? (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: getSemaforoColor(item.mensaje),
                          marginRight: 10,
                        }}
                      />
                    ) : iconData && IconComponent ? (
                      <View style={[styles.iconCircle, { backgroundColor: iconData.color }]}>
                        <IconComponent size={20} color="#fff" strokeWidth={2} />
                      </View>
                    ) : null}
                    <View style={styles.headerTextContainer}>
                      <Text style={styles.subtitleText}>{subtitleText}</Text>
                      <Text style={styles.cardTitle} numberOfLines={0}>
                        {item.tipo === 'semaforo' 
                          ? item.titulo.replace(/^Semáforo de /i, '').trim() 
                          : item.titulo.replace(/^Nueva noticia:\s*/i, '').trim()}
                      </Text>
                    </View>
                  </View>
                </View>
                {item.tipo === 'semaforo' && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.cardMessage} numberOfLines={6}>
                      {semaforoMessage}
                    </Text>
                  </View>
                )}
                {item.tipo === 'semaforo' && item.motivo && item.motivo.trim() !== '' && (
                  <View style={styles.motivoContainer}>
                    <Text style={styles.motivoLabel}>Motivo:</Text>
                    <Text style={styles.motivoText} numberOfLines={6}>{item.motivo}</Text>
                  </View>
                )}
                {(item.tipo === 'noticia' || item.tipo === 'alerta') && (
                  <View style={styles.linkIndicator}>
                    <Text style={styles.verNoticiasText}>Ver en noticias</Text>
                  </View>
                )}
                {hasLink && item.tipo !== 'semaforo' && (
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
    padding: 10,
    marginBottom: 10,
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
    overflow: 'visible',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  semaforoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 10,
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
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cardMessage: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  },
  linkIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  estadoContainer: {
    marginTop: 6,
  },
  estadoText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  motivoContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexWrap: 'wrap',
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
  verNoticiasText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});
