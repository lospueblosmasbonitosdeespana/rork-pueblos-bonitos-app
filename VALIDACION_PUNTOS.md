# ✅ Validación del Sistema de Puntos

## 📋 Estado Actual

### ❌ Problema Detectado
El endpoint `/lpbe/v1/puntos` devuelve valores incorrectos:
- **Actual**: 117 puntos, 29 pueblos
- **Esperado**: 1145 puntos, 77 pueblos (según la web)

### 🎯 Causa
El backend de WordPress calcula puntos incorrectamente (+1 por pueblo en lugar de sumar el campo `puntos`)

### ✅ Solución Implementada en la App
La app React Native está **lista** para recibir los datos correctos del backend una vez se corrija.

---

## 🔍 Cómo Validar Después de Corregir el Backend

### 1️⃣ Verificar el Endpoint Directamente

Prueba el endpoint con cURL o Postman:

```bash
curl "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=14782"
```

**Respuesta esperada:**
```json
{
  "puntos_totales": 1145,
  "total_pueblos": 77,
  "nivel": "Maestro",
  "nivel_siguiente": "Leyenda",
  "favoritos": [...]
}
```

**Criterio de OK:** ✅
- `puntos_totales` debe ser **1145** (no 117)
- `total_pueblos` debe ser **77** (no 29)

---

### 2️⃣ Verificar en la App Móvil

#### A. Pantalla "Pueblos Visitados"

1. Abre la app y ve a **"Pueblos Visitados"**
2. Abre la **consola del navegador** (si es web) o **React Native Debugger** (si es móvil)
3. Busca el bloque de logs:

```
═══════════════════════════════════════
📊 [PUEBLOS VISITADOS - CÁLCULO LOCAL]
═══════════════════════════════════════
🏘️  Total pueblos visitados: 77
🎯 Total puntos (suma real): 1145
⭐ Total estrellas: [número]

🔍 Detalle por pueblo:
  - Albarracín (ID: 1): 15 pts
  - Aínsa (ID: 2): 10 pts
  - Cudillero (ID: 3): 20 pts
  ... (más pueblos)
═══════════════════════════════════════
```

**Criterio de OK:** ✅
- Total pueblos visitados = **77**
- Total puntos (suma real) = **1145**
- Cada pueblo muestra su valor real de puntos (10, 15, 20, etc.)

#### B. Después de Guardar Cambios

Cuando edites y guardes cambios en "Pueblos Visitados", verás:

```
═══════════════════════════════════════
✅ [SINCRONIZACIÓN POST-GUARDADO]
═══════════════════════════════════════
📥 Datos del endpoint /lpbe/v1/puntos:
  🎯 Puntos totales: 1145
  🏘️  Total pueblos: 77
  🏆 Nivel: Maestro
  🎖️  Siguiente: Leyenda
═══════════════════════════════════════
```

**Criterio de OK:** ✅
- Los valores del endpoint coinciden con los calculados localmente

#### C. Pantalla "Puntos Conseguidos"

1. Ve a **"Puntos Conseguidos"**
2. Revisa los logs en consola:

```
📥 [PUNTOS ENDPOINT] Datos recibidos: {
  puntos_totales: 1145,
  total_pueblos: 77,
  nivel: 'Maestro',
  nivel_siguiente: 'Leyenda',
  favoritos_count: 5
}

═══════════════════════════════════════
📊 [PUNTOS CONSEGUIDOS - PANTALLA]
═══════════════════════════════════════
🏘️  Pueblos visitados: 77
🎯 Puntos totales: 1145
⭐ Estrellas totales: [número]
🏆 Nivel actual: Maestro
🎖️  Siguiente nivel: Leyenda
═══════════════════════════════════════
```

**Criterio de OK:** ✅
- Puntos totales = **1145**
- Pueblos visitados = **77**
- Los números coinciden con "Pueblos Visitados"

---

### 3️⃣ Validación Completa

Realiza este test completo:

#### Paso 1: Estado Inicial
1. Abre "Pueblos Visitados" → Anota puntos y pueblos visitados
2. Abre "Puntos Conseguidos" → Verifica que los números coinciden

**✅ Esperado**: Ambas pantallas muestran los mismos totales

#### Paso 2: Marcar un Pueblo como Visitado
1. Ve a "Pueblos Visitados"
2. Pulsa "Editar"
3. Marca un pueblo nuevo como "Visitado" (ejemplo: Cudillero con 20 puntos)
4. Pulsa "Guardar"
5. Observa los logs de sincronización

**✅ Esperado**: 
- Puntos aumentan en **+20** (el valor real del pueblo)
- NO aumentan en +1
- Los logs muestran la nueva suma correcta

#### Paso 3: Verificar Sincronización
1. Ve a "Puntos Conseguidos"
2. Verifica los totales

**✅ Esperado**: Los puntos reflejan el cambio (+20 en el ejemplo)

#### Paso 4: Desmarcar un Pueblo
1. Ve a "Pueblos Visitados"
2. Pulsa "Editar"
3. Desmarca un pueblo visitado (pulsa "Borrar")
4. Pulsa "Guardar"

**✅ Esperado**: 
- Puntos disminuyen en el valor real del pueblo
- Ambas pantallas se sincronizan

---

## 🧪 Casos de Prueba Específicos

### Caso 1: Pueblo con 10 puntos
```
Acción: Marcar "Aínsa" (10 pts) como visitado
Resultado esperado: +10 puntos totales
Resultado INCORRECTO: +1 punto total
```

### Caso 2: Pueblo con 15 puntos
```
Acción: Marcar "Albarracín" (15 pts) como visitado
Resultado esperado: +15 puntos totales
Resultado INCORRECTO: +1 punto total
```

### Caso 3: Pueblo con 20 puntos
```
Acción: Marcar "Cudillero" (20 pts) como visitado
Resultado esperado: +20 puntos totales
Resultado INCORRECTO: +1 punto total
```

### Caso 4: Cambiar Estrellas
```
Acción: Cambiar estrellas de 3 a 5 en cualquier pueblo
Resultado esperado: Puntos NO cambian (solo cambian estrellas)
```

---

## 🚨 Errores Comunes a Detectar

### ❌ Error 1: Endpoint sigue sumando +1 por pueblo
```json
// INCORRECTO
{
  "puntos_totales": 77,  // Igual al número de pueblos
  "total_pueblos": 77
}

// CORRECTO
{
  "puntos_totales": 1145,  // Suma real de campo "puntos"
  "total_pueblos": 77
}
```

### ❌ Error 2: Hay pueblos duplicados
```
Síntoma: "Puntos Conseguidos" muestra más pueblos que "Pueblos Visitados"
Causa: No se está usando UNION (sin ALL) o COUNT(DISTINCT)
```

### ❌ Error 3: Pueblos sin valor de puntos
```
Síntoma: Algunos pueblos suman 0 puntos en los logs
Causa: El JOIN no está trayendo el campo "puntos" de w47fa_jet_cct_lugar
```

### ❌ Error 4: Diferencia entre pantallas
```
Síntoma: "Pueblos Visitados" muestra 1145 pts, "Puntos Conseguidos" muestra 117 pts
Causa: El endpoint no se ha corregido o no se está recalculando
```

---

## 📊 Datos de Referencia

### user_id: 14782 (Caso de Prueba)

**Valores esperados después de la corrección:**
- Puntos totales: **1145**
- Pueblos visitados: **77**
- Nivel: **Maestro** (1000-1499 puntos)
- Nivel siguiente: **Leyenda** (1500+ puntos)

**Valores INCORRECTOS actuales:**
- Puntos totales: **117** ❌
- Pueblos visitados: **29** ❌

---

## 📝 Checklist de Validación

Marca cada item después de verificarlo:

### Backend de WordPress
- [ ] Endpoint `/lpbe/v1/puntos` usa `SUM(l.puntos)` en lugar de `COUNT(*)`
- [ ] Se eliminan duplicados con `UNION` (sin ALL)
- [ ] Se usa `COUNT(DISTINCT pueblo_id)`
- [ ] Solo se cuentan pueblos con `checked = 1`
- [ ] Se unen tablas de visitas auto y manual
- [ ] La respuesta JSON incluye `puntos_totales`, `total_pueblos`, `nivel`, `nivel_siguiente`

### App React Native
- [x] "Pueblos Visitados" calcula puntos localmente sumando `pueblo.puntos`
- [x] Después de guardar, se hace fetch a `/lpbe/v1/puntos`
- [x] "Puntos Conseguidos" usa `puntos_totales` del endpoint
- [x] Los logs muestran detalles completos de cálculo
- [x] Las estrellas NO afectan a los puntos

### Verificación de Usuario
- [ ] Los puntos para `user_id=14782` son **1145** (no 117)
- [ ] Los pueblos visitados son **77** (no 29)
- [ ] Ambas pantallas muestran los mismos totales
- [ ] Al marcar/desmarcar pueblos, los puntos cambian correctamente
- [ ] Los totales coinciden con la web de WordPress

---

## 🆘 Troubleshooting

### Si los números siguen sin coincidir:

1. **Revisa los logs de la app**:
   - Busca `[PUEBLOS VISITADOS - CÁLCULO LOCAL]`
   - Busca `[PUNTOS ENDPOINT] Datos recibidos`
   - Compara ambos valores

2. **Prueba el endpoint manualmente**:
   ```bash
   curl "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=14782"
   ```
   Si devuelve 117, el problema está en el backend

3. **Revisa la base de datos**:
   ```sql
   -- Ver puntos de un pueblo específico
   SELECT _ID, nombre, puntos FROM w47fa_jet_cct_lugar WHERE _ID = 1;
   
   -- Ver pueblos visitados por el usuario
   SELECT COUNT(*) FROM w47fa_jet_cct_visita 
   WHERE id_miembro = (SELECT _ID FROM w47fa_jet_cct_miembro WHERE id_usuario = 14782)
   AND checked = 1;
   ```

4. **Verifica que no hay caché**:
   - En WordPress: Limpia caché de plugins
   - En la app: Fuerza refresh (pull-to-refresh)

---

## ✅ Confirmación Final

Cuando todo esté corregido, deberías ver:

**En la consola de la app:**
```
═══════════════════════════════════════
📊 [PUEBLOS VISITADOS - CÁLCULO LOCAL]
═══════════════════════════════════════
🏘️  Total pueblos visitados: 77
🎯 Total puntos (suma real): 1145
⭐ Total estrellas: 245
═══════════════════════════════════════

═══════════════════════════════════════
📊 [PUNTOS CONSEGUIDOS - PANTALLA]
═══════════════════════════════════════
🏘️  Pueblos visitados: 77
🎯 Puntos totales: 1145
⭐ Estrellas totales: 245
🏆 Nivel actual: Maestro
🎖️  Siguiente nivel: Leyenda
═══════════════════════════════════════
```

**En la pantalla:**
- "Pueblos Visitados" → **77 pueblos, 1145 puntos**
- "Puntos Conseguidos" → **77 pueblos, 1145 puntos**
- Ambos coinciden ✅

---

**Fecha de validación**: Pendiente de corrección del backend  
**Estado**: ⏳ Esperando corrección en `/lpbe/v1/puntos`  
**App lista**: ✅ Sí, preparada para recibir datos correctos
