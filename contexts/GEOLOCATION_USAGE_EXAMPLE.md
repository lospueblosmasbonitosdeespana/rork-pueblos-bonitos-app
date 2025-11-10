# Ejemplo de uso del servicio de geolocalización

## Importar el hook

```typescript
import { useGeolocation } from '@/contexts/geolocation';
```

## Uso básico en un componente

```typescript
export default function MiPantalla() {
  const { 
    hasPermission,      // boolean - indica si hay permisos concedidos
    currentLocation,    // LocationData | null - última ubicación obtenida
    isLoading,          // boolean - indica si está cargando
    error,              // string | null - mensaje de error si hay
    requestPermission,  // () => Promise<boolean> - solicita permisos
    getCurrentLocation, // () => Promise<LocationData | null> - obtiene ubicación actual
    checkPermissions,   // () => Promise<boolean> - verifica permisos
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

## Notas importantes

1. **Solo funciona en foreground**: El servicio solo obtiene la ubicación cuando la app está abierta.

2. **Solicitud automática de permisos**: Si llamas a `getCurrentLocation()` sin permisos, automáticamente solicitará permisos al usuario.

3. **Aviso al usuario**: Si el usuario niega permisos, se muestra automáticamente un aviso explicando que la detección está desactivada.

4. **Web compatible**: El servicio funciona en web, iOS y Android.

5. **No ejecuta en segundo plano**: Este servicio no usa tareas en segundo plano. Para eso se necesitaría configurar `expo-location` con `startLocationUpdatesAsync()`.
