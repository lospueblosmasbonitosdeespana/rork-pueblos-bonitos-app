import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

const LPBE_RED = '#d60000';

interface NoticiaDetalle {
  id: number;
  titulo: string;
  fecha: string;
  imagen: string;
  contenido: string;
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
    .replace(/\n\n+/g, '\n\n')
    .trim();
}

async function fetchNoticiaDetalle(noticiaId: string): Promise<NoticiaDetalle> {
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/noticia-detalle?id=${noticiaId}`;
  
  console.log('📰 Fetching noticia:', noticiaId);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('❌ Error fetching noticia:', response.status, response.statusText);
    throw new Error('Error al cargar la noticia');
  }

  const data = await response.json();
  console.log('✅ Noticia fetched:', data.titulo);
  
  return data;
}

export default function NoticiaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: noticia, isLoading, error, refetch } = useQuery({
    queryKey: ['noticia-detalle', id],
    queryFn: () => fetchNoticiaDetalle(id || ''),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'Noticia',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: LPBE_RED,
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={LPBE_RED} />
          <Text style={styles.loadingText}>Cargando noticia...</Text>
        </View>
      </>
    );
  }

  if (error || !noticia) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'Error',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: LPBE_RED,
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Error al cargar la noticia.{'\n'}
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
      </>
    );
  }

  const cleanContent = stripHtmlTags(noticia.contenido);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Noticia',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: LPBE_RED,
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {noticia.imagen ? (
          <Image
            source={{ uri: noticia.imagen }}
            style={styles.noticiaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.noticiaImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.noticiaTitulo}>{noticia.titulo}</Text>
          
          {noticia.fecha && (
            <Text style={styles.noticiaFecha}>{noticia.fecha}</Text>
          )}
          
          <Text style={styles.noticiaContenido}>{cleanContent}</Text>
        </View>
      </ScrollView>
    </>
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
  noticiaImage: {
    width: '100%',
    height: 240,
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
  infoContainer: {
    padding: 16,
  },
  noticiaTitulo: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 8,
    lineHeight: 28,
  },
  noticiaFecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  noticiaContenido: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
});
