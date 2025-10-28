# VERSION v2.8 - Los Pueblos Más Bonitos de España

## Fecha: 2025-10-26

---

## 🎯 RESUMEN v2.8

**Dos correcciones fundamentales:**

1. **Perfil con flujo completo de Ultimate Member** → Login + detección automática + redirección a cuenta
2. **Pueblos con datos reales de JetEngine CCT** → Descripciones e imágenes correctas desde los endpoints correctos

---

## 🔥 CAMBIOS PRINCIPALES

### 1️⃣ PERFIL – Flujo Completo de Login

**Problema anterior (v2.7):**
- Cargaba directo `/account-2/` → no había forma de loguearse

**Solución (v2.8):**
- ✅ Carga inicial de **login page**: `https://lospueblosmasbonitosdeespana.org/login/?app=1`
- ✅ **Detección automática** de login exitoso (cuando URL contiene `/account-2/` o `um_action=profile`)
- ✅ **Redirección automática** a cuenta: `https://lospueblosmasbonitosdeespana.org/account-2/?app=1`
- ✅ **Enlaces externos** se abren en Safari/Chrome (con `Linking.openURL()`)
- ✅ **Sesión persistente** con cookies compartidas
- ✅ Soporta **todos los métodos de login** (email, Apple, Google)

**Flujo del usuario:**
```
Entrar a Perfil → Login de UM → Usuario se loguea → App detecta login → Redirige a cuenta → ✅ Usuario ve su perfil
```

---

### 2️⃣ PUEBLOS – Datos Reales desde JetEngine CCT

**Problema anterior (v2.7):**
- Imagen genérica de Madrid en todos los pueblos
- Descripciones no se cargaban o eran incorrectas

**Solución (v2.8):**

#### a) Nueva función `fetchDescripcionForLugar()`
```typescript
Endpoint: /wp-json/jet-cct/descripcion?lugar_id={id}
Campo: "descripcion"
Filtro: Elimina URLs (si empieza con "http")
```

#### b) Función `fetchMultimediaForLugar()` refactorizada
```typescript
Endpoint: /wp-json/jet-cct/multimedia?lugar_id={id}
Campo: "imagen" del primer elemento
Retorno: string | null
```

#### c) Carga garantizada de datos reales
- **CADA pueblo** llama a ambos endpoints:
  1. `/jet-cct/descripcion?lugar_id={id}`
  2. `/jet-cct/multimedia?lugar_id={id}`
- Asigna descripción e imagen real a cada pueblo
- Fallback a imagen genérica solo si realmente no hay multimedia

**Resultado:**
- ✅ Cada pueblo con su **imagen real**
- ✅ Cada pueblo con su **descripción real**
- ✅ Logs detallados para debugging

---

## 📊 ESTRUCTURA DE NAVEGACIÓN

```
Splash (2s) → Home (Bienvenida)
                ├── Descubrir Pueblos → (tabs)/pueblos (✅ con imágenes y descripciones reales)
                ├── Últimas Noticias → /noticias
                └── Avisos y Alertas → /alertas

Tabs:
  - Inicio (Home)
  - Explorar (Pueblos) ← ✅ CORREGIDO
  - Perfil ← ✅ CORREGIDO
```

---

## 🛠️ CAMBIOS TÉCNICOS

### Perfil (`app/(tabs)/perfil.tsx`)
- **+** Constantes para URLs (`LOGIN_URL`, `ACCOUNT_URL`, `BASE_DOMAIN`)
- **+** Hook `onNavigationStateChange` para detectar login
- **+** Hook `onShouldStartLoadWithRequest` para prevenir navegación externa
- **+** Uso de `Linking.openURL()` para enlaces externos
- **+** Estado `currentUrl` para controlar la URL del WebView

### Pueblos (`services/api.ts`)
- **+** Función `fetchDescripcionForLugar(lugarId: string): Promise<string>`
- **~** Función `fetchMultimediaForLugar(lugarId: string): Promise<string | null>` (antes retornaba objeto)
- **~** `fetchLugares()` ahora llama a ambas funciones para cada pueblo
- **~** `fetchLugar(id)` también usa las nuevas funciones
- **+** Logs detallados en consola:
  ```
  🔍 Processing pueblo: {nombre} ID: {_ID}
  📝 Descripción: {texto...}
  🖼️ Imagen: {url...}
  ```

---

## 🐛 BUGS CORREGIDOS

### De v2.7 a v2.8
- ✅ **Perfil**: Ya no carga directo `/account-2/` sin login
- ✅ **Perfil**: Enlaces externos ahora se abren en navegador nativo
- ✅ **Pueblos**: Eliminada imagen genérica de Madrid
- ✅ **Pueblos**: Descripciones ahora se cargan desde CCT correcto
- ✅ **Pueblos**: Imágenes ahora se cargan desde CCT correcto

---

## 📱 COLORES OFICIALES

- Borgoña LPBE: `#A22C22`
- Beige claro: `#F5F1EA`
- Gris piedra: `#3A3A3A`
- Dorado acento: `#CBB682`
- Verde semáforo: `#43a047`

---

## 🌐 ENDPOINTS ACTIVOS

### Autenticación
- **Login UM**: `https://lospueblosmasbonitosdeespana.org/login/?app=1`
- **Cuenta UM**: `https://lospueblosmasbonitosdeespana.org/account-2/?app=1`

### Datos
- **Pueblos**: `/wp-json/jet-cct/lugar?per_page=200&orderby=nombre&order=asc`
- **Descripción pueblo**: `/wp-json/jet-cct/descripcion?lugar_id={id}` ← **NUEVO en v2.8**
- **Multimedia pueblo**: `/wp-json/jet-cct/multimedia?lugar_id={id}` ← **ACTUALIZADO en v2.8**
- **Noticias**: `/wp-json/wp/v2/posts?category_name=noticias&per_page=5&_embed=wp:featuredmedia`
- **Notificaciones**: `/wp-json/jet-cct/notificaciones`
- **Registrar visita**: `/wp-json/jet-cct/visita`

---

## ✅ TESTING RECOMENDADO

### Perfil
1. Abrir pestaña "Perfil" → debe mostrar login de UM
2. Iniciar sesión con usuario válido
3. Verificar que redirige automáticamente a cuenta
4. Cerrar y reabrir app → debe mantener sesión
5. Hacer clic en enlace externo → debe abrir navegador

### Pueblos
1. Abrir pestaña "Explorar" → debe mostrar lista de pueblos
2. Verificar que cada pueblo tiene imagen real (no Madrid)
3. Verificar que cada pueblo tiene descripción
4. Revisar logs en consola para ver carga correcta
5. Abrir detalle de un pueblo → verificar imagen y descripción

---

## 🔜 PRÓXIMAS FUNCIONALIDADES (v2.9)

- [ ] Caché local de descripciones e imágenes
- [ ] Pull-to-refresh en Explorar
- [ ] Optimizar cantidad de requests (batch requests)
- [ ] Integrar botón "🗺️ Ver mapa interactivo" (Boldest Maps)
- [ ] Skeleton loading en lista de pueblos
- [ ] Geolocalización de pueblos
- [ ] Multiexperiencias
- [ ] Notificaciones push

---

## 📚 VERSIONES ANTERIORES

- **v2.7** (26/10/2025): Optimización de perfil y pueblos (mejorado en v2.8)
- **v2.5** (24/10/2025): Nuevo diseño de Home con tres botones
- **v2.4** (24/10/2025): Splash screen y separación de noticias/alertas
- **v2.2** (24/01/2025): QR Scanner y registro de visitas
- **v2.0** (23/01/2025): Conexión real con WordPress y JetEngine
- **v1.0** (20/01/2025): Estructura base con Expo Router

---

**© Asociación Los Pueblos Más Bonitos de España**

**🎉 v2.8 – Login completo + Datos reales**
