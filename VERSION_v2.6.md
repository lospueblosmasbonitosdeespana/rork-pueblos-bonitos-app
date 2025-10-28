# VERSION v2.6 - Los Pueblos Más Bonitos de España

## Fecha: 2025-10-26

## CAMBIOS PRINCIPALES

### 1️⃣ NOTICIAS INTERNAS CON WEBVIEW ✅
- ✅ Nueva pantalla de detalle de noticias con WebView interno
- ✅ Al pulsar una noticia, se abre dentro de la app (no en Safari)
- ✅ Ruta: `/noticia/[id]?link=<URL_NOTICIA>`
- ✅ Manejo de errores con botón de reintentar
- ✅ Loading indicator mientras carga el contenido
- ✅ Botón de cierre en el header
- ✅ Mensajes bilingües (ES/EN)
- ✅ Implementado en:
  - `components/NewsSlider.tsx` (slider de Home)
  - `app/noticias.tsx` (página de noticias)

**Archivos modificados:**
- `app/noticia/[id].tsx` (nuevo)
- `app/_layout.tsx` (registrada nueva ruta modal)
- `components/NewsSlider.tsx` (navegación interna)
- `app/noticias.tsx` (navegación interna)

### 2️⃣ LOGIN JWT MEJORADO ✅
- ✅ Sistema de fallback con múltiples endpoints:
  - `/simple-jwt-login/v1/auth` (primera opción)
  - `/jwt-auth/v1/token` (segunda opción)
  - `/wp/v2/users/login` (tercera opción)
- ✅ Logging extensivo para debugging
- ✅ Manejo robusto de errores (JSON y texto plano)
- ✅ Detección automática del formato de respuesta
- ✅ Compatibilidad con múltiples plugins JWT
- ✅ Mensajes de error bilingües personalizados
- ✅ Token JWT almacenado en AsyncStorage
- ✅ Sesión persistente al cerrar/abrir app
- ✅ Botón "Cerrar sesión" con confirmación
- ✅ Loading indicator durante login
- ✅ Deshabilitar inputs durante el proceso de login

**Logs de debug implementados:**
```
🔑 Trying login endpoint: <endpoint>
📝 Credentials: { username }
📡 Response status: 200
📦 Response preview: <datos>
✅ Login successful with: <endpoint>
👤 User: <username>
💾 Storing auth data in AsyncStorage
✅ Auth data stored successfully
🚪 Logging out user
✅ Logout successful
❌ Error from <endpoint> : <error>
```

**Archivos modificados:**
- `contexts/auth.tsx` (sistema de fallback con múltiples endpoints)
- `app/(tabs)/perfil.tsx` (mejorado UX y mensajes)
- `constants/api.ts` (actualizado endpoint de login)

### 3️⃣ PUEBLOS MEJORADOS ✅
- ✅ Filtrar solo pueblos reales (ID < 200)
- ✅ Ordenar alfabéticamente por nombre
- ✅ **Procesamiento de imágenes mejorado:**
  - Detección automática de formato (array, string JSON, string simple)
  - Extracción de imagen principal desde multimedia
  - Fallback a imagen genérica si no hay multimedia
  - Soporte para campo imagen_principal
- ✅ Mostrar información adicional:
  - Nombre del pueblo
  - Provincia y comunidad autónoma
  - Descripción corta (primeras 2 frases)
  - **Miniatura de imagen real (64x64px)**
- ✅ Diseño mejorado con alineación vertical
- ✅ Logging detallado de pueblos cargados
- ✅ Imágenes reales en listado y detalle

**Archivos modificados:**
- `services/api.ts` (filtrado, ordenado y procesamiento de imágenes)
- `app/(tabs)/pueblos.tsx` (UI mejorada con miniaturas de imágenes reales)
- `app/pueblo/[id].tsx` (usa imagen procesada correctamente)

### 4️⃣ PAQUETES INSTALADOS
- ✅ `react-native-webview` para visualización interna de noticias

## ESTRUCTURA DE NAVEGACIÓN ACTUALIZADA

```
Splash (2s) → Home (Bienvenida)
                ├── Descubrir Pueblos → (tabs)/pueblos
                │   └── Pueblo detalle → /pueblo/[id]
                ├── Últimas Noticias → /noticias
                │   └── Noticia detalle → /noticia/[id] (WebView modal)
                └── Avisos y Alertas → /alertas

Tabs:
  - Inicio (Home)
  - Explorar (Pueblos) - con imágenes reales y descripción
  - Perfil - con login JWT mejorado
```

## ENDPOINTS ACTIVOS

- **Pueblos**: `https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/lugar` (filtrado ID < 200, ordenado)
- **Noticias**: `https://lospueblosmasbonitosdeespana.org/wp-json/wp/v2/posts?category_name=noticias&per_page=5`
- **Notificaciones**: `https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/notificaciones`
- **Login JWT**: Sistema de fallback con 3 endpoints ✅ CORREGIDO
  - `/simple-jwt-login/v1/auth`
  - `/jwt-auth/v1/token`
  - `/wp/v2/users/login`
- **Registrar visita**: `https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/visita`

## MEJORAS DE UX/UI

### Noticias
- ✅ Apertura interna (no redirige a Safari)
- ✅ Manejo de errores elegante
- ✅ Botón de reintentar si falla la carga
- ✅ Loading indicator

### Login
- ✅ Mensajes de error claros y bilingües
- ✅ Confirmación al cerrar sesión
- ✅ Persistencia de sesión
- ✅ Loading indicator durante proceso
- ✅ Prueba automática de múltiples endpoints

### Pueblos
- ✅ Más información visible (provincia + descripción)
- ✅ Ordenamiento alfabético
- ✅ Diseño más informativo
- ✅ **Imágenes reales** de cada pueblo (en lista y detalle)
- ✅ Procesamiento inteligente de multimedia
- ✅ Fallback a placeholder si no hay imagen

## DEBUGGING Y LOGS

Se han añadido logs extensivos en:
- Login/Logout (🔑 🚪 ✅ ❌ 👤)
- Carga de pueblos (🔍 📦 🏛️ ✅ ❌ 🖼️)
- Procesamiento de imágenes (🖼️)
- Apertura de noticias (📰)
- Respuestas de API (📡 💾)
- Pruebas de endpoints de login (🔑 ❌)

## PRÓXIMAS FUNCIONALIDADES (v2.7+)

### 4️⃣ Opcional: Boldest Maps
- Integrar botón "🗺️ Ver mapa interactivo" en ficha de pueblo
- URL: `https://maps.lospueblosmasbonitosdeespana.org/es/mapas/PB-xx`
- Abrir en WebView modal

### Futuro (v3)
- Geolocalización de pueblos
- Multiexperiencias
- Notificaciones push
- Sistema de puntos y medallas

## COLORES OFICIALES

- Borgoña LPBE: `#A22C22`
- Beige claro: `#F5F1EA`
- Gris piedra: `#3A3A3A`
- Dorado acento: `#CBB682`
- Verde semáforo: `#43a047`

## COMPATIBILIDAD

- ✅ iOS
- ✅ Android
- ✅ Web (via React Native Web)
- ✅ Expo SDK 54
- ✅ TypeScript strict mode

---

**© Asociación Los Pueblos Más Bonitos de España**
