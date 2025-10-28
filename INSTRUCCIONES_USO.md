# 📱 Instrucciones de Uso - Pueblos Bonitos App v2.2

## 🚀 Inicio Rápido

### Para Probar la App

```bash
# 1. Instalar dependencias
bun install

# 2. Iniciar el servidor de desarrollo
bun start

# 3. En tu teléfono:
# iOS: Descarga la app Rork o Expo Go desde App Store
# Android: Descarga Expo Go desde Google Play
# Escanea el QR code que aparece en la terminal
```

### Para Desarrollo Web

```bash
# Iniciar preview en navegador
bun run start-web
```

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ **Pantalla de Inicio (Home)**

**Qué hace:**
- Muestra el logo "Los Pueblos Más Bonitos de España"
- Slider horizontal con las últimas 5 noticias de la asociación
- Lista de avisos y alertas ordenadas por fecha

**Cómo se usa:**
- Scroll vertical para ver todo el contenido
- Desliza horizontalmente en el slider de noticias
- Pull-to-refresh para actualizar el contenido

**Endpoints conectados:**
- `GET /wp/v2/posts?categories=49&per_page=5` → Noticias
- `GET /jet-cct/notificaciones` → Notificaciones
- `GET /wp/v2/posts?category_name=alertas` → Alertas

---

### 2️⃣ **Explorar Pueblos**

**Qué hace:**
- Lista de todos los pueblos bonitos de España
- Buscador en tiempo real
- Cada pueblo muestra:
  - Nombre
  - Provincia
  - Descripción breve
  - Estado del semáforo (verde, amarillo, rojo)

**Cómo se usa:**
- Usa el buscador para filtrar por nombre
- Toca un pueblo para ver su ficha detallada
- El punto de color indica el estado de visitabilidad:
  - 🟢 Verde: Visita recomendada
  - 🟡 Amarillo: Visita con precaución
  - 🔴 Rojo: Visita no recomendada

**Endpoints conectados:**
- `GET /jet-cct/lugares?filter[_ID][lt]=200` → Pueblos
- `GET /jet-cct/semaforos` → Estados

**Manejo de errores:**
- Si no hay pueblos disponibles → "⚠️ No se encontraron pueblos disponibles"
- Si hay error de red → Muestra mensaje y logs detallados

---

### 3️⃣ **Ficha de Pueblo**

**Qué hace:**
- Imagen principal del pueblo con borde dorado
- Nombre y ubicación (Provincia, Comunidad Autónoma)
- Tarjeta de semáforo con:
  - Estado visual (color + texto)
  - Descripción del estado
  - Motivo (si existe)
- Descripción completa del pueblo
- Lista de experiencias disponibles

**Cómo se usa:**
- Scroll vertical para ver todo el contenido
- Las experiencias son clickeables (preparado para v3)

**Endpoints conectados:**
- `GET /jet-cct/lugares/{id}` → Detalle del pueblo
- `GET /jet-cct/semaforos` → Busca semáforo por ID de pueblo
- `GET /jet-cct/multiexperiencias` → Filtra por pueblo

---

### 4️⃣ **Mi Perfil (Sin Login)**

**Qué muestra:**
- Icono de usuario
- Formulario de login:
  - Campo de usuario
  - Campo de contraseña
  - Botón "Iniciar Sesión"
- Sección "Acerca de la Asociación"

**Cómo se usa:**
1. Ingresa tu usuario de WordPress
2. Ingresa tu contraseña
3. Presiona "Iniciar Sesión"
4. Si es correcto → Cambia a vista de perfil logueado
5. Si es incorrecto → Muestra error bilingüe

**Endpoints conectados:**
- `POST /um/v2/login` → Autenticación

**Errores manejados:**
- Campos vacíos → "Por favor ingresa usuario y contraseña"
- Credenciales incorrectas → "Usuario o contraseña incorrectos" (ES/EN)

---

### 5️⃣ **Mi Perfil (Con Login)**

**Qué muestra:**
- Header con color borgoña:
  - Avatar circular
  - Nombre del usuario
  - Email del usuario
- Tarjetas de estadísticas:
  - Pueblos visitados (0 por ahora)
  - Puntos acumulados (0 por ahora)
- **Botón "Escanear Código QR"** ⭐ NUEVO
- Sección "Próximamente" (features de v3)
- Sección "Acerca de la Asociación"
- Botón "Cerrar Sesión"
- Footer con copyright

**Cómo se usa:**
- Presiona "Escanear Código QR" para abrir el scanner
- Presiona "Cerrar Sesión" para logout (pide confirmación)
- El perfil persiste incluso si cierras y reabres la app

---

### 6️⃣ **Escáner de Códigos QR** ⭐ NUEVO en v2.2

**Qué hace:**
- Abre la cámara del teléfono
- Detecta códigos QR en los pueblos
- Registra automáticamente la visita
- Asigna puntos al usuario (si está logueado)

**Cómo se usa:**

**Flujo completo:**
1. Ve a "Mi Perfil"
2. Presiona "Escanear Código QR"
3. **Primera vez:**
   - Pide permiso de cámara
   - Presiona "Conceder Permiso"
4. Apunta la cámara al código QR del pueblo
5. Cuando detecta el QR:
   - Se registra automáticamente
   - Muestra toast: "✅ Visita registrada correctamente"
   - Cierra automáticamente el scanner
6. Si hay error:
   - Muestra toast: "❌ Error al registrar la visita"

**Diseño del scanner:**
- Vista de cámara a pantalla completa
- Overlay oscuro con área de escaneo
- 4 esquinas blancas marcando el área
- Texto "Apunta tu cámara al código QR del pueblo"
- Botón X arriba a la derecha para cerrar

**Endpoints conectados:**
- `POST /jet-cct/visita` con body:
  ```json
  {
    "id_lugar": "ID_del_QR",
    "origen": "qr",
    "fecha_visita": "2025-01-24T10:30:00.000Z"
  }
  ```
- Si el usuario está logueado, incluye header:
  ```
  Authorization: Bearer {JWT_TOKEN}
  ```

**Funcionamiento con/sin login:**
- **Con login:** Registra visita + asigna puntos al usuario
- **Sin login:** Registra visita anónima (solo estadísticas generales)

---

## 🌍 Sistema Bilingüe

### Detección Automática
- Al abrir la app por primera vez, detecta el idioma del sistema
- Si es español → App en español
- Si es inglés → App en inglés
- Cualquier otro → Español por defecto

### Cambio Manual
Actualmente no hay selector de idioma en UI, pero el sistema está preparado:

```typescript
const { setLanguage } = useLanguage();
await setLanguage('en'); // o 'es'
```

### Textos Traducidos
- ✅ Navegación (tabs)
- ✅ Pantallas (títulos, descripciones)
- ✅ Botones y acciones
- ✅ Mensajes de error
- ✅ Mensajes de éxito
- ✅ QR Scanner
- ✅ Login/Logout

---

## 🎨 Diseño y Colores

### Paleta Oficial LPBE

```
🔴 Borgoña LPBE: #A22C22
   Usado en: Botones principales, iconos activos, alertas

🟡 Dorado: #CBB682
   Usado en: Bordes de imágenes, acentos decorativos

🟢 Verde: #43a047
   Usado en: Semáforo verde, éxito

🟡 Amarillo: #fbc02d
   Usado en: Semáforo amarillo, advertencias

🟤 Beige: #F5F1EA
   Usado en: Fondo de la app

⚪ Blanco: #ffffff
   Usado en: Tarjetas, fondos de contenido

⚫ Gris piedra: #3A3A3A
   Usado en: Textos principales
```

### Tipografía
- **Títulos grandes:** 28px, negrita
- **Títulos medianos:** 22px, negrita
- **Títulos pequeños:** 18px, semi-negrita
- **Texto normal:** 16px, regular
- **Texto pequeño:** 14px, regular

### Elementos de Diseño
- ✅ Tarjetas con esquinas redondeadas (12px)
- ✅ Sombras suaves para profundidad
- ✅ Bordes dorados en elementos destacados
- ✅ Iconos de Lucide React Native
- ✅ Animaciones suaves (Animated API)
- ✅ Espaciado generoso (8, 16, 24, 32px)

---

## 🔐 Seguridad y Persistencia

### Datos Almacenados Localmente
```
AsyncStorage:
├── @lpbe_auth_token       → JWT token (seguro)
├── @lpbe_auth_user        → Datos del usuario (JSON)
└── @lpbe_language         → Idioma seleccionado ('es' | 'en')

React Query Cache:
├── ['lugares']            → Lista de pueblos (5 min TTL)
├── ['semaforos']          → Estados de semáforos (5 min TTL)
├── ['notificaciones']     → Notificaciones (5 min TTL)
├── ['noticias']           → Noticias (5 min TTL)
└── ['currentUser']        → Usuario actual (∞ TTL)
```

### Sesión Persistente
- El token JWT se guarda en AsyncStorage
- Al reabrir la app, se recupera automáticamente
- No necesitas volver a hacer login
- El token solo se elimina cuando haces "Cerrar Sesión"

---

## 🐛 Solución de Problemas

### "Error fetching lugares"

**Causa:** Problemas con la conexión a la API de WordPress

**Solución:**
1. Verifica tu conexión a internet
2. Verifica que la URL base sea correcta: `https://lospueblosmasbonitosdeespana.org/wp-json`
3. Revisa los logs en consola (muy detallados en v2.2)
4. Verifica que JetEngine esté activo en WordPress

### "Usuario o contraseña incorrectos"

**Causa:** Credenciales inválidas

**Solución:**
1. Verifica que el plugin Ultimate Member esté activo
2. Verifica que el endpoint `/um/v2/login` funcione
3. Prueba las credenciales en un cliente REST (Postman)
4. Revisa que el usuario exista en WordPress

### QR Scanner no abre la cámara

**Causa:** Permisos de cámara denegados

**Solución:**
1. Ve a Ajustes del teléfono
2. Busca la app (Expo Go o Rork)
3. Activa el permiso de cámara
4. Vuelve a intentar

### QR Scanner no detecta el código

**Causa:** Código QR inválido o problemas de iluminación

**Solución:**
1. Asegúrate de que sea un código QR válido con el ID del pueblo
2. Mejora la iluminación
3. Limpia la cámara del teléfono
4. Acerca o aleja el teléfono del código

### La app no carga en el teléfono

**Causa:** Problemas de red o firewall

**Solución:**
```bash
# 1. Asegúrate de que PC y móvil están en la misma WiFi
# 2. Usa modo tunnel:
bun start -- --tunnel
# 3. Escanea el nuevo QR
```

---

## 📊 Próximas Funcionalidades (v3.0)

### Preparado pero no implementado:

1. **Geolocalización:**
   - Detectar pueblos cercanos
   - Mapa interactivo con marcadores
   - Filtro por distancia

2. **Historial de Visitas:**
   - Lista de pueblos visitados
   - Fecha de cada visita
   - Puntos obtenidos

3. **Sistema de Puntos:**
   - Acumulación de puntos por visitas
   - Medallas y logros
   - Ranking de usuarios

4. **Notificaciones Push:**
   - Avisos de nuevas noticias
   - Alertas meteorológicas
   - Cambios en semáforos

5. **Multiexperiencias:**
   - Lista de rutas disponibles
   - Puntos de interés
   - Filtros por tipo y dificultad

---

## 📞 Soporte

**Problemas con la app:**
- Revisa los logs en consola (muy detallados)
- Verifica la conexión a internet
- Prueba en modo web primero: `bun run start-web`

**Problemas con WordPress:**
- Verifica que los plugins estén activos:
  - JetEngine
  - Ultimate Member
- Verifica los permalinks en Ajustes > Enlaces permanentes
- Prueba los endpoints en Postman

**Contacto:**
- Documentación técnica: `NOTAS_TECNICAS.md`
- Historial de cambios: `CHANGELOG.md`
- Información de versión: `VERSION.md`

---

**Versión:** v2.2.0  
**Última actualización:** 24 de enero de 2025  
**Desarrollado para:** Asociación Los Pueblos Más Bonitos de España
