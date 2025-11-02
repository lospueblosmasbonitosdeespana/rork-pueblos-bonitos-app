# Los Pueblos Más Bonitos de España - Documentación Técnica

## 🎯 Resumen del Proyecto

App móvil nativa (iOS + Android) conectada a WordPress mediante REST API para explorar Los Pueblos Más Bonitos de España.

## ✅ Características Implementadas (v1)

### 1. Pantalla de Inicio
- ✅ Slider de noticias con imágenes (WordPress posts)
- ✅ Feed de notificaciones y alertas
- ✅ Refresh para actualizar contenido
- ✅ Diseño moderno con cards

### 2. Exploración de Pueblos
- ✅ Lista completa desde `/jet-cct/lugar`
- ✅ Búsqueda en tiempo real por nombre
- ✅ Sistema de semáforos visual
- ✅ Navegación a detalle

### 3. Detalle de Pueblo
- ✅ Imagen principal
- ✅ Descripción completa
- ✅ Estado del semáforo dinámico
- ✅ Ubicación (provincia/comunidad)
- ✅ Experiencias relacionadas

### 4. Perfil de Usuario
- ✅ Sistema de autenticación (Ultimate Member)
- ✅ Estado persistente con AsyncStorage
- ✅ Pantalla de login/registro
- ✅ Vista de estadísticas (preparada)

## 🔌 Integración con WordPress

### Endpoints Activos

```typescript
// Base URL
https://lospueblosmasbonitosdeespana.org/wp-json/

// CCTs de JetEngine
/jet-cct/lugar                  → Pueblos
/jet-cct/semaforos              → Estados
/jet-cct/notificaciones         → Avisos
/jet-cct/multiexperiencias      → Rutas
/jet-cct/provincia              → Provincias
/jet-cct/comunidad_autonoma     → CCAA

// Posts de WordPress
/wp/v2/posts?category_name=noticias&_embed
/wp/v2/posts?category_name=alertas&_embed

// Autenticación Ultimate Member
/um/v2/login                    → Login
/um/v2/users                    → Usuarios
```

## 📐 Arquitectura

### Estado del Servidor (React Query)
```typescript
// Ejemplo de query
const lugaresQuery = useQuery({
  queryKey: ['lugares'],
  queryFn: fetchLugares,
});
```

### Estado de Autenticación (Context)
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### Navegación (Expo Router)
```
/(tabs)/home       → Inicio
/(tabs)/pueblos    → Explorar
/(tabs)/perfil     → Perfil
/pueblo/[id]       → Detalle
```

## 🎨 Sistema de Diseño

### Colores
```typescript
primary: '#b0241a'      // Rojo LPBE
secondary: '#d6ad60'    // Dorado
green: '#43a047'        // Semáforo verde
yellow: '#fbc02d'       // Semáforo amarillo
red: '#d32f2f'          // Semáforo rojo
```

### Tipografía
```typescript
h1: 28px / 700
h2: 22px / 700
h3: 18px / 600
body: 16px / 400
caption: 14px / 400
```

### Espaciado
```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

## 🚦 Sistema de Semáforos

El semáforo muestra el estado de visita recomendado para cada pueblo:

- **Verde**: Visita recomendada (condiciones normales)
- **Amarillo**: Visita con precaución (avisos menores)
- **Rojo**: Visita no recomendada (alertas importantes)

Campos del semáforo:
```typescript
interface Semaforo {
  pueblo: string;           // ID del pueblo
  estado: 'verde' | 'amarillo' | 'rojo';
  descripcion: string;      // Explicación del estado
  motivo?: string;          // Razón específica
  fecha_actualizacion: string;
}
```

## 🔐 Autenticación

### Flujo de Login
1. Usuario ingresa credenciales
2. POST a `/um/v2/login`
3. Recibe token JWT + datos de usuario
4. Guarda en AsyncStorage
5. Actualiza contexto de autenticación

### Persistencia
```typescript
// Keys de AsyncStorage
@lpbe_auth_token    → JWT token
@lpbe_auth_user     → Datos del usuario
```

## 📦 Dependencias Clave

```json
{
  "expo": "^53.0.4",
  "react-native": "0.79.1",
  "@tanstack/react-query": "^5.83.0",
  "@nkzw/create-context-hook": "^1.1.0",
  "expo-router": "~5.0.3",
  "lucide-react-native": "^0.475.0"
}
```

## 🚀 Próximas Funcionalidades

### Geolocalización
```typescript
// Propuesta de implementación
import * as Location from 'expo-location';

const { coords } = await Location.getCurrentPositionAsync();
const nearbyPueblos = calculateNearby(coords, lugares);
```

### QR Scanner
```typescript
// Usar expo-camera para escanear QR
import { CameraView } from 'expo-camera';

// Al escanear, registrar visita
POST /jet-cct/visita
{
  usuario: userId,
  pueblo: puebloId,
  fecha_visita: new Date()
}
```

### Notificaciones Push
```typescript
// expo-notifications
import * as Notifications from 'expo-notifications';

// Registrar token y configurar
```

### Multiidioma
```typescript
// Estructura propuesta
i18n/
  es.json
  en.json

// Hook de traducción
const { t } = useTranslation();
```

## 🧪 Testing

### Endpoints de Prueba
Todos los endpoints están en producción. Para testing:

1. Verificar conectividad
```bash
curl https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/lugar
```

2. Test de autenticación
```bash
curl -X POST https://lospueblosmasbonitosdeespana.org/wp-json/um/v2/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 📱 Compatibilidad

- ✅ iOS 13+
- ✅ Android 6.0+
- ✅ Expo Go
- ✅ React Native Web (preview)

## 🔧 Configuración del Entorno

No se requieren variables de entorno adicionales. La API base está hardcodeada en `constants/api.ts`:

```typescript
export const API_BASE_URL = 'https://lospueblosmasbonitosdeespana.org/wp-json';
```

## 📊 Performance

### Caché
- React Query maneja caché automático
- Stale time configurado para datos que cambian poco
- Refetch on mount para datos críticos

### Optimizaciones Implementadas
- ✅ Lazy loading de imágenes (expo-image)
- ✅ Virtualización de listas (FlatList)
- ✅ Memoización de componentes pesados
- ✅ Debounce en búsqueda (implícito en React)

## 🐛 Debugging

### Logs Importantes
```typescript
console.log('Error fetching lugares:', error);
console.log('Error fetching semaforos:', error);
console.log('Error fetching notificaciones:', error);
```

### React Query DevTools
No incluido en producción, pero puedes añadir:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

## 📝 Notas Importantes

1. **Semáforos**: El campo `pueblo` en semáforos debe coincidir con el `_ID` del lugar
2. **Imágenes**: Si no hay imagen, se usa placeholder de Unsplash
3. **Experiencias**: Se filtran por el campo `multiexperiencias_pueblos`
4. **Noticias**: Se usa `_embed` para obtener la imagen destacada

## 🤝 Contribución

Para añadir nuevas funcionalidades:

1. Crear types en `types/api.ts`
2. Añadir endpoint en `constants/api.ts`
3. Crear servicio en `services/api.ts`
4. Implementar UI en `app/` o `components/`
5. Usar React Query para estado del servidor

## 📞 Soporte

Para dudas sobre la API de WordPress:
- Revisar documentación de JetEngine CCT
- Revisar documentación de Ultimate Member REST API

---

**Última actualización**: v1.0 - Primera versión funcional

<!-- redeploy: trigger 2025-11-02T10:00:00Z -->
