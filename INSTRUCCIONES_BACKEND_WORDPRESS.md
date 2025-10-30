# 🚨 CORRECCIÓN URGENTE: Endpoint /lpbe/v1/puntos

## 📍 Problema Detectado

El endpoint `https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=14782` está devolviendo:
- ❌ **117 puntos** y **29 pueblos**

Cuando debería devolver (según la web):
- ✅ **1145 puntos** y **77 pueblos**

## 🔍 Causa del Error

El backend está calculando los puntos incorrectamente:
- ❌ **Método actual**: Incrementa +1 por cada pueblo visitado
- ✅ **Método correcto**: Debe sumar el valor real del campo `puntos` de cada pueblo

## 📋 Archivo a Modificar en WordPress

Busca el archivo que maneja el endpoint `/lpbe/v1/puntos`. Probablemente está en:
- `wp-content/plugins/lpbe-api/` o similar
- `wp-content/themes/tu-tema/functions.php` 
- Algún archivo que registra `register_rest_route()` para `lpbe/v1/puntos`

## ✅ SQL Correcta a Implementar

Reemplaza el código actual del endpoint con esta lógica SQL:

```sql
-- Base de datos: lospuebl_2024

-- Paso 1: Obtener el id_miembro del user_id de WordPress
SELECT _ID as id_miembro 
FROM w47fa_jet_cct_miembro 
WHERE id_usuario = :user_id
LIMIT 1;

-- Paso 2: Obtener pueblos visitados (sin duplicados) y sumar puntos reales
WITH auto AS (
    -- Visitas geolocalizadas (automáticas)
    SELECT v.id_lugar AS pueblo_id
    FROM w47fa_jet_cct_visita v
    WHERE v.id_miembro = :id_miembro 
      AND v.checked = 1
),
manual AS (
    -- Visitas manuales
    SELECT vm.pueblo_id
    FROM w47fa_jet_cct_visita_manual vm
    WHERE vm.user_id = :user_id
      AND vm.checked = 1
),
visitas AS (
    -- Unir ambas tablas sin duplicados
    SELECT pueblo_id FROM auto
    UNION
    SELECT pueblo_id FROM manual
)
SELECT 
    COUNT(DISTINCT v.pueblo_id) AS total_pueblos,
    COALESCE(SUM(l.puntos), 0) AS puntos_totales
FROM visitas v
LEFT JOIN w47fa_jet_cct_lugar l ON l._ID = v.pueblo_id;

-- Paso 3: Obtener favoritos (pueblos con 5 estrellas)
SELECT 
    vp.pueblo_id,
    l.nombre,
    l.provincia,
    l.puntos,
    vp.rating AS estrellas
FROM w47fa_jet_cct_valoracion_pueblo vp
LEFT JOIN w47fa_jet_cct_lugar l ON l._ID = vp.pueblo_id
WHERE vp.user_id = :user_id 
  AND vp.rating = 5
ORDER BY l.nombre ASC;
```

## 🔧 Implementación en PHP (WordPress)

```php
function lpbe_get_puntos_usuario( $request ) {
    global $wpdb;
    
    $user_id = $request->get_param('user_id');
    
    if ( empty($user_id) ) {
        return new WP_Error( 'missing_user_id', 'User ID is required', array( 'status' => 400 ) );
    }
    
    // 1. Obtener id_miembro
    $id_miembro = $wpdb->get_var( $wpdb->prepare(
        "SELECT _ID FROM {$wpdb->prefix}jet_cct_miembro WHERE id_usuario = %d LIMIT 1",
        $user_id
    ));
    
    // 2. Calcular pueblos y puntos totales
    $query = "
        WITH auto AS (
            SELECT v.id_lugar AS pueblo_id
            FROM {$wpdb->prefix}jet_cct_visita v
            WHERE v.id_miembro = %d AND v.checked = 1
        ),
        manual AS (
            SELECT vm.pueblo_id
            FROM {$wpdb->prefix}jet_cct_visita_manual vm
            WHERE vm.user_id = %d AND vm.checked = 1
        ),
        visitas AS (
            SELECT pueblo_id FROM auto
            UNION
            SELECT pueblo_id FROM manual
        )
        SELECT 
            COUNT(DISTINCT v.pueblo_id) AS total_pueblos,
            COALESCE(SUM(l.puntos), 0) AS puntos_totales
        FROM visitas v
        LEFT JOIN {$wpdb->prefix}jet_cct_lugar l ON l._ID = v.pueblo_id
    ";
    
    $stats = $wpdb->get_row( $wpdb->prepare( $query, $id_miembro, $user_id ) );
    
    $total_pueblos = intval( $stats->total_pueblos ?? 0 );
    $puntos_totales = intval( $stats->puntos_totales ?? 0 );
    
    // 3. Calcular nivel basado en puntos
    $niveles = array(
        array( 'nombre' => 'Novato', 'min' => 0, 'max' => 99 ),
        array( 'nombre' => 'Explorador', 'min' => 100, 'max' => 299 ),
        array( 'nombre' => 'Viajero', 'min' => 300, 'max' => 599 ),
        array( 'nombre' => 'Aventurero', 'min' => 600, 'max' => 999 ),
        array( 'nombre' => 'Maestro', 'min' => 1000, 'max' => 1499 ),
        array( 'nombre' => 'Leyenda', 'min' => 1500, 'max' => PHP_INT_MAX ),
    );
    
    $nivel_actual = 'Novato';
    $nivel_siguiente = 'Explorador';
    
    foreach ( $niveles as $key => $nivel ) {
        if ( $puntos_totales >= $nivel['min'] && $puntos_totales <= $nivel['max'] ) {
            $nivel_actual = $nivel['nombre'];
            $nivel_siguiente = isset( $niveles[$key + 1] ) ? $niveles[$key + 1]['nombre'] : 'Máximo alcanzado';
            break;
        }
    }
    
    // 4. Obtener favoritos (5 estrellas)
    $favoritos = $wpdb->get_results( $wpdb->prepare(
        "SELECT 
            vp.pueblo_id,
            l.nombre,
            l.provincia,
            l.puntos,
            vp.rating AS estrellas
        FROM {$wpdb->prefix}jet_cct_valoracion_pueblo vp
        LEFT JOIN {$wpdb->prefix}jet_cct_lugar l ON l._ID = vp.pueblo_id
        WHERE vp.user_id = %d AND vp.rating = 5
        ORDER BY l.nombre ASC",
        $user_id
    ), ARRAY_A );
    
    // 5. Formatear favoritos
    $favoritos_formateados = array_map( function( $fav ) {
        return array(
            'pueblo_id' => strval( $fav['pueblo_id'] ),
            'nombre' => $fav['nombre'],
            'provincia' => $fav['provincia'],
            'puntos' => intval( $fav['puntos'] ?? 0 ),
            'estrellas' => intval( $fav['estrellas'] ?? 0 ),
        );
    }, $favoritos );
    
    // 6. Respuesta final
    return rest_ensure_response( array(
        'puntos_totales' => $puntos_totales,
        'total_pueblos' => $total_pueblos,
        'nivel' => $nivel_actual,
        'nivel_siguiente' => $nivel_siguiente,
        'favoritos' => $favoritos_formateados,
    ));
}

// Registrar el endpoint
add_action( 'rest_api_init', function () {
    register_rest_route( 'lpbe/v1', '/puntos', array(
        'methods' => 'GET',
        'callback' => 'lpbe_get_puntos_usuario',
        'permission_callback' => '__return_true',
    ));
});
```

## 🧪 Validación del Endpoint Corregido

Después de implementar los cambios, verifica con:

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
  "favoritos": [
    {
      "pueblo_id": "1",
      "nombre": "Albarracín",
      "provincia": "Teruel",
      "puntos": 15,
      "estrellas": 5
    }
  ]
}
```

## 🚨 Reglas Críticas

### ✅ LO QUE DEBE HACER

1. **Siempre recalcular**: No guardar totales en ninguna tabla
2. **Sumar `l.puntos`**: Usar el campo `puntos` de la tabla `w47fa_jet_cct_lugar`
3. **Sin duplicados**: Usar `UNION` (no `UNION ALL`) y `COUNT(DISTINCT ...)`
4. **Solo checked=1**: Contar únicamente pueblos marcados como visitados
5. **Unir ambas tablas**: Considerar tanto visitas auto como manuales

### ❌ LO QUE NO DEBE HACER

1. **NO incrementar**: Nunca hacer `UPDATE puntos = puntos + 1`
2. **NO contar pueblos**: No hacer `COUNT(*) AS puntos`
3. **NO guardar totales**: No crear columnas `puntos_totales` en usuarios
4. **NO usar estrellas**: Las estrellas son valoración, no puntos

## 📊 Tablas Involucradas

### w47fa_jet_cct_miembro
```
_ID          | id_usuario
-------------|------------
123          | 14782
```

### w47fa_jet_cct_visita (visitas geolocalizadas)
```
id_miembro   | id_lugar  | checked
-------------|-----------|--------
123          | 1         | 1
123          | 5         | 1
```

### w47fa_jet_cct_visita_manual (visitas manuales)
```
user_id      | pueblo_id | checked | estrellas
-------------|-----------|---------|----------
14782        | 10        | 1       | 5
14782        | 15        | 1       | 4
```

### w47fa_jet_cct_lugar (pueblos)
```
_ID          | nombre        | puntos
-------------|---------------|--------
1            | Albarracín    | 15
5            | Aínsa         | 10
10           | Cudillero     | 20
```

### Cálculo de puntos para user_id=14782:
- Pueblo 1 (Albarracín): 15 puntos
- Pueblo 5 (Aínsa): 10 puntos  
- Pueblo 10 (Cudillero): 20 puntos
- **Total: 45 puntos** (NO 3 puntos)

## 🔄 Flujo de Sincronización

```
Usuario marca pueblo como visitado en la app
           ↓
POST /lpbe/v1/visita-update
(Actualiza checked=1 en BD)
           ↓
App hace GET /lpbe/v1/puntos
           ↓
Backend ejecuta SQL con SUM(l.puntos)
           ↓
Backend devuelve total correcto
           ↓
App muestra puntos sincronizados
```

## 📝 Checklist de Implementación

- [ ] Localizar archivo PHP que registra el endpoint `/lpbe/v1/puntos`
- [ ] Reemplazar la consulta SQL con la versión corregida
- [ ] Asegurar que se usa `SUM(l.puntos)` y no `COUNT(*)`
- [ ] Verificar que se eliminan duplicados con `UNION` (sin ALL)
- [ ] Probar el endpoint con varios users con `curl` o Postman
- [ ] Comparar resultado con lo que muestra la web de WordPress
- [ ] Verificar que la app móvil muestra los mismos valores

## 🆘 Soporte

Si tienes dudas sobre la implementación:

1. **Revisa los logs de MySQL** para ver qué SQL se está ejecutando actualmente
2. **Ejecuta manualmente** la SQL propuesta en phpMyAdmin para verificar los resultados
3. **Compara** el total de puntos con lo que muestra la web (admin de WordPress)
4. **Contacta al desarrollador de la app** si necesitas ajustar el formato de la respuesta JSON

---

**Estado**: 🚨 Urgente - Endpoint devolviendo valores incorrectos  
**Impacto**: Alta - Los usuarios ven puntos incorrectos en la app móvil  
**Prioridad**: Alta - Debe corregirse lo antes posible  
**Fecha**: 2025-01-30
