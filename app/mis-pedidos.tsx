import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { Package, Calendar, CreditCard, ChevronRight } from 'lucide-react-native';

const LPBE_RED = '#d60000';
const CONSUMER_KEY = 'ck_c98c3651ff32de8a2435dac50c34ac292eb26963';
const CONSUMER_SECRET = 'cs_1195b6ab18bb1c5f1f89cff976ad111151c23aaa';

interface Order {
  id: number;
  order_key: string;
  status: string;
  total: string;
  date_created: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  'on-hold': 'En espera',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  failed: 'Fallido',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  'on-hold': '#6b7280',
  completed: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#8b5cf6',
  failed: '#dc2626',
};

export default function MisPedidosScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.replace('/login');
      return;
    }

    loadOrders();
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    if (!user?.email) {
      setError('No se pudo obtener el email del usuario');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('📦 Cargando pedidos del usuario:', user.email);

      const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wc/v3/orders?customer=${user.id}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los pedidos');
      }

      const data = await response.json();
      console.log('✅ Pedidos cargados:', data.length);
      
      setOrders(data);
    } catch (err) {
      console.error('❌ Error cargando pedidos:', err);
      setError('No se pudieron cargar tus pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={LPBE_RED} />
        <Text style={styles.loadingText}>Cargando tus pedidos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Package size={64} color="#ccc" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadOrders}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Package size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No tienes pedidos</Text>
        <Text style={styles.emptyMessage}>
          Cuando realices una compra, tus pedidos aparecerán aquí
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push('/tienda')}
          activeOpacity={0.8}
        >
          <Text style={styles.shopButtonText}>Ir a la tienda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.title}>Mis pedidos</Text>
      
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
              <View style={styles.orderMeta}>
                <Calendar size={14} color="#666" />
                <Text style={styles.orderDate}>{formatDate(order.date_created)}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: STATUS_COLORS[order.status] || '#6b7280' },
              ]}
            >
              <Text style={styles.statusText}>
                {STATUS_LABELS[order.status] || order.status}
              </Text>
            </View>
          </View>

          <View style={styles.orderItems}>
            {order.line_items.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name} x {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>{item.total} €</Text>
              </View>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.orderTotal}>
              <CreditCard size={16} color="#000" />
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>{order.total} €</Text>
            </View>
            
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                Alert.alert(
                  'Detalles del pedido',
                  `Pedido #${order.id}\nEstado: ${STATUS_LABELS[order.status] || order.status}\nTotal: ${order.total} €\n\nPara más detalles, revisa tu email de confirmación.`
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.viewButtonText}>Ver detalles</Text>
              <ChevronRight size={16} color={LPBE_RED} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: LPBE_RED,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  emptyMessage: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: LPBE_RED,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  orderFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: LPBE_RED,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: LPBE_RED,
  },
});
