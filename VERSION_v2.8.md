# LPBEApp – Versión 2.8

## 📅 Fecha: 26 de Octubre de 2025

---

## 🎯 Resumen de cambios

Esta versión implementa dos correcciones fundamentales basadas en los requisitos exactos de JetEngine:

1. **Perfil con flujo correcto de Ultimate Member** – La pantalla ahora carga primero el login de UM y detecta automáticamente cuando el usuario está logueado para redirigir a la cuenta.
2. **Corrección total de pueblos** – Carga de descripciones e imágenes desde los CCT correctos de JetEngine (`descripcion` y `multimedia`).

---

## 🔥 Cambios implementados

### 1️⃣ Perfil – Flujo completo de Ultimate Member

**Archivo modificado:** `app/(tabs)/perfil.tsx`

**Cambios realizados:**
- ✅ Carga inicial de la URL de login: `https://lospueblosmasbonitosdeespana.org/login/?app=1`
- ✅ Implementado listener de navegación (`onNavigationStateChange`)
- ✅ Detección automática de login exitoso (cuando URL contiene `/account-2/` o `um_action=profile`)
- ✅ Redirección automática a: `https://lospueblosmasbonitosdeespana.org/account-2/?app=1`
- ✅ Prevención de navegación externa (`onShouldStartLoadWithRequest`)
- ✅ Apertura de enlaces externos en el navegador nativo (`Linking.openURL`)
- ✅ Mantiene sesión con cookies compartidas

**Flujo del usuario:**
```
1. Usuario entra a "Perfil"
   ↓
2. Ve pantalla de login de Ultimate Member
   ↓
3. Inicia sesión (usuario/contraseña, Apple, Google)
   ↓
4. App detecta el login exitoso
   ↓
5. Redirige automáticamente a la cuenta UM
   ↓
6. Usuario ve su perfil completo
```

**Ventajas:**
- Login nativo de Ultimate Member con todos los métodos (Apple, Google, email)
- Detección automática de sesión activa
- Enlaces externos se abren en Safari/Chrome
- Sesión persistente entre visitas
- Sin código de autenticación personalizado

---

### 2️⃣ Corrección completa de pueblos – CCT de JetEngine

**Archivo modificado:** `services/api.ts`

**Problema anterior:**
- Las descripciones e imágenes no se cargaban correctamente
- Se usaban fuentes incorrectas de datos
- Imagen genérica de Madrid en todos los pueblos

**Solución implementada:**

#### a) Nueva función `fetchDescripcionForLugar`
```typescript
async function fetchDescripcionForLugar(lugarId: string): Promise<string>
```
- Endpoint: `/wp-json/jet-cct/descripcion?lugar_id={id}`
- Obtiene el CCT `descripcion` relacionado con el lugar
- Filtra descripciones que sean URLs (si empieza con "http")
- Retorna el campo `descripcion` del primer elemento

#### b) Función `fetchMultimediaForLugar` refactorizada
```typescript
async function fetchMultimediaForLugar(lugarId: string): Promise<string | null>
```
- Endpoint: `/wp-json/jet-cct/multimedia?lugar_id={id}`
- Obtiene el CCT `multimedia` relacionado con el lugar
- Retorna el campo `imagen` del primer elemento
- Devuelve `null` si no hay multimedia

#### c) Lógica de carga actualizada en `fetchLugares`
```typescript
const descripcionReal = await fetchDescripcionForLugar(lugar._ID);
const imagenReal = await fetchMultimediaForLugar(lugar._ID);
```
- **SIEMPRE** llama a ambos endpoints para cada pueblo
- Garantiza datos correctos desde los CCT de JetEngine
- Cada pueblo obtiene su descripción e imagen real

#### d) Lógica de carga actualizada en `fetchLugar` (detalle)
- Misma lógica que `fetchLugares`
- Carga descripción desde `/jet-cct/descripcion`
- Carga imagen desde `/jet-cct/multimedia`
- Logs detallados para debugging

---

## 📊 Flujo de carga de pueblos (v2.8)

```
1. Llamar: /wp-json/jet-cct/lugar?per_page=200&orderby=nombre&order=asc
2. Filtrar solo tipo === 'Pueblo'
3. Eliminar duplicados por nombre
4. Para CADA pueblo:
   ├─ Llamar: /wp-json/jet-cct/descripcion?lugar_id={id}
   │  └─ Obtener campo "descripcion"
   │  └─ Filtrar si es URL
   ├─ Llamar: /wp-json/jet-cct/multimedia?lugar_id={id}
   │  └─ Obtener campo "imagen" del primer elemento
   └─ Asignar descripcion e imagen al pueblo
5. Ordenar alfabéticamente
6. Devolver lista procesada
```

---

## ✅ Mejoras técnicas

### Perfil
- Código modular con constantes para URLs
- Listener de navegación para detección automática de login
- Protección contra navegación externa
- Mejor experiencia de usuario con redirección automática

### Pueblos
- **Dos funciones dedicadas** para descripción e imagen
- **Siempre obtiene datos de los CCT correctos** de JetEngine
- Logs extensivos para debugging:
  ```
  🔍 Processing pueblo: {nombre} ID: {_ID}
  📝 Descripción: {texto...}
  🖼️ Imagen: {url...}
  ```
- Fallback a imagen genérica solo si realmente no hay multimedia
- Filtrado de descripciones que sean URLs

---

## 🧪 Testing recomendado

### Perfil
1. ✅ Abrir la pestaña "Perfil"
2. ✅ Verificar que muestra el formulario de login de Ultimate Member
3. ✅ Iniciar sesión con credenciales correctas
4. ✅ Verificar que redirige automáticamente a la cuenta
5. ✅ Cerrar y reabrir la app → debe mantener la sesión
6. ✅ Hacer clic en un enlace externo → debe abrir Safari/Chrome

### Pueblos
1. ✅ Abrir la pestaña "Explorar"
2. ✅ Verificar que CADA pueblo tiene su imagen real (no Madrid genérica)
3. ✅ Verificar que CADA pueblo muestra su descripción correcta
4. ✅ Revisar la consola para ver los logs de carga
5. ✅ Abrir el detalle de varios pueblos
6. ✅ Verificar imágenes y descripciones en las fichas

---

## 📝 Notas técnicas

### WebView en Perfil
- URLs definidas como constantes:
  - `LOGIN_URL`: URL de login inicial
  - `ACCOUNT_URL`: URL de cuenta tras login
  - `BASE_DOMAIN`: Dominio para validar navegación
- `onNavigationStateChange`: Detecta cambios de URL
- `onShouldStartLoadWithRequest`: Previene navegación externa
- `Linking.openURL`: Abre enlaces externos

### API de JetEngine
- **CCT `descripcion`**: Almacena las descripciones de los pueblos
  - Endpoint: `/wp-json/jet-cct/descripcion?lugar_id={id}`
  - Campo: `descripcion`
- **CCT `multimedia`**: Almacena las fotos de los pueblos
  - Endpoint: `/wp-json/jet-cct/multimedia?lugar_id={id}`
  - Campo: `imagen`
- Ambos CCT están relacionados con el ID del lugar

### Rendimiento
- Carga de pueblos: ~200 pueblos × 2 requests = ~400 requests
- Parallelización con `Promise.all()`
- Logs detallados para monitoreo

---

## 🔜 Pendientes para v2.9

- [ ] Implementar caché local de descripciones e imágenes
- [ ] Añadir pull-to-refresh en Explorar
- [ ] Optimizar cantidad de requests (batch requests)
- [ ] Integrar botón "🗺️ Ver mapa interactivo" (Boldest Maps)
- [ ] Añadir skeleton loading en lista de pueblos

---

## 🐛 Bugs corregidos

### v2.7 → v2.8
- ✅ **Perfil**: Ya no carga directamente `/account-2/`, ahora empieza con login
- ✅ **Perfil**: Enlaces externos ahora se abren en navegador nativo
- ✅ **Pueblos**: Ya no usa imagen genérica de Madrid
- ✅ **Pueblos**: Descripciones ahora se cargan desde el CCT correcto
- ✅ **Pueblos**: Imágenes ahora se cargan desde el CCT correcto

---

## 📱 Estructura de archivos modificados

```
app/
└── (tabs)/
    └── perfil.tsx ← ✅ Flujo completo de Ultimate Member

services/
└── api.ts ← ✅ Funciones fetchDescripcionForLugar y fetchMultimediaForLugar
```

---

## 👥 Créditos

- Desarrollo: Rork AI Assistant
- Proyecto: Los Pueblos Más Bonitos de España
- Endpoints JetEngine: Correctamente identificados y utilizados
- Fecha: 26/10/2025

---

**🎉 Versión 2.8 lista para producción**

**Cambios clave:** Login UM completo + Datos reales desde JetEngine
