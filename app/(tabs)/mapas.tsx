import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

const MAPA_URL = 'https://maps.lospueblosmasbonitosdeespana.org/es/pueblos';

export default function MapasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Mapa de Pueblos</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color={COLORS.card} />
            <Text style={styles.closeButtonText}>Volver a la app</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar el mapa.{"\n"}Verifica tu conexión a internet.
          </Text>
        </View>
      ) : (
        <>
          <WebView
            source={{ uri: MAPA_URL }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadEnd={() => {
              console.log('URL:', MAPA_URL, 'Status: cargado');
              setLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('❌ Error cargando mapa:', nativeEvent.description || 'Error desconocido');
              setError(true);
              setLoading(false);
            }}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando mapa...</Text>
              </View>
            )}
            geolocationEnabled={true}
            allowsInlineMediaPlayback={true}
            allowsBackForwardNavigationGestures={true}
            injectedJavaScript={`
              (function() {
                const header = document.querySelector('header');
                if (header) header.style.display = 'none';
                const wpAdminBar = document.querySelector('#wpadminbar');
                if (wpAdminBar) wpAdminBar.style.display = 'none';
              })();
            `}
          />
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando mapa...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: COLORS.primary,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.card,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.card,
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
