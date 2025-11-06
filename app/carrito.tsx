import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/cart';
import { Trash2, Plus, Minus } from 'lucide-react-native';

const LPBE_RED = '#d60000';

export default function CarritoScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, isLoading } = useCart();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={LPBE_RED} />
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Tu carrito está vacío</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/tienda')}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Ir a la tienda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: typeof items[0] }) => {
    const itemPrice = parseFloat(item.price) || 0;
    const subtotal = itemPrice * item.quantity;

    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.itemPrice}>{item.price} €</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              activeOpacity={0.7}
            >
              <Minus size={18} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtotalText}>
            Subtotal: {subtotal.toFixed(2)} €
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color={LPBE_RED} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
      
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} €</Text>
        </View>
        
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/pago')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Tramitar pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: LPBE_RED,
  },
  checkoutButton: {
    backgroundColor: LPBE_RED,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
