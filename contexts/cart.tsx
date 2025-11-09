import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@lpbe_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveCart = useCallback(async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log('💾 Carrito guardado:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error guardando carrito:', error);
    }
  }, [items]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log('🛒 Cargando carrito desde AsyncStorage...');
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setItems(parsed);
          console.log('✅ Carrito cargado:', parsed.length, 'items');
        }
      } catch (error) {
        console.error('❌ Error cargando carrito:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveCart();
    }
  }, [items, isLoading, saveCart]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);
      
      if (existingItem) {
        console.log('🛒 Incrementando cantidad del producto:', newItem.id);
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        console.log('🛒 Añadiendo nuevo producto al carrito:', newItem.id);
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    console.log('🛒 Eliminando producto del carrito:', productId);
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    console.log('🛒 Actualizando cantidad:', productId, '→', quantity);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    console.log('🛒 Vaciando carrito');
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);

  const value = React.useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isLoading,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isLoading]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
}
