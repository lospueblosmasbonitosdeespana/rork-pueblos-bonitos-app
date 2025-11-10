# Ejemplo de uso del servicio de geolocalización

## Importar el hook

```typescript
import { useGeolocation } from '@/contexts/geolocation';
```

## Uso básico en un componente

```typescript
export default function MiPantalla() {
  const { 
    hasPermission,                  // boolean - indica si hay permisos de ubicación concedidos
    hasNotificationPermission,      // boolean - indica si hay permisos de notificaciones concedidos
    currentLocation,                // LocationData | null - última ubicación obtenida
    isLoading,                      // boolean - indica si está cargando
    error,                          // string | null - mensaje de error si hay
    requestPermission,              // () => Promise<boolean> - solicita permisos de ubicación
    requestNotificationPermission,  // () => Promise<boolean> - solicita permisos de notificaciones
    getCurrentLocation,             // () => Promise<LocationData | null> - obtiene ubicación actual
    checkPermissions,               // () => Promise<boolean> - verifica permisos
    startLocationTracking,          // () => Promise<void> - inicia seguimiento de ubicación
    stopLocationTracking,           // () => Promise<void> - detiene seguimiento de ubicación
  } = useGeolocation();

  const handleGetLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      console.log('Ubicación:', location.latitude, location.longitude);
    }
  };

  return (
    <View>
      <Text>Estado de permisos: {hasPermission ? 'Concedido' : 'No concedido'}</Text>
      <Text>Notificaciones: {hasNotificationPermission ? 'Activadas' : 'Desactivadas'}</Text>
      
      {currentLocation && (
        <Text>
          Ubicación actual: {currentLocation.latitude}, {currentLocation.longitude}
        </Text>
      )}
      
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      <Button 
        title="Obtener ubicación" 
        onPress={handleGetLocation}
        disabled={isLoading}
      />
    </View>
  );
}
```

## Estructura de LocationData

```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;  // precisión en metros
  timestamp: number;        // timestamp de cuando se obtuvo
}
```

## Funcionalidad de detección de proximidad

El servicio ahora incluye **detección automática de proximidad a pueblos**:

### Cómo funciona

1. **Solicita permisos**: Al iniciar la app, solicita permisos de ubicación y notificaciones.

2. **Carga la lista de pueblos**: Descarga la lista completa de pueblos desde la API.

3. **Seguimiento automático**: Si los permisos están concedidos, inicia automáticamente el seguimiento de ubicación.

4. **Detecta proximidad**: Cada vez que la ubicación cambia (cada 30 segundos o cada 100 metros), calcula la distancia a todos los pueblos usando la fórmula Haversine.

5. **Notifica al usuario**: Si el usuario está a ≤ 2 km de un pueblo, muestra una notificación:
   - **Título**: "Bienvenido a [nombre del pueblo]"
   - **Mensaje**: "uno de los Pueblos Más Bonitos de España. ¡Disfruta de tu visita!"

6. **Sin duplicados**: Una vez enviada la notificación para un pueblo, no vuelve a notificar hasta que la app se reinicie.

### Fórmula Haversine

La distancia se calcula usando la fórmula de Haversine, que calcula la distancia más corta entre dos puntos en una esfera (la Tierra):

```typescript
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en kilómetros
}
```

## Notas importantes

1. **Solo funciona en foreground**: El servicio solo obtiene la ubicación cuando la app está abierta (cumple normas de Apple).

2. **Solicitud automática de permisos**: Al iniciar la app, solicita automáticamente permisos de ubicación y notificaciones.

3. **Aviso al usuario**: Si el usuario niega permisos, se muestra automáticamente un aviso explicando que la detección está desactivada.

4. **Web compatible**: El servicio funciona en web, iOS y Android (pero las notificaciones no funcionan en web).

5. **No ejecuta en segundo plano**: Este servicio no usa tareas en segundo plano para cumplir con las normas de las tiendas de apps.

6. **Actualización inteligente**: 
   - Actualiza la ubicación cada 30 segundos.
   - O cuando el usuario se mueve más de 100 metros.

7. **Sin registro en BD**: Por ahora, las notificaciones son solo informativas. No se registran visitas ni se suman puntos.

8. **Eficiencia**: El servicio usa `Location.Accuracy.Balanced` para equilibrar precisión y consumo de batería.
