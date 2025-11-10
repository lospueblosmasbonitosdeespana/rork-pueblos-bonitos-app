# 📍 Servicio de Geolocalización - Guía de Uso

## ✅ Estado Actual

El servicio de geolocalización está **completamente implementado** y cumple con todas las reglas especificadas:

### Reglas de Funcionamiento

1. ✅ **Una notificación por pueblo y día**
   - Sistema de cooldown de 24 horas usando AsyncStorage
   - No se repite la bienvenida al mismo pueblo hasta pasadas 24h

2. ✅ **Múltiples pueblos en el mismo día**
   - Si visitas 3 pueblos distintos, verás las 3 bienvenidas
   - Cada pueblo tiene su propio control independiente

3. ✅ **Verificación optimizada**
   - Cada 30 segundos O
   - Cada 100 metros de desplazamiento
   - Lo que ocurra primero

4. ✅ **No registra visitas ni puntos**
   - Solo muestra notificaciones de bienvenida
   - No hay lógica de puntuación

5. ✅ **Solo en foreground**
   - Usa permisos de ubicación en primer plano
   - Cumple con las normas de Apple
   - No consume batería en segundo plano

6. ✅ **No interfiere con otras funciones**
   - Servicio independiente del mapa y otras features

---

## 🚀 Cómo Usar el Servicio

### 1. Envolver tu app con el Provider

En tu `app/_layout.tsx`, ya debería estar el provider:

```tsx
import { GeolocationProvider } from '@/contexts/geolocation';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <NotificationProvider>
              <GeolocationProvider> {/* 👈 Provider activo */}
                <RootLayoutNav />
              </GeolocationProvider>
            </NotificationProvider>
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 2. El servicio funciona automáticamente

Una vez envuelto, el servicio:
- ✅ Solicita permisos de ubicación al iniciar
- ✅ Solicita permisos de notificaciones
- ✅ Carga la lista de pueblos desde la API
- ✅ Inicia el seguimiento de ubicación
- ✅ Detecta proximidad a pueblos (≤ 2 km)
- ✅ Muestra notificaciones de bienvenida

### 3. Usar el hook (opcional)

Si necesitas acceder a la información de ubicación en algún componente:

```tsx
import { useGeolocation } from '@/contexts/geolocation';

function MiComponente() {
  const {
    hasPermission,
    hasNotificationPermission,
    currentLocation,
    isLoading,
    error,
    requestPermission,
    getCurrentLocation,
  } = useGeolocation();

  // Ejemplo: Mostrar ubicación actual
  if (currentLocation) {
    console.log('Lat:', currentLocation.latitude);
    console.log('Lng:', currentLocation.longitude);
  }

  // Ejemplo: Solicitar permisos manualmente
  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('Permisos concedidos');
    }
  };

  return (
    <View>
      {!hasPermission && (
        <Button title="Activar ubicación" onPress={handleRequestPermission} />
      )}
    </View>
  );
}
```

---

## 🔍 Logs de Depuración

El servicio incluye logs detallados en consola:

```
📍 GeolocationProvider inicializando...
📍 Solicitando permisos de geolocalización...
✅ Permisos de geolocalización concedidos
🔔 Solicitando permisos de notificaciones...
🔔 Estado de permisos de notificaciones: true
🏘️ Cargando lista de pueblos...
✅ 121 pueblos cargados
✅ Condiciones cumplidas, iniciando seguimiento de ubicación
📍 Iniciando seguimiento de ubicación...
✅ Seguimiento de ubicación iniciado
📍 Ubicación actualizada: { latitude: 40.4168, longitude: -3.7038 }
📍 Distancia a Albarracín: 2.45 km
📍 Distancia a Aínsa: 1.8 km
🔔 Usuario cerca de Aínsa, enviando notificación...
✅ Notificación enviada para Aínsa
✅ Pueblo 123 guardado en AsyncStorage
```

---

## 🧪 Cómo Probar

### En desarrollo:

1. **Simulador iOS/Android:**
   - Usa ubicaciones simuladas desde Xcode/Android Studio
   - Configura coordenadas cercanas a un pueblo

2. **Dispositivo físico:**
   - Activa GPS
   - Acércate físicamente a menos de 2 km de un pueblo

3. **Verificar AsyncStorage:**
   ```tsx
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   const checkStorage = async () => {
     const data = await AsyncStorage.getItem('pueblosSaludados');
     console.log('Pueblos saludados:', JSON.parse(data || '{}'));
   };
   ```

---

## 📊 Estructura de Datos

### AsyncStorage

```json
{
  "pueblosSaludados": {
    "123": "2025-11-10T09:45:00.000Z",
    "456": "2025-11-10T11:20:00.000Z",
    "789": "2025-11-09T15:30:00.000Z"
  }
}
```

- **Key**: ID del pueblo
- **Value**: Timestamp ISO de la última notificación

---

## ⚙️ Configuración

Si necesitas ajustar parámetros, edita las constantes en `contexts/geolocation.tsx`:

```tsx
const COOLDOWN_HOURS = 24; // Horas entre notificaciones del mismo pueblo
const DISTANCE_THRESHOLD = 2; // Kilómetros de proximidad
const TIME_INTERVAL = 30000; // Milisegundos (30s)
const DISTANCE_INTERVAL = 100; // Metros
```

---

## ❗ Troubleshooting

### No recibo notificaciones

1. Verifica que los permisos estén concedidos
2. Revisa los logs de consola
3. Confirma que hay pueblos cargados
4. Asegúrate de estar a menos de 2 km de un pueblo
5. Verifica que no haya cooldown activo (24h)

### Consumo de batería

El servicio usa `Location.Accuracy.Balanced` y solo funciona en foreground, lo que minimiza el consumo. Si necesitas reducirlo más:

- Aumenta `timeInterval` de 30s a 60s
- Aumenta `distanceInterval` de 100m a 200m

---

## 🎯 Próximos Pasos (Futuro)

- [ ] Registrar visitas en base de datos
- [ ] Sistema de puntos
- [ ] Badges por pueblos visitados
- [ ] Historial de visitas
- [ ] Compartir en redes sociales

---

**Versión:** 2.0.0  
**Última actualización:** 2025-11-10
