import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

const LPBE_RED = '#d60000';

interface NoticiaDetalle {
  id: number;
  titulo: string;
  fecha: string;
  imagen_destacada: string;
  contenido_html: string;
}

function transformarHTML(html: string): string {
  let transformado = html;

  console.log('🔧 Iniciando transformación de HTML...');

  transformado = transformado.replace(
    /<img([^>]*?)src="([^"]*?)"([^>]*?)>/gi,
    (match, before, src, after) => {
      let nuevaSrc = src;

      const dataFullUrl = match.match(/data-full-url="([^"]*)"/i);
      const dataOrigFile = match.match(/data-orig-file="([^"]*)"/i);
      const dataLargeFile = match.match(/data-large-file="([^"]*)"/i);

      if (dataFullUrl) {
        nuevaSrc = dataFullUrl[1];
      } else if (dataOrigFile) {
        nuevaSrc = dataOrigFile[1];
      } else if (dataLargeFile) {
        nuevaSrc = dataLargeFile[1];
      } else {
        nuevaSrc = src.replace(/-\d+x\d+\.(jpg|jpeg|png|webp)/i, '.$1');
      }

      const sinSrcset = before + after;
      const limpio = sinSrcset
        .replace(/srcset="[^"]*"/gi, '')
        .replace(/sizes="[^"]*"/gi, '')
        .replace(/loading="[^"]*"/gi, '');

      return `<img${limpio} src="${nuevaSrc}">`;
    }
  );

  const primeraImagen = transformado.match(/<img[^>]*src="([^"]*)"/i);
  if (primeraImagen) {
    console.log('🖼️ Primera imagen tras transformación:', primeraImagen[1]);
    if (primeraImagen[1].match(/-150x150|-300x200|-768x|-1024x/i)) {
      console.warn('⚠️ ADVERTENCIA: La imagen todavía contiene sufijos de miniatura');
    } else {
      console.log('✅ Imagen sin sufijos de miniatura');
    }
  }

  const htmlFinal = `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      padding: 20px;
      background: #fff;
      overflow-x: hidden;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 0 auto 16px;
      border-radius: 10px;
      object-fit: cover;
    }
    figure {
      width: 100%;
      margin: 0 0 16px 0;
    }
    figcaption {
      font-size: 12px;
      color: #6B7280;
      text-align: center;
      margin-top: -8px;
      margin-bottom: 16px;
    }
    p {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.5;
    }
    h2, h3, h4 {
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 700;
      color: #000;
    }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
    h4 { font-size: 16px; }
    a {
      color: #d60000;
      text-decoration: none;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 16px;
    }
    li {
      margin-bottom: 8px;
    }
    blockquote {
      border-left: 4px solid #d60000;
      padding-left: 16px;
      margin: 16px 0;
      font-style: italic;
      color: #666;
    }
  </style>
</head>
<body>
${transformado}
</body>
</html>`;

  console.log('✅ Transformación de HTML completada');
  return htmlFinal;
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

  console.log('✅ Noticia cargada:', noticia.title?.rendered);
  
  return {
    id: noticia.id,
    titulo: noticia.title?.rendered || 'Sin título',
    fecha: noticia.date || '',
    imagen_destacada: imagenDestacada,
    contenido_html: noticia.content?.rendered || '',
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

  const htmlFinal = transformarHTML(noticia.contenido_html);

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
      <View style={styles.container}>
        {noticia.imagen_destacada ? (
          <Image
            source={{ uri: noticia.imagen_destacada }}
            style={styles.noticiaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.noticiaImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.headerInfo}>
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
        </View>

        <View style={{ flex: 1 }}>
          <WebView
            source={{ 
              html: htmlFinal, 
              baseUrl: 'https://lospueblosmasbonitosdeespana.org' 
            }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      </View>
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
  noticiaImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f5f5f5',
  },
  headerInfo: {
    padding: 16,
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
    marginBottom: 16,
  },
});
