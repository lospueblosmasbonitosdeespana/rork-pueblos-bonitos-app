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
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/cart';
import { useAuth } from '@/contexts/auth';
import { WebView } from 'react-native-webview';
import { ChevronLeft } from 'lucide-react-native';

const LPBE_RED = '#d60000';
const CONSUMER_KEY = 'ck_c98c3651ff32de8a2435dac50c34ac292eb26963';
const CONSUMER_SECRET = 'cs_1195b6ab18bb1c5f1f89cff976ad111151c23aaa';

interface OrderData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  pais: string;
  ciudad: string;
}

interface WooCommerceOrder {
  id: number;
  payment_url?: string;
  order_key?: string;
  status: string;
}

interface ShippingMethod {
  instance_id: string;
  title: string;
  cost: string;
  method_id: string;
  method_title: string;
}

export default function PagoScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, userId } = useAuth();
  
  const [orderData, setOrderData] = useState<OrderData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    codigoPostal: '',
    pais: 'ES',
    ciudad: '',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && userId) {
        try {
          console.log('👤 Cargando datos del usuario:', userId);
          const response = await fetch(
            `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/user-profile?user_id=${userId}`
          );

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Datos de usuario cargados:', userData);

            setOrderData({
              nombre: userData.first_name || '',
              apellidos: userData.last_name || '',
              email: userData.email || '',
              telefono: userData.phone || '',
              direccion: userData.address || '',
              codigoPostal: userData.postal_code || '',
              pais: userData.country || 'ES',
              ciudad: userData.city || '',
            });
          }
        } catch (error) {
          console.error('❌ Error cargando datos del usuario:', error);
        }
      }
      setIsLoadingUserData(false);
    };

    loadUserData();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    const loadShippingMethods = async () => {
      if (!orderData.pais || !orderData.codigoPostal) return;
      
      try {
        console.log('📦 Cargando métodos de envío para país:', orderData.pais);
        
        const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wc/store/v1/shipping-methods`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const methods = await response.json();
          console.log('✅ Métodos de envío disponibles:', methods);
          
          if (Array.isArray(methods) && methods.length > 0) {
            const defaultMethod = methods[0];
            setShippingMethod({
              instance_id: defaultMethod.instance_id || '1',
              title: defaultMethod.title || 'Paq Premium Domicilio',
              cost: defaultMethod.cost || '4.66',
              method_id: defaultMethod.method_id || 'flat_rate',
              method_title: defaultMethod.method_title || 'Paq Premium Domicilio',
            });
            setShippingCost(parseFloat(defaultMethod.cost || '4.66'));
          }
        } else {
          console.log('⚠️ No se pudieron cargar métodos de envío, usando valor por defecto');
          setShippingMethod({
            instance_id: '1',
            title: 'Paq Premium Domicilio',
            cost: '4.66',
            method_id: 'flat_rate',
            method_title: 'Paq Premium Domicilio',
          });
          setShippingCost(4.66);
        }
      } catch (error) {
        console.error('❌ Error cargando métodos de envío:', error);
        setShippingMethod({
          instance_id: '1',
          title: 'Paq Premium Domicilio',
          cost: '4.66',
          method_id: 'flat_rate',
          method_title: 'Paq Premium Domicilio',
        });
        setShippingCost(4.66);
      }
    };

    loadShippingMethods();
  }, [orderData.pais, orderData.codigoPostal]);

  const handleInputChange = (field: keyof OrderData, value: string) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const { nombre, apellidos, email, telefono, direccion, codigoPostal, pais, ciudad } = orderData;
    
    if (!nombre.trim() || !apellidos.trim() || !email.trim() || !telefono.trim() || 
        !direccion.trim() || !codigoPostal.trim() || !pais.trim() || !ciudad.trim()) {
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

      const orderPayload: any = {
        payment_method: 'stripe',
        payment_method_title: 'Tarjeta (Stripe)',
        set_paid: false,
        billing: {
          first_name: orderData.nombre,
          last_name: orderData.apellidos,
          email: orderData.email,
          phone: orderData.telefono,
          address_1: orderData.direccion,
          postcode: orderData.codigoPostal,
          country: orderData.pais,
          city: orderData.ciudad,
        },
        shipping: {
          first_name: orderData.nombre,
          last_name: orderData.apellidos,
          address_1: orderData.direccion,
          postcode: orderData.codigoPostal,
          country: orderData.pais,
          city: orderData.ciudad,
        },
        line_items: lineItems,
      };

      if (shippingMethod) {
        orderPayload.shipping_lines = [
          {
            method_id: shippingMethod.method_id,
            method_title: shippingMethod.method_title,
            total: shippingMethod.cost,
          },
        ];
        console.log('📦 Añadiendo gastos de envío:', orderPayload.shipping_lines);
      }

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

      const orderResponse: WooCommerceOrder = await response.json();
      console.log('✅ Pedido creado:', orderResponse);

      if (orderResponse.payment_url) {
        const paymentUrlWithApp = orderResponse.payment_url.includes('?') 
          ? `${orderResponse.payment_url}&app=1`
          : `${orderResponse.payment_url}?app=1`;
        console.log('💳 Abriendo Stripe Checkout:', paymentUrlWithApp);
        setPaymentUrl(paymentUrlWithApp);
        setShowPaymentWebView(true);
      } else {
        console.log('⚠️ No se recibió payment_url, navegando a confirmación directamente');
        clearCart();
        router.replace('/pedido-confirmado');
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

  const handleWebViewNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log('🌐 WebView navegó a:', url);

    if (url.includes('checkout/order-received') || 
        url.includes('order-received') ||
        url.includes('payment-complete') ||
        url.includes('thank-you')) {
      console.log('✅ Pago completado detectado');
      setShowPaymentWebView(false);
      clearCart();
      router.replace('/pedido-confirmado');
    }
  };

  if (showPaymentWebView) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert(
            'Cancelar pago',
            '¿Estás seguro de que quieres cancelar el pago?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Sí',
                onPress: () => {
                  setShowPaymentWebView(false);
                  setIsProcessing(false);
                },
              },
            ]
          );
        }}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Alert.alert(
                  'Cancelar pago',
                  '¿Estás seguro de que quieres cancelar el pago?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Sí',
                      onPress: () => {
                        setShowPaymentWebView(false);
                        setIsProcessing(false);
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={28} color="#000" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.webViewHeaderTitle}>Pago con Stripe</Text>
            <View style={styles.backButton} />
          </View>
          <WebView
            source={{ uri: paymentUrl }}
            style={{ flex: 1 }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            overScrollMode="always"
            bounces={false}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            injectedJavaScript={`
              (function() {
                const addLPBEFooter = () => {
                  if (document.getElementById('lpbe-footer')) return;
                  
                  const footer = document.createElement('div');
                  footer.id = 'lpbe-footer';
                  footer.style.cssText = 'width: 100%; background-color: #9b0021; padding: 30px 20px; text-align: center; margin-top: 40px;';
                  
                  footer.innerHTML = \`
                    <img src="https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2023/05/logo-lpbe-blanco.png" 
                         alt="Los Pueblos Más Bonitos de España" 
                         style="max-width: 200px; width: 100%; height: auto; margin-bottom: 15px;" />
                    <p style="color: #ffffff; font-size: 14px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
                      Los Pueblos Más Bonitos de España<br/>Asociación Oficial
                    </p>
                  \`;
                  
                  document.body.appendChild(footer);
                };
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', addLPBEFooter);
                } else {
                  addLPBEFooter();
                }
                
                setTimeout(addLPBEFooter, 1000);
                setTimeout(addLPBEFooter, 2000);
              })();
              true;
            `}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={LPBE_RED} />
                <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  if (isLoadingUserData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LPBE_RED} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos de facturación</Text>
        {isAuthenticated && (
          <Text style={styles.userInfo}>👤 {user?.name}</Text>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Nombre *"
          placeholderTextColor="#6B6B6B"
          value={orderData.nombre}
          onChangeText={(value) => handleInputChange('nombre', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Apellidos *"
          placeholderTextColor="#6B6B6B"
          value={orderData.apellidos}
          onChangeText={(value) => handleInputChange('apellidos', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email *"
          placeholderTextColor="#6B6B6B"
          value={orderData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Teléfono *"
          placeholderTextColor="#6B6B6B"
          value={orderData.telefono}
          onChangeText={(value) => handleInputChange('telefono', value)}
          keyboardType="phone-pad"
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Dirección *"
          placeholderTextColor="#6B6B6B"
          value={orderData.direccion}
          onChangeText={(value) => handleInputChange('direccion', value)}
          editable={!isProcessing}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Código Postal *"
          placeholderTextColor="#6B6B6B"
          value={orderData.codigoPostal}
          onChangeText={(value) => handleInputChange('codigoPostal', value)}
          keyboardType="numeric"
          editable={!isProcessing}
        />
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={orderData.pais}
            onValueChange={(value) => handleInputChange('pais', value as string)}
            enabled={!isProcessing}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="España" value="ES" />
            <Picker.Item label="Francia" value="FR" />
            <Picker.Item label="Portugal" value="PT" />
            <Picker.Item label="Alemania" value="DE" />
            <Picker.Item label="Italia" value="IT" />
            <Picker.Item label="Reino Unido" value="GB" />
            <Picker.Item label="Países Bajos" value="NL" />
            <Picker.Item label="Bélgica" value="BE" />
            <Picker.Item label="Suiza" value="CH" />
            <Picker.Item label="Austria" value="AT" />
            <Picker.Item label="Dinamarca" value="DK" />
            <Picker.Item label="Suecia" value="SE" />
            <Picker.Item label="Noruega" value="NO" />
            <Picker.Item label="Finlandia" value="FI" />
            <Picker.Item label="Polonia" value="PL" />
            <Picker.Item label="República Checa" value="CZ" />
            <Picker.Item label="Grecia" value="GR" />
            <Picker.Item label="Irlanda" value="IE" />
            <Picker.Item label="Estados Unidos" value="US" />
            <Picker.Item label="Canadá" value="CA" />
            <Picker.Item label="México" value="MX" />
            <Picker.Item label="Argentina" value="AR" />
            <Picker.Item label="Brasil" value="BR" />
            <Picker.Item label="Chile" value="CL" />
            <Picker.Item label="Colombia" value="CO" />
            <Picker.Item label="Perú" value="PE" />
            <Picker.Item label="Andorra" value="AD" />
            <Picker.Item label="Otro" value="OT" />
          </Picker>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Ciudad *"
          placeholderTextColor="#6B6B6B"
          value={orderData.ciudad}
          onChangeText={(value) => handleInputChange('ciudad', value)}
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
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryName}>Subtotal:</Text>
          <Text style={styles.summaryPrice}>{totalPrice.toFixed(2)} €</Text>
        </View>
        
        {shippingCost > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryName}>Envío:</Text>
            <Text style={styles.summaryPrice}>{shippingCost.toFixed(2)} €</Text>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>{(totalPrice + shippingCost).toFixed(2)} €</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.paymentNote}>
          Método de pago: Tarjeta (Stripe)
        </Text>
        <Text style={styles.paymentInfo}>
          Serás redirigido a la pasarela de pago segura de Stripe para completar tu compra.
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
    color: '#000',
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  webViewHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    color: '#000',
  },
  pickerItem: {
    fontSize: 16,
    color: '#000',
  },
});
