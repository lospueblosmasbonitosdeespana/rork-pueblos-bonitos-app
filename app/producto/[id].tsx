import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/contexts/cart';
import { ShoppingCart, Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

const LPBE_RED = '#d60000';
const CONSUMER_KEY = 'ck_c98c3651ff32de8a2435dac50c34ac292eb26963';
const CONSUMER_SECRET = 'cs_1195b6ab18bb1c5f1f89cff976ad111151c23aaa';

interface WooCommerceImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  permalink: string;
  images: WooCommerceImage[];
  short_description: string;
  description: string;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

async function fetchWooCommerceProduct(productId: string): Promise<WooCommerceProduct> {
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  
  console.log('🛒 Fetching WooCommerce product:', productId);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Error fetching product:', response.status, response.statusText);
    throw new Error('Error al cargar el producto');
  }

  const data = await response.json();
  console.log('✅ Product fetched:', data.name);
  
  return data;
}

export default function ProductoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['woocommerce-product', id],
    queryFn: () => fetchWooCommerceProduct(id || ''),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const handleAddToCart = () => {
    if (product) {
      const imageUrl = product.images && product.images.length > 0 ? product.images[currentImageIndex].src : '';
      const displayPrice = product.price || product.regular_price || '0';
      
      addItem({
        id: product.id,
        name: product.name,
        price: displayPrice,
        image: imageUrl,
      });
      
      setAddedToCart(true);
      
      setTimeout(() => {
        Alert.alert(
          'Producto añadido',
          '¿Qué deseas hacer?',
          [
            {
              text: 'Seguir comprando',
              style: 'cancel',
              onPress: () => setAddedToCart(false),
            },
            {
              text: 'Ir al carrito',
              onPress: () => router.push('/carrito'),
            },
          ]
        );
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={LPBE_RED} />
        <Text style={styles.loadingText}>Cargando producto...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Error al cargar el producto.{'\n'}
          Verifica tu conexión a internet.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetch()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images || [];
  const displayPrice = product.price || product.regular_price || '0';
  const cleanDescription = stripHtmlTags(product.short_description || product.description || 'Sin descripción disponible');

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleOpenFullScreen = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const handleCloseFullScreen = () => {
    setFullScreenImage(null);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {images.length > 0 ? (
        <View>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => handleOpenFullScreen(images[currentImageIndex].src)}
          >
            <Image
              source={{ uri: images[currentImageIndex].src }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {images.length > 1 && (
            <View style={styles.imageControls}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handlePreviousImage}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.imagePagination}>
                <Text style={styles.imagePaginationText}>
                  {currentImageIndex + 1} / {images.length}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleNextImage}
                activeOpacity={0.7}
              >
                <ChevronRight size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.productImage, styles.noImage]}>
          <Text style={styles.noImageText}>Sin imagen</Text>
        </View>
      )}

      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseFullScreen}
      >
        <Pressable 
          style={styles.fullScreenContainer}
          onPress={handleCloseFullScreen}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseFullScreen}
            activeOpacity={0.7}
          >
            <X size={30} color="#fff" />
          </TouchableOpacity>
          
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      <View style={styles.infoContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        
        <Text style={styles.productPrice}>{displayPrice} €</Text>
        
        <Text style={styles.descriptionLabel}>Descripción:</Text>
        <Text style={styles.descriptionText}>{cleanDescription}</Text>
        
        <TouchableOpacity
          style={[styles.buyButton, addedToCart && styles.buyButtonSuccess]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          {addedToCart ? (
            <View style={styles.buttonContent}>
              <Check size={20} color="#fff" />
              <Text style={styles.buyButtonText}>Añadido al carrito</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.buyButtonText}>Añadir al carrito</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 24,
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
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  productImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#f5f5f5',
  },
  imageControls: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePagination: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imagePaginationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 14,
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 24,
  },
  buyButton: {
    backgroundColor: LPBE_RED,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buyButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
