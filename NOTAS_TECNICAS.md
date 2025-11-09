# Notas Técnicas - Pueblos Bonitos App v2.2

## 📋 Resumen Ejecutivo

App móvil nativa para iOS y Android desarrollada con React Native + Expo 53, conectada en tiempo real con WordPress a través de REST API. Incluye autenticación con Ultimate Member, escaneo de códigos QR, sistema de semáforos de visitabilidad y contenido bilingüe.

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
├── React Native (Framework base)
├── Expo 53 (Plataforma de desarrollo)
├── TypeScript (Type safety)
├── Expo Router (Navegación file-based)
└── React Query (State management)

Backend:
├── WordPress 6.x
├── JetEngine (Custom Content Types)
├── Ultimate Member (Autenticación)
└── WordPress REST API

Features:
├── expo-camera (QR scanning)
├── AsyncStorage (Persistencia local)
├── expo-localization (Internacionalización)
└── Lucide React Native (Iconos)
```

### Estructura de Carpetas

```
app/
├── (tabs)/                  # Navegación principal
│   ├── home.tsx            # Pantalla de inicio
│   ├── pueblos.tsx         # Explorar pueblos
│   ├── perfil.tsx          # Perfil de usuario
│   └── _layout.tsx         # Configuración de tabs
├── pueblo/[id].tsx         # Detalle de pueblo
├── _layout.tsx             # Layout raíz
└── index.tsx               # Pantalla inicial

components/
├── QRScanner.tsx           # Escáner de códigos QR
├── NewsSlider.tsx          # Slider de noticias
└── NotificationCard.tsx    # Tarjeta de notificación

constants/
├── api.ts                  # URLs y endpoints
├── theme.ts                # Colores y tipografía
└── translations.ts         # Textos bilingües

contexts/
├── auth.tsx                # Context de autenticación
└── language.tsx            # Context de idioma

services/
└── api.ts                  # Funciones de API

types/
└── api.ts                  # Tipos TypeScript
```

---

## 🔗 Integración con WordPress

### Endpoints Utilizados

#### 1. Autenticación
```typescript
POST /wp-json/um/v2/login
Body: { username: string, password: string }
Response: { token: string, user: Usuario }
```

#### 2. Lugares (Pueblos)
```typescript
GET /wp-json/jet-cct/lugares?filter[_ID][lt]=200
Response: Lugar[]

GET /wp-json/jet-cct/lugares/{id}
Response: Lugar
```

#### 3. Semáforos
```typescript
GET /wp-json/jet-cct/semaforos
Response: Semaforo[]
```

#### 4. Notificaciones
```typescript
GET /wp-json/jet-cct/notificaciones
Response: Notificacion[]
```

#### 5. Noticias
```typescript
GET /wp-json/wp/v2/posts?categories=49&per_page=5&_embed=wp:featuredmedia
Response: Noticia[]
```

#### 6. Registro de Visitas
```typescript
POST /wp-json/jet-cct/visita
Headers: { Authorization: "Bearer {token}" } (opcional)
Body: {
  id_lugar: string,
  origen: "qr",
  fecha_visita: string (ISO 8601)
}
Response: { success: boolean, message: string }
```

### Manejo de Errores

Todas las funciones de API incluyen:
- Try-catch para manejar errores de red
- Logging detallado con console.log/error
- Valores por defecto seguros (arrays vacíos, null)
- Mensajes de error traducidos

```typescript
// Ejemplo de manejo de errores
export async function fetchLugares(): Promise<Lugar[]> {
  try {
    console.log('Fetching lugares...');
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error('Error al cargar lugares');
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Response is not an array:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching lugares:', error);
    return []; // Valor seguro por defecto
  }
}
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores

```typescript
export const COLORS = {
  primary: '#A22C22',       // Borgoña LPBE (botones, iconos)
  secondary: '#CBB682',     // Dorado (acentos, bordes)
  green: '#43a047',         // Semáforo verde
  yellow: '#fbc02d',        // Semáforo amarillo
  red: '#A22C22',           // Semáforo rojo / Alertas
  background: '#F5F1EA',    // Beige claro (fondo app)
  card: '#ffffff',          // Blanco (tarjetas)
  text: '#3A3A3A',          // Gris piedra (texto principal)
  textSecondary: '#666666', // Gris medio (texto secundario)
  border: '#e0e0e0',        // Bordes suaves
  beige: '#F5F1EA',         // Beige para alertas
  gold: '#CBB682',          // Dorado para bordes especiales
};
```

### Tipografía

```typescript
export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
```

### Espaciado

```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Sombras

```typescript
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
```

---

## 🔐 Sistema de Autenticación

### Flow de Login

1. Usuario ingresa username y password
2. POST a `/um/v2/login`
3. Backend valida credenciales
4. Si válido → devuelve `{ token, user }`
5. App guarda en AsyncStorage:
   - `@lpbe_auth_token`
   - `@lpbe_auth_user`
6. React Query actualiza el estado
7. Interfaz cambia a "autenticado"

### Context de Auth

```typescript
const { 
  user,              // Usuario actual o null
  token,             // JWT token o null
  isAuthenticated,   // Boolean
  isLoading,         // Boolean
  login,             // (credentials) => Promise<void>
  logout,            // () => Promise<void>
  isLoggingIn,       // Boolean
  loginError         // Error | null
} = useAuth();
```

### Protección de Rutas

Actualmente no hay rutas protegidas. El QR scanner funciona tanto con usuario logueado (incluye token) como sin loguear (registro anónimo).

---

## 📱 Funcionalidad de QR Scanner

### Componente QRScanner

```typescript
interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => Promise<void>;
}
```

### Flow de Escaneo

1. Usuario presiona "Escanear Código QR"
2. Se solicita permiso de cámara (si no lo tiene)
3. Se abre modal con vista de cámara
4. Usuario apunta a código QR del pueblo
5. Al detectar QR → `onBarcodeScanned`
6. Se llama a `onScan(data)` con el ID del pueblo
7. App hace POST a `/jet-cct/visita`
8. Si éxito → Toast "✅ Visita registrada"
9. Si error → Toast "❌ Error al registrar"
10. Modal se cierra automáticamente

### Permisos de Cámara

```typescript
const [permission, requestPermission] = useCameraPermissions();

// Estados:
// null → Cargando
// !granted → Mostrar pantalla de permiso
// granted → Mostrar cámara
```

---

## 🌍 Sistema de Internacionalización

### Context de Language

```typescript
const { 
  language,      // 'es' | 'en'
  setLanguage,   // (lang: Language) => Promise<void>
  t,             // translations[language]
  isLoading      // Boolean
} = useLanguage();
```

### Detección Automática

```typescript
import { getLocales } from 'expo-localization';

function getSystemLanguage(): Language {
  const locales = getLocales();
  const systemLang = locales[0]?.languageCode;
  return systemLang === 'es' || systemLang === 'en' ? systemLang : 'es';
}
```

### Estructura de Traducciones

```typescript
export const translations = {
  es: {
    tabs: { ... },
    home: { ... },
    explore: { ... },
    profile: { ... },
    pueblo: { ... },
    common: { ... },
    qr: { ... },
  },
  en: { ... }
};
```

---

## 💾 Persistencia Local

### AsyncStorage Keys

```
@lpbe_auth_token     → JWT token del usuario
@lpbe_auth_user      → Objeto Usuario serializado
@lpbe_language       → 'es' | 'en'
```

### Cache de React Query

React Query cachea automáticamente:
- `['lugares']` → Lista de pueblos
- `['lugar', id]` → Detalle de un pueblo
- `['semaforos']` → Todos los semáforos
- `['semaforo', id]` → Semáforo de un pueblo
- `['notificaciones']` → Notificaciones activas
- `['noticias']` → Últimas noticias
- `['alertas']` → Alertas meteorológicas
- `['currentUser']` → Usuario actual
- `['authToken']` → Token de auth

---

## 🐛 Debugging

### Logs Importantes

Todas las funciones de API incluyen logs detallados:

```typescript
console.log('Fetching lugares from:', url);
console.log('Response status:', response.status);
console.log('Lugares received:', data.length);
console.error('Error response:', errorText);
```

### Errores Comunes

**1. "Error fetching lugares"**
- Verificar endpoint en `constants/api.ts`
- Revisar CORS en WordPress
- Verificar conectividad de red

**2. Login failed**
- Verificar credenciales
- Verificar plugin Ultimate Member activo
- Verificar endpoint `/um/v2/login`

**3. QR no escanea**
- Verificar permisos de cámara
- Verificar formato de QR (debe ser texto con ID del lugar)
- Verificar iluminación

**4. Traducciones no aparecen**
- Verificar que exista la key en ambos idiomas
- Verificar uso correcto de `t.section.key`

---

## 🔜 Roadmap Técnico

### v3.0 - Geolocalización

```typescript
// Nuevo servicio
services/location.ts
- getCurrentLocation()
- getNearbyPueblos()
- calculateDistance()

// Nuevo componente
components/MapView.tsx
- Mapa interactivo con pueblos
- Marcadores con semáforos
- Filtro por distancia
```

### v3.0 - Multiexperiencias

```typescript
// Ya existe endpoint
GET /jet-cct/multiexperiencias

// Nuevos screens
app/(tabs)/experiencias.tsx
app/experiencia/[id].tsx

// Filtros
- Por tipo (ruta, experiencia, punto_interés)
- Por dificultad
- Por duración
- Por pueblo
```

### v3.0 - Notificaciones Push

```typescript
// Nuevo servicio
services/notifications.ts
- registerForPushNotifications()
- subscribeToPueblo()
- subscribeToSemaforos()

// Integración con Expo Notifications
- FCM para Android
- APNs para iOS
```

---

## 📚 Referencias

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Ultimate Member API](https://docs.ultimatemember.com/article/1697-rest-api-authentication)

---

**Última actualización:** 24 de enero de 2025  
**Versión:** v2.2.0  
**Desarrollado para:** Asociación Los Pueblos Más Bonitos de España
