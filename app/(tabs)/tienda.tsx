import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';

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

async function fetchWooCommerceProducts(): Promise<WooCommerceProduct[]> {
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wc/v3/products?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  
  console.log('🛒 Fetching WooCommerce products...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Error fetching products:', response.status, response.statusText);
    throw new Error('Error al cargar productos de WooCommerce');
  }

  const data = await response.json();
  console.log('✅ Products fetched:', data.length);
  
  return data;
}

export default function TiendaScreen() {
  const router = useRouter();
  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['woocommerce-products'],
    queryFn: fetchWooCommerceProducts,
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenProduct = (productId: number) => {
    console.log('🛒 Navegando a producto:', productId);
    router.push(`/producto/${productId}`);
  };

  const renderProduct = ({ item }: { item: WooCommerceProduct }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0].src : '';
    const displayPrice = item.price || item.regular_price || '0';

    return (
      <View style={styles.productItem}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.productPrice}>
            {displayPrice} €
          </Text>
          
          <TouchableOpacity
            style={styles.viewProductButton}
            onPress={() => handleOpenProduct(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProductButtonText}>Ver producto</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Error al cargar los productos.{'\n'}
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
      ) : products && products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
        </View>
      )}
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
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#666',
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: LPBE_RED,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: SPACING.md,
  },
  productItem: {
    marginBottom: SPACING.lg,
    backgroundColor: '#fff',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 14,
  },
  productInfo: {
    paddingTop: SPACING.md,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: SPACING.sm,
  },
  productPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: SPACING.md,
  },
  viewProductButton: {
    backgroundColor: LPBE_RED,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
