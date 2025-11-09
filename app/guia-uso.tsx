import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuiaUsoScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>GUÍA DE USO — ÁREA DE USUARIOS</Text>

        <Text style={styles.p}>
          Bienvenido al espacio de usuarios de Los Pueblos Más Bonitos de España.
          Aquí tienes lo esencial para usar tu cuenta, el mapa y el registro de
          visitas.
        </Text>

        <Text style={styles.secciones}>
          🚩 Pueblos visitados    🟡 Pueblos por visitar    ⭐ Valoraciones
        </Text>

        <Text style={styles.h2}>Mapa de Pueblos Visitados</Text>
        <Text style={styles.p}>
          En el Mapa: banderita = visitado; círculo amarillo = pendiente.
        </Text>
        <View style={styles.ul}>
          <Text style={styles.li}>
            • La app puede marcar automáticamente por geolocalización (si lo
            autorizas).
          </Text>
          <Text style={styles.li}>
            • También puedes marcar manualmente desde "Pueblos visitados".
          </Text>
        </View>

        <Text style={styles.h2}>Puntos, niveles y favoritos</Text>
        <Text style={styles.p}>
          Gana puntos por cada pueblo confirmado. Sube de nivel con tus visitas y
          marca pueblos como favoritos para tenerlos a mano.
        </Text>

        <Text style={styles.h2}>Consejos rápidos</Text>
        <View style={styles.ul}>
          <Text style={styles.li}>
            • Permite la ubicación en la app para el auto-marcado.
          </Text>
          <Text style={styles.li}>
            • Cuando esté disponible el álbum, sube fotos de tus viajes.
          </Text>
          <Text style={styles.li}>
            • Si tienes dudas, usa la pestaña de Soporte.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  p: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  secciones: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  ul: {
    marginTop: 8,
    marginBottom: 8,
  },
  li: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginTop: 6,
  },
});
