# ✅ Corrección del Sistema de Puntos - Resumen

## 🎯 Problema Principal

Los puntos se estaban calculando incorrectamente:
- ❌ **Antes**: Cada pueblo sumaba +1 punto (ejemplo: 70 pueblos = 70 puntos)
- ✅ **Ahora**: Cada pueblo suma su valor real del campo `puntos` (ejemplo: pueblo con 10 puntos + pueblo con 15 puntos = 25 puntos)

## 🔧 Cambios Realizados en la App

### 1. Pueblos Visitados (`app/pueblos-visitados.tsx`)

**Cálculo de puntos (Línea 317-321):**
```typescript
const totalPuntos = visitados.reduce((sum, p) => {
  const puntosPueblo = p.puntos || 0;
  console.log(`Pueblo: ${p.nombre} (ID: ${p.pueblo_id}) -> Puntos: ${puntosPueblo}`);
  return sum + puntosPueblo;
}, 0);
```

**Sincronización después de guardar (Línea 240-247):**
```typescript
const puntosRes = await fetch(`https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=${user.id}`);
if (puntosRes.ok) {
  const puntosData = await puntosRes.json();
  console.log('✅ Puntos sincronizados:', puntosData);
}
```

### 2. Puntos Conseguidos (`app/puntos-conseguidos.tsx`)

**Logging de datos recibidos (Línea 72-73):**
```typescript
const data = await puntosRes.json();
console.log('📥 Datos de /lpbe/v1/puntos:', data);
```

**Logging de totales calculados (Línea 121-123):**
```typescript
console.log(`📊 [Puntos Conseguidos] Total Pueblos: ${totalPueblos}`);
console.log(`🎯 [Puntos Conseguidos] Total Puntos: ${totalPuntos}`);
console.log(`⭐ [Puntos Conseguidos] Total Estrellas: ${totalEstrellas}`);
```

## 🔍 Cómo Verificar que Funciona Correctamente

### En la App (Console Logs)

Cuando abras "Pueblos Visitados", verás:
```
Pueblo: Albarracín (ID: 1) -> Puntos: 10
Pueblo: Aínsa (ID: 2) -> Puntos: 15
Pueblo: Cudillero (ID: 3) -> Puntos: 20
📊 Total Pueblos Visitados: 3
🎯 Total Puntos Calculados: 45
⭐ Total Estrellas: 12
```

Cuando abras "Puntos Conseguidos", verás:
```
📥 Datos de /lpbe/v1/puntos: { puntos_totales: 45, total_pueblos: 3, ... }
📊 [Puntos Conseguidos] Total Pueblos: 3
🎯 [Puntos Conseguidos] Total Puntos: 45
⭐ [Puntos Conseguidos] Total Estrellas: 12
```

### Verificación Manual

1. **Abre la app y ve a "Pueblos Visitados"**
2. **Abre la consola del navegador o del móvil**
3. **Verifica los logs**:
   - Cada pueblo debe mostrar su valor real de puntos (10, 15, 20, etc.)
   - El total debe ser la SUMA de esos valores
4. **Ve a "Puntos Conseguidos"**
5. **Verifica que los números coincidan exactamente**

## 📋 Tareas Pendientes en el Backend de WordPress

El endpoint `/lpbe/v1/puntos` debe recalcular SIEMPRE usando esta SQL:

```sql
WITH visitas AS (
    -- Visitas geolocalizadas
    SELECT DISTINCT v.id_lugar AS pueblo_id
    FROM w47fa_jet_cct_visita v
    WHERE v.checked = 1 AND v.id_miembro = :user_id
    
    UNION
    
    -- Visitas manuales
    SELECT DISTINCT vm.pueblo_id
    FROM w47fa_jet_cct_visita_manual vm
    WHERE vm.user_id = :user_id AND vm.checked = 1
)
SELECT 
    COUNT(DISTINCT visitas.pueblo_id) AS total_pueblos,
    COALESCE(SUM(l.puntos), 0) AS total_puntos
FROM visitas
LEFT JOIN w47fa_jet_cct_lugar l ON l._ID = visitas.pueblo_id;
```

## 📊 Datos que Fluyen

```
┌─────────────────────────────────────┐
│  w47fa_jet_cct_lugar                │
│  (Tabla de pueblos)                 │
│  - _ID: 1                           │
│  - nombre: "Albarracín"             │
│  - puntos: 10                       │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  /lpbe/v1/pueblos-visitados         │
│  Devuelve lista de pueblos          │
│  visitados por el usuario           │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  /jet-cct/lugar                     │
│  Devuelve todos los pueblos         │
│  con sus puntos                     │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  APP: pueblos-visitados.tsx         │
│  Combina ambos endpoints            │
│  Calcula: Σ(pueblo.puntos)          │
│  donde checked = 1                  │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  Al guardar cambios:                │
│  POST /lpbe/v1/visita-update        │
│  (Solo actualiza visitas)           │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  Sincronización:                    │
│  GET /lpbe/v1/puntos                │
│  (Recalcula total desde BD)         │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  APP: puntos-conseguidos.tsx        │
│  Muestra puntos_totales             │
│  del endpoint /puntos               │
└─────────────────────────────────────┘
```

## 🚫 Reglas Importantes

### ✅ LO QUE SÍ HACE

1. **Pueblos Visitados**: Calcula puntos sumando `pueblo.puntos` de todos los visitados
2. **Guardar Cambios**: Envía solo las modificaciones a `/visita-update`
3. **Después de Guardar**: Hace fetch a `/puntos` para sincronizar
4. **Puntos Conseguidos**: Muestra `puntos_totales` del endpoint `/puntos`
5. **Estrellas**: Se suman SOLO para mostrar, NO afectan a puntos

### ❌ LO QUE NO HACE

1. **NO suma +1 por cada pueblo**: Usa el valor real del campo `puntos`
2. **NO cuenta estrellas como puntos**: Estrellas son solo valoración
3. **NO hace incrementos**: Siempre recalcula el total completo
4. **NO guarda puntos en la app**: Los puntos se calculan desde la BD

## 🧪 Casos de Prueba

### Caso 1: Marcar un pueblo como visitado
- Usuario marca "Albarracín" (10 puntos) como visitado
- Resultado esperado: +10 puntos (no +1)

### Caso 2: Cambiar estrellas
- Usuario cambia estrellas de 3 a 5
- Resultado esperado: Puntos NO cambian

### Caso 3: Desmarcar pueblo visitado
- Usuario desmarca "Cudillero" (20 puntos)
- Resultado esperado: -20 puntos (no -1)

### Caso 4: Verificar sincronía
- Pueblos Visitados muestra: 150 puntos
- Puntos Conseguidos muestra: 150 puntos
- Ambos deben coincidir SIEMPRE

## 📝 Archivos Modificados

1. `app/pueblos-visitados.tsx` - Cálculo correcto de puntos + logs
2. `app/puntos-conseguidos.tsx` - Logs para verificación
3. `BACKEND_SQL_PUNTOS.md` - Instrucciones SQL para el backend
4. `RESUMEN_CORRECCION_PUNTOS.md` - Este archivo

## 🎓 Conceptos Clave

- **`puntos` (campo BD)**: Valor que vale cada pueblo (10, 15, 20, etc.)
- **`estrellas` (campo BD)**: Valoración del usuario (1-5), NO afecta puntos
- **`checked` (campo BD)**: 1 = visitado, 0 = pendiente
- **`tipo` (campo BD)**: 'auto' = geolocalizado, 'manual' = marcado por usuario
- **`puntos_totales`**: SUMA de `pueblo.puntos` de todos los visitados (checked=1)

## 🔄 Flujo de Sincronización

```
1. Usuario marca/desmarca pueblos
   ↓
2. Cambios se acumulan en memoria (editChanges)
   ↓
3. Usuario pulsa "Guardar"
   ↓
4. Se envían SOLO los cambios a /visita-update
   ↓
5. Se recarga lista de pueblos desde BD
   ↓
6. Se hace fetch a /puntos para sincronizar
   ↓
7. Ambas pantallas muestran los mismos totales
```

## 💡 Debugging

Si los números no coinciden entre pantallas:

1. **Abre la consola**
2. **Busca los logs** con emojis (📊, 🎯, ⭐, 📥, ✅)
3. **Compara los valores**:
   - ¿Los pueblos tienen `puntos` o están en 0?
   - ¿El endpoint `/puntos` devuelve el total correcto?
   - ¿Hay pueblos duplicados?
4. **Verifica el backend**:
   - ¿El SQL suma `l.puntos` o hace COUNT?
   - ¿Se eliminan duplicados con DISTINCT?
   - ¿Solo cuenta checked=1?

---

**Fecha de corrección**: 2025-01-30  
**Autor**: Rork  
**Estado**: ✅ Implementado en la app, pendiente de ajuste en backend WordPress
