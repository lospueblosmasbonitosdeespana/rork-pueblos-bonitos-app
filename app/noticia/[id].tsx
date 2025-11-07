import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

const LPBE_RED = '#d60000';

interface NoticiaDetalle {
  id: number;
  titulo: string;
  fecha: string;
  imagen_destacada: string;
  contenido_texto: string;
}



async function fetchNoticiaDetalle(noticiaId: string): Promise<NoticiaDetalle> {
  const url = `https://lospueblosmasbonitosdeespana.org/wp-json/wp/v2/posts/${noticiaId}?_embed=1`;
  
  console.log('📰 Cargando noticia desde:', url);
  
  const response = await fetch(url);

  if (!response.ok) {
    console.error('❌ Error al cargar noticia:', response.status, response.statusText);
    throw new Error(`Error ${response.status}: no se pudo cargar la noticia`);
  }

  const noticia = await response.json();
  
  console.log('📋 Datos recibidos para noticia:', noticia.id);

  let imagenDestacada = '';
  if (noticia._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    imagenDestacada = noticia._embedded['wp:featuredmedia'][0].source_url;
    console.log('🖼️ Imagen destacada desde _embed:', imagenDestacada);
  }

  const contenidoHTML = noticia.content?.rendered || '';
  const contenidoTexto = contenidoHTML.replace(/(<([^>]+)>)/gi, '').trim();

  console.log('✅ Noticia cargada:', noticia.title?.rendered);
  
  return {
    id: noticia.id,
    titulo: noticia.title?.rendered || 'Sin título',
    fecha: noticia.date || '',
    imagen_destacada: imagenDestacada,
    contenido_texto: contenidoTexto,
  };
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {noticia.imagen_destacada ? (
          <Image
            source={{ uri: noticia.imagen_destacada }}
            style={styles.noticiaImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.noticiaImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.noticiaTitulo}>{noticia.titulo}</Text>
          
          {noticia.fecha && (
            <Text style={styles.noticiaFecha}>
              {new Date(noticia.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          )}

          <Text style={styles.contenidoTexto}>{noticia.contenido_texto}</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  noticiaImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 14,
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
    marginBottom: 20,
  },
  contenidoTexto: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'justify' as const,
  },
});
