import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/cart';
import { useAuth } from '@/contexts/auth';
import { CheckCircle } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

const LPBE_RED = '#d60000';
const CONSUMER_KEY = 'ck_c98c3651ff32de8a2435dac50c34ac292eb26963';
const CONSUMER_SECRET = 'cs_1195b6ab18bb1c5f1f89cff976ad111151c23aaa';

interface OrderData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
}

export default function PagoScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [orderData, setOrderData] = useState<OrderData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.id) {
        console.log('👤 Usuario no autenticado, formulario vacío');
        return;
      }

      setIsLoadingUserData(true);
      console.log('👤 Cargando datos del usuario:', user.id);

      try {
        const response = await fetch(
          `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/user-profile?user_id=${user.id}`
        );

        if (!response.ok) {
          console.warn('⚠️ No se pudieron cargar los datos del usuario');
          return;
        }

        const userData = await response.json();
        console.log('✅ Datos del usuario cargados:', userData);

        setOrderData({
          nombre: userData.first_name || user.first_name || '',
          apellidos: userData.last_name || user.last_name || '',
          email: userData.email || user.email || '',
          telefono: userData.phone || '',
          direccion: userData.billing_address_1 || '',
          ciudad: userData.billing_city || '',
          codigoPostal: userData.billing_postcode || '',
        });
      } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, user]);

  const handleInputChange = (field: keyof OrderData, value: string) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const { nombre, apellidos, email, telefono, direccion, ciudad, codigoPostal } = orderData;
    
    if (!nombre.trim() || !apellidos.trim() || !email.trim() || !telefono.trim() || 
        !direccion.trim() || !ciudad.trim() || !codigoPostal.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor, introduce un email válido');
      return false;
    }
    
    return true;
  };

  const createOrder = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    console.log('🛒 Creando pedido WooCommerce...');

    try {
      const lineItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        payment_method: 'stripe',
        payment_method_title: 'Tarjeta (Stripe)',
        set_paid: false,
        billing: {
          first_name: orderData.nombre,
          last_name: orderData.apellidos,
          email: orderData.email,
          phone: orderData.telefono,
          address_1: orderData.direccion,
          city: orderData.ciudad,
          postcode: orderData.codigoPostal,
          country: 'ES',
        },
        shipping: {
          first_name: orderData.nombre,
          last_name: orderData.apellidos,
          address_1: orderData.direccion,
          city: orderData.ciudad,
          postcode: orderData.codigoPostal,
          country: 'ES',
        },
        line_items: lineItems,
      };

      console.log('📦 Payload del pedido:', JSON.stringify(orderPayload, null, 2));

      const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wc/v3/orders?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error creando pedido:', response.status, errorText);
        throw new Error('Error al crear el pedido');
      }

      const orderResponse = await response.json();
      console.log('✅ Pedido creado:', orderResponse);

      setOrderNumber(orderResponse.id);

      if (orderResponse.payment_url) {
        console.log('💳 URL de pago Stripe recibida:', orderResponse.payment_url);
        setPaymentUrl(orderResponse.payment_url);
        setShowPaymentModal(true);
      } else {
        console.log('⚠️ No se recibió URL de pago, mostrando éxito directamente');
        setOrderSuccess(true);
        clearCart();
      }
      
    } catch (error) {
      console.error('❌ Error procesando pedido:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el pedido. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    console.log('✅ Pago completado');
    setShowPaymentModal(false);
    setOrderSuccess(true);
    clearCart();
  };

  const handlePaymentCancel = () => {
    console.log('❌ Pago cancelado');
    setShowPaymentModal(false);
    Alert.alert(
      'Pago cancelado',
      'El pago ha sido cancelado. Tu pedido sigue activo y puedes completarlo más tarde desde tu cuenta.',
      [
        { text: 'Volver a la tienda', onPress: () => router.push('/tienda') },
        { text: 'Reintentar', onPress: () => setShowPaymentModal(true) },
      ]
    );
  };

  if (orderSuccess) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle size={80} color="#22c55e" />
        <Text style={styles.successTitle}>¡Gracias por tu compra!</Text>
        <Text style={styles.successMessage}>
          Tu pedido #{orderNumber} ha sido procesado con éxito.
        </Text>
        <Text style={styles.successInfo}>
          Recibirás un email de confirmación con todos los detalles.
        </Text>
        <TouchableOpacity
          style={styles.backToStoreButton}
          onPress={() => router.push('/tienda')}
          activeOpacity={0.8}
        >
          <Text style={styles.backToStoreButtonText}>Volver a la tienda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {isLoadingUserData && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={LPBE_RED} />
            <Text style={styles.loadingText}>Cargando tus datos...</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de facturación</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre *"
          value={orderData.nombre}
          onChangeText={(value) => handleInputChange('nombre', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Apellidos *"
          value={orderData.apellidos}
          onChangeText={(value) => handleInputChange('apellidos', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={orderData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Teléfono *"
          value={orderData.telefono}
          onChangeText={(value) => handleInputChange('telefono', value)}
          keyboardType="phone-pad"
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Dirección *"
          value={orderData.direccion}
          onChangeText={(value) => handleInputChange('direccion', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Ciudad *"
          value={orderData.ciudad}
          onChangeText={(value) => handleInputChange('ciudad', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Código Postal *"
          value={orderData.codigoPostal}
          onChangeText={(value) => handleInputChange('codigoPostal', value)}
          keyboardType="numeric"
          editable={!isProcessing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del pedido</Text>
        
        {items.map((item) => (
          <View key={item.id} style={styles.summaryItem}>
            <Text style={styles.summaryName}>
              {item.name} x {item.quantity}
            </Text>
            <Text style={styles.summaryPrice}>
              {(parseFloat(item.price) * item.quantity).toFixed(2)} €
            </Text>
          </View>
        ))}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} €</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.paymentNote}>
          Método de pago: Tarjeta (Stripe)
        </Text>
        <Text style={styles.paymentInfo}>
          El pago se procesará de forma segura a través de Stripe.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
        onPress={createOrder}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Realizar pedido</Text>
        )}
      </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePaymentCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pago seguro - Stripe</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handlePaymentCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webview}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              bounces={true}
              overScrollMode="always"
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              automaticallyAdjustContentInsets={false}
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={LPBE_RED} />
                  <Text style={styles.webviewLoadingText}>Cargando pasarela de pago...</Text>
                </View>
              )}
              onNavigationStateChange={(navState) => {
                console.log('🌐 WebView URL:', navState.url);
                
                if (navState.url.includes('checkout/success') || 
                    navState.url.includes('/order-received/') ||
                    navState.url.includes('payment-complete')) {
                  console.log('✅ Pago completado detectado');
                  setTimeout(() => handlePaymentComplete(), 1000);
                }
                
                if (navState.url.includes('checkout/cancel') ||
                    navState.url.includes('payment-cancelled')) {
                  console.log('❌ Pago cancelado detectado');
                  handlePaymentCancel();
                }
              }}
            />
          )}
        </View>
      </Modal>
    </>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: LPBE_RED,
  },
  paymentNote: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  paymentInfo: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: LPBE_RED,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#000',
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  successInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backToStoreButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backToStoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: LPBE_RED,
    fontWeight: '600' as const,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webviewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
