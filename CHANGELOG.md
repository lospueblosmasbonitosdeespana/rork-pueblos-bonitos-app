# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [v2.8.0] - 2025-10-26

### ✨ Correcciones Fundamentales de Perfil y Pueblos

#### 🔐 Perfil - Flujo Completo de Ultimate Member

- **Flujo de Login Completo**: Ahora carga primero la página de login de Ultimate Member
  - URL inicial: `https://lospueblosmasbonitosdeespana.org/login/?app=1`
  - Detección automática de login exitoso
  - Redirección automática a la cuenta cuando el usuario está logueado
- **Navegación Inteligente**:
  - `onNavigationStateChange`: Detecta cuando URL contiene `/account-2/` o `um_action=profile`
  - `onShouldStartLoadWithRequest`: Previene navegación a dominios externos
  - Enlaces externos se abren en Safari/Chrome con `Linking.openURL()`
- **Sesión Persistente**: Cookies compartidas mantienen la sesión entre visitas
- **Métodos de Login**: Soporta todos los métodos de UM (email, Apple, Google)

#### 🌄 Pueblos - Datos Reales desde JetEngine CCT

- **Función `fetchDescripcionForLugar()`**: Nueva función dedicada
  - Endpoint: `/wp-json/jet-cct/descripcion?lugar_id={id}`
  - Obtiene descripciones reales desde el CCT `descripcion`
  - Filtra descripciones que sean URLs
- **Función `fetchMultimediaForLugar()` Refactorizada**:
  - Endpoint: `/wp-json/jet-cct/multimedia?lugar_id={id}`
  - Obtiene imágenes reales desde el CCT `multimedia`
  - Retorna solo el campo `imagen` del primer elemento
- **Carga Garantizada de Datos Reales**:
  - CADA pueblo llama a ambos endpoints
  - Ya no usa imagen genérica de Madrid (salvo pueblos sin multimedia)
  - Descripciones reales desde JetEngine
- **Logs Detallados**: Logs extensivos para debugging de cada pueblo

### 🐛 Corregido

- **Perfil**: Ya no va directo a `/account-2/`, respeta el flujo de login
- **Perfil**: Enlaces externos ahora se abren correctamente en navegador nativo
- **Pueblos**: Eliminada imagen genérica de Madrid en todos los pueblos
- **Pueblos**: Descripciones ahora se obtienen del CCT correcto
- **Pueblos**: Imágenes ahora se obtienen del CCT correcto

### 💎 Mejorado

- **Arquitectura**: Dos funciones dedicadas para descripción e imagen
- **Tipo de Retorno**: `fetchMultimediaForLugar` ahora retorna `string | null` (antes objeto)
- **Logging**: Logs detallados en consola para monitoreo:
  ```
  🔍 Processing pueblo: {nombre} ID: {_ID}
  📝 Descripción: {texto...}
  🖼️ Imagen: {url...}
  ```

### 📝 Archivos Modificados

- `app/(tabs)/perfil.tsx` - Flujo completo de Ultimate Member
- `services/api.ts` - Funciones `fetchDescripcionForLugar` y `fetchMultimediaForLugar`

---

## [v2.7.0] - 2025-10-26

### ✨ Optimización de Perfil y Pueblos

- **Perfil con WebView directo**: Carga directa de cuenta UM (optimizado en v2.8)
- **Multimedia mejorada**: Primera optimización de carga de imágenes (mejorado en v2.8)

---

## [v2.5.0] - 2025-10-24

### ✨ Nuevo Diseño de Home

- **Pantalla de Bienvenida Rediseñada**: Home ahora muestra una pantalla de bienvenida elegante con logo centrado y tres botones grandes:
  - 🗺️ "Descubrir Pueblos" → navega a Explorar
  - 📰 "Últimas Noticias" → navega a página de Noticias dedicada
  - ⚠️ "Avisos y Alertas" → navega a página de Alertas dedicada
- **Fondo beige premium** con colores corporativos oficiales
- **Botones con sombras suaves** y animaciones

### ➕ Añadido

- **Página de Noticias Dedicada** (`/noticias`):
  - Muestra todas las noticias de la asociación
  - Tarjetas clicables que abren enlaces reales con `Linking.openURL()`
  - Diseño con borde dorado (#CBB682)
  - Pull-to-refresh funcional
  - Endpoint: `/wp/v2/posts?category_name=noticias&per_page=5`

- **Página de Alertas Dedicada** (`/alertas`):
  - Muestra todas las alertas y semáforos
  - Separación visual entre alertas (rojo) y semáforos (verde)
  - Ordenadas por fecha descendente
  - Diseño con borde borgoña (#A22C22)
  - Pull-to-refresh funcional
  - Endpoint: `/jet-cct/notificaciones`

### 💎 Mejorado

- **Explorar Pueblos**: 
  - Solo muestra el nombre del pueblo (sin provincia)
  - Icono genérico 🌄 a la izquierda de cada pueblo
  - Sin descripción para un diseño más limpio y rápido
  - Formato lista simple

- **Perfil**:
  - "Acerca de la Asociación" ahora sin borde rojo (solo fondo beige)
  - Diseño más limpio y elegante

- **NewsSlider**:
  - Noticias ahora son clicables
  - Abren enlaces reales en el navegador nativo
  - Mejor experiencia de usuario

### 🐛 Corregido

- **Error en Splash Screen**: Eliminado texto problemático que causaba errores
- **Noticias no clicables**: Ahora todas las noticias abren sus enlaces correctamente
- **Texto en inglés**: Eliminadas todas las palabras en inglés de la UI (manteniendo el sistema bilingüe)

### 📱 Estructura de Navegación

```
Splash (2s) → Home (Bienvenida)
                ├── Descubrir Pueblos → (tabs)/pueblos
                ├── Últimas Noticias → /noticias
                └── Avisos y Alertas → /alertas

Tabs:
  - Inicio (Home)
  - Explorar (Pueblos)
  - Perfil
```

---

## [v2.4.0] - 2025-10-24

### ✅ Añadido

- Splash screen limpio sin texto "Descubre la magia de España"
- Separación clara entre noticias y alertas en Home
- Formato lista simple en Explorar (sin imágenes grandes)

---

## [v2.2.0] - 2025-01-24

### ✅ Añadido

- **QR Scanner**: Nuevo componente `QRScanner` con expo-camera para escanear códigos QR en los pueblos
- **Registro de Visitas**: Función `registrarVisita()` que conecta con `/jet-cct/visita` para registrar visitas cuando se escanea un QR
- **Mejoras en Traducciones**: 
  - Nuevas traducciones para QR scanner (ES/EN)
  - Traducciones de mensajes de error y éxito
  - Traducción de botones y acciones
- **Footer**: Footer discreto con copyright de la asociación en perfil
- **Mensajes de Error Mejorados**: Errores bilingües en login y exploración de pueblos

### 🔧 Corregido

- **Error "Error fetching lugares"**: Mejorado el manejo de errores en `fetchLugares()`
- **Respuestas Vacías**: La app ya no se rompe cuando la API devuelve datos vacíos o inválidos
- **Manejo de Errores API**: Añadido logging detallado para debugging y mejor manejo de errores
- **Login Errors**: Mensajes de error traducidos y más descriptivos en el login

### 🎨 Mejorado

- **Diseño del Perfil**: 
  - Botón de QR scanner con icono y estilo oficial
  - Footer con información de la asociación
  - Mejor disposición de elementos
- **Explorar Pueblos**: Mensaje de error claro cuando no hay pueblos disponibles
- **Home**: Mejor visualización de noticias y alertas

### 📱 Funcionalidades Actuales

- ✅ Explorar pueblos con búsqueda
- ✅ Sistema de semáforos en tiempo real
- ✅ Login/Logout con Ultimate Member
- ✅ Escaneo de códigos QR para registrar visitas
- ✅ Últimas noticias de LPBE
- ✅ Avisos y alertas meteorológicas
- ✅ App bilingüe (ES/EN)
- ✅ Perfil de usuario con estadísticas
- ✅ Caché local con AsyncStorage

---

## [v2.0.0] - 2025-01-23

### ✅ Añadido

- **Conexión Real con WordPress**: Integración completa con la API REST de WordPress y JetEngine CCT
- **Login con Ultimate Member**: Sistema de autenticación con JWT tokens
- **Explorar Pueblos**: Lista de pueblos reales con filtros y búsqueda
- **Sistema de Semáforos**: Estados de visitabilidad (verde, amarillo, rojo)
- **Noticias LPBE**: Slider con últimas noticias de la asociación
- **Avisos y Alertas**: Notificaciones y alertas meteorológicas
- **Diseño Oficial LPBE**: Colores y estilo de la marca
- **Sistema Bilingüe**: Español e Inglés con detección automática
- **Ficha de Pueblo**: Detalle completo con descripción, semáforo y experiencias

### 📦 Endpoints Conectados

```
GET  /jet-cct/lugares?filter[_ID][lt]=200
GET  /jet-cct/semaforos
GET  /jet-cct/notificaciones
GET  /wp/v2/posts?categories=49&per_page=5
POST /um/v2/login
```

### 🎨 Diseño

- Paleta de colores oficial LPBE
- Tarjetas con bordes dorados
- Tipografía Playfair Display y Inter (preparado)
- Animaciones suaves
- Diseño responsive

---

## [v1.0.0] - 2025-01-20

### ✅ Inicial

- Estructura base de la app con Expo Router
- Navegación por tabs (Home, Explorar, Perfil)
- Configuración de TypeScript
- React Query para state management
- Iconos con Lucide React Native
- AsyncStorage para persistencia local

---

## 🔜 Próximas Versiones

### [v3.0.0] - Planificado

- 🗺️ Geolocalización y mapa interactivo
- 🎭 Multiexperiencias (rutas y puntos de interés)
- 🔔 Notificaciones push
- 🏆 Sistema completo de puntos y medallas
- 📊 Historial detallado de pueblos visitados
- 🔍 Filtros avanzados por comunidad/provincia
- 📸 Galería de fotos de cada pueblo
- ⭐ Sistema de favoritos
- 💬 Comentarios y reseñas de usuarios

---

## Mantenimiento

Este changelog sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

**Tipos de cambios:**
- **Añadido**: Nuevas funcionalidades
- **Cambiado**: Cambios en funcionalidades existentes
- **Obsoleto**: Funcionalidades que serán eliminadas
- **Eliminado**: Funcionalidades eliminadas
- **Corregido**: Corrección de bugs
- **Seguridad**: Cambios relacionados con seguridad
