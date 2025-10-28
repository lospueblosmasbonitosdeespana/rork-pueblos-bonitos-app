# 🛠️ INSTRUCCIONES DE SINCRONIZACIÓN Y PRUEBAS – v2.8

## 📅 Fecha: 26 de Octubre de 2025

---

## 🔄 PASO 1: SINCRONIZAR EL PROYECTO

Ejecuta este comando en la terminal:

```bash
npx cap sync
```

Este comando sincroniza los cambios nativos con las plataformas iOS y Android.

---

## 🚀 PASO 2: EJECUTAR LA APP

Ejecuta la app en tu entorno:

```bash
npm start
```

O si usas Expo:

```bash
npx expo start
```

---

## ✅ PASO 3: PRUEBAS DE PERFIL

### 3.1 Flujo de Login

1. **Abre la pestaña "Perfil"**
   - ✅ Debe mostrar la página de login de Ultimate Member
   - ❌ NO debe mostrar directamente la cuenta

2. **Inicia sesión con credenciales válidas**
   - Usa un usuario de prueba de Ultimate Member
   - Puedes usar cualquier método: email, Apple, Google

3. **Verifica la redirección automática**
   - ✅ La app debe detectar el login exitoso
   - ✅ Debe redirigir automáticamente a `/account-2/`
   - ✅ Debe mostrar la cuenta completa del usuario

4. **Verifica la sesión persistente**
   - Cierra la app completamente
   - Vuelve a abrirla
   - Entra a "Perfil"
   - ✅ Debe mantener la sesión (mostrar cuenta, no login)

5. **Verifica enlaces externos**
   - En la cuenta de usuario, haz clic en algún enlace externo
   - ✅ Debe abrir el navegador nativo (Safari/Chrome)
   - ❌ NO debe abrir dentro de la app

### 3.2 Consola de Logs

Revisa los logs en la consola mientras navegas:

```
📱 Navigation to: https://lospueblosmasbonitosdeespana.org/login/?app=1
✅ User logged in, redirecting to account
📱 Navigation to: https://lospueblosmasbonitosdeespana.org/account-2/?app=1
```

Si ves un enlace externo:
```
🔗 External link detected, opening in browser: https://...
```

---

## ✅ PASO 4: PRUEBAS DE PUEBLOS

### 4.1 Lista de Pueblos

1. **Abre la pestaña "Explorar"**
   - ✅ Debe cargar lista de pueblos
   - ✅ Cada pueblo debe tener su imagen real (no Madrid)
   - ✅ Cada pueblo debe mostrar descripción

2. **Revisa varios pueblos**
   - Scroll por la lista
   - Verifica que las imágenes son distintas
   - Verifica que las descripciones son únicas

3. **Busca un pueblo específico**
   - Usa la barra de búsqueda
   - Verifica que la imagen y descripción se mantienen

### 4.2 Detalle de Pueblo

1. **Haz clic en un pueblo**
   - ✅ Debe abrir la ficha del pueblo
   - ✅ Debe mostrar imagen principal real
   - ✅ Debe mostrar descripción completa

2. **Verifica varios pueblos**
   - Abre 3-4 pueblos diferentes
   - Confirma que cada uno tiene su imagen y descripción única

### 4.3 Consola de Logs

Durante la carga de pueblos, la consola debe mostrar:

```
🔍 Fetching pueblos from: https://...
📦 Raw response type: object Is array: true
📊 Total items received: 123
📊 Filtered to Pueblos: 89
📊 Unique Pueblos: 87
🔍 Processing pueblo: Albarracín ID: 123
📝 Descripción: Albarracín es un precioso pueblo...
🖼️ Imagen: https://lospueblosmasbonitosdeespana.org/...
...
✅ Loaded pueblos: 87
🖼️ Sample: Albarracín → https://lospueblosmasbonitosdeespana...
```

---

## 🐛 RESOLUCIÓN DE PROBLEMAS

### Problema 1: Perfil carga directamente la cuenta (sin login)

**Causa:** El usuario ya tenía sesión iniciada de una prueba anterior.

**Solución:**
1. Cierra sesión dentro de la app
2. O limpia las cookies del WebView
3. O limpia la caché de la app

---

### Problema 2: Pueblos siguen con imagen de Madrid

**Causa:** El endpoint `/jet-cct/multimedia` no está devolviendo datos.

**Verificación:**
1. Revisa los logs en consola
2. Busca líneas como:
   ```
   ⚠️ Sin multimedia para lugar 123
   ```
3. Verifica que el endpoint responde correctamente:
   ```
   curl 'https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/multimedia?lugar_id=123'
   ```

---

### Problema 3: Descripciones vacías

**Causa:** El endpoint `/jet-cct/descripcion` no está devolviendo datos.

**Verificación:**
1. Revisa los logs en consola
2. Busca líneas como:
   ```
   ⚠️ Sin descripción para lugar 123
   ```
3. Verifica que el endpoint responde correctamente:
   ```
   curl 'https://lospueblosmasbonitosdeespana.org/wp-json/jet-cct/descripcion?lugar_id=123'
   ```

---

### Problema 4: Enlaces externos se abren dentro de la app

**Causa:** El listener `onShouldStartLoadWithRequest` no está funcionando.

**Verificación:**
1. Revisa que el dominio del enlace NO sea `lospueblosmasbonitosdeespana.org`
2. Revisa los logs en consola para ver si detecta el enlace externo
3. Verifica que `Linking` de React Native está importado correctamente

---

## 📊 CHECKLIST FINAL

Antes de dar por terminada la v2.8, verifica:

### Perfil
- [ ] Carga página de login inicial ✅
- [ ] Detecta login exitoso ✅
- [ ] Redirige a cuenta automáticamente ✅
- [ ] Mantiene sesión al cerrar/abrir app ✅
- [ ] Enlaces externos se abren en navegador ✅
- [ ] Logs aparecen en consola ✅

### Pueblos
- [ ] Lista carga correctamente ✅
- [ ] Cada pueblo tiene imagen real ✅
- [ ] Cada pueblo tiene descripción ✅
- [ ] Detalle muestra imagen real ✅
- [ ] Detalle muestra descripción ✅
- [ ] Logs aparecen en consola ✅

### General
- [ ] No hay errores de TypeScript ✅
- [ ] No hay errores de lint ✅
- [ ] App compila sin errores ✅
- [ ] Navegación funciona correctamente ✅

---

## 🎉 CONCLUSIÓN

Si todos los checks están ✅, la versión **v2.8** está lista para producción.

**Cambios clave:**
- ✅ Login completo de Ultimate Member
- ✅ Datos reales desde JetEngine CCT

---

## 📞 SOPORTE

Si encuentras algún problema, revisa:

1. **RESUMEN_v2.8.md** - Resumen ejecutivo de cambios
2. **VERSION_v2.8.md** - Documentación completa de la versión
3. **CHANGELOG.md** - Historial de cambios
4. **Consola del navegador** - Logs detallados de la app

---

**🚀 ¡Listo para probar v2.8!**
