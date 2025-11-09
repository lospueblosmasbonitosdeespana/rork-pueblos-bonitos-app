# 🔄 CORRECCIÓN ENDPOINTS LITE - Sincronización App/Web

## 🎯 PROBLEMA ACTUAL

La app muestra **81 pueblos visitados** mientras que la web muestra **84 pueblos visitados**.

**Causa:** Los endpoints `/lpbe/v1/pueblos-visitados-lite` y `/lpbe/v1/puntos-lite` NO están haciendo correctamente el UNION de las dos tablas de visitas.

---

## ✅ SOLUCIÓN

Ambos endpoints deben usar la **misma lógica** para calcular pueblos visitados:

### Lógica correcta (UNION de 2 tablas):

```sql
-- Conjunto de pueblos visitados = 
-- (visitas automáticas) UNION (visitas manuales con checked=1)

SELECT DISTINCT pueblo_id FROM (
    -- Visitas automáticas (geolocalización)
    SELECT v.id_lugar AS pueblo_id
    FROM w47fa_jet_cct_visita v
    JOIN w47fa_jet_cct_miembro m ON m._ID = v.id_miembro
    WHERE m.id_usuario = :user_id AND v.checked = 1
    
    UNION
    
    -- Visitas manuales (marcadas por el usuario)
    SELECT vm.pueblo_id
    FROM w47fa_jet_cct_visita_manual vm
    WHERE vm.user_id = :user_id AND vm.checked = 1
) AS visitas_unificadas
```

**IMPORTANTE:**
- Sin `LIMIT` ni paginación (`posts_per_page = -1`)
- El campo `total` debe ser `COUNT(DISTINCT pueblo_id)` del conjunto resultante
- NO sumar filas de cada tabla por separado

---

## 📝 CÓDIGO PHP PARA WORDPRESS

### 1️⃣ Endpoint `/lpbe/v1/pueblos-visitados-lite`

```php
<?php
add_action('rest_api_init', function () {
    register_rest_route('lpbe/v1', '/pueblos-visitados-lite', [
        'methods' => 'GET',
        'callback' => 'lpbe_get_pueblos_visitados_lite',
        'permission_callback' => '__return_true'
    ]);
});

function lpbe_get_pueblos_visitados_lite($request) {
    global $wpdb;
    
    $user_param = $request->get_param('user');
    
    // Obtener user_id
    if ($user_param === 'current') {
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error('not_logged_in', 'Usuario no autenticado', ['status' => 401]);
        }
    } else {
        $user_id = intval($user_param);
    }
    
    if (!$user_id) {
        return new WP_Error('missing_user', 'Se requiere parámetro user', ['status' => 400]);
    }
    
    $prefix = $wpdb->prefix;
    
    // UNION de pueblos visitados (automáticos + manuales)
    $sql = "
        SELECT DISTINCT pueblo_id
        FROM (
            -- Visitas automáticas (GPS)
            SELECT v.id_lugar AS pueblo_id
            FROM {$prefix}jet_cct_visita v
            JOIN {$prefix}jet_cct_miembro m ON m._ID = v.id_miembro
            WHERE m.id_usuario = %d AND v.checked = 1
            
            UNION
            
            -- Visitas manuales
            SELECT vm.pueblo_id
            FROM {$prefix}jet_cct_visita_manual vm
            WHERE vm.user_id = %d AND vm.checked = 1
        ) AS visitas_unificadas
    ";
    
    $pueblos_ids = $wpdb->get_col($wpdb->prepare($sql, $user_id, $user_id));
    $total = count($pueblos_ids);
    
    // Obtener información detallada de cada pueblo
    $lugares = [];
    if ($total > 0) {
        $ids_string = implode(',', array_map('intval', $pueblos_ids));
        
        $sql_lugares = "
            SELECT 
                l._ID AS id,
                l.post_title AS nombre,
                l.slug,
                l.puntos
            FROM {$prefix}jet_cct_lugar l
            WHERE l._ID IN ($ids_string)
            ORDER BY l.post_title ASC
        ";
        
        $lugares = $wpdb->get_results($sql_lugares, ARRAY_A);
    }
    
    return [
        'user_id' => $user_id,
        'total' => $total,
        'lugares' => $lugares
    ];
}
```

---

### 2️⃣ Endpoint `/lpbe/v1/puntos-lite`

```php
<?php
add_action('rest_api_init', function () {
    register_rest_route('lpbe/v1', '/puntos-lite', [
        'methods' => 'GET',
        'callback' => 'lpbe_get_puntos_lite',
        'permission_callback' => '__return_true'
    ]);
});

function lpbe_get_puntos_lite($request) {
    global $wpdb;
    
    $user_param = $request->get_param('user');
    
    // Obtener user_id
    if ($user_param === 'current') {
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error('not_logged_in', 'Usuario no autenticado', ['status' => 401]);
        }
    } else {
        $user_id = intval($user_param);
    }
    
    if (!$user_id) {
        return new WP_Error('missing_user', 'Se requiere parámetro user', ['status' => 400]);
    }
    
    $prefix = $wpdb->prefix;
    
    // UNION de pueblos visitados (mismo que pueblos-visitados-lite)
    $sql_pueblos = "
        SELECT DISTINCT pueblo_id
        FROM (
            -- Visitas automáticas (GPS)
            SELECT v.id_lugar AS pueblo_id
            FROM {$prefix}jet_cct_visita v
            JOIN {$prefix}jet_cct_miembro m ON m._ID = v.id_miembro
            WHERE m.id_usuario = %d AND v.checked = 1
            
            UNION
            
            -- Visitas manuales
            SELECT vm.pueblo_id
            FROM {$prefix}jet_cct_visita_manual vm
            WHERE vm.user_id = %d AND vm.checked = 1
        ) AS visitas_unificadas
    ";
    
    $pueblos_ids = $wpdb->get_col($wpdb->prepare($sql_pueblos, $user_id, $user_id));
    $total_pueblos = count($pueblos_ids);
    
    // Calcular puntos totales
    $puntos_totales = 0;
    if ($total_pueblos > 0) {
        $ids_string = implode(',', array_map('intval', $pueblos_ids));
        
        $sql_puntos = "
            SELECT COALESCE(SUM(puntos), 0) AS total
            FROM {$prefix}jet_cct_lugar
            WHERE _ID IN ($ids_string)
        ";
        
        $puntos_totales = (int) $wpdb->get_var($sql_puntos);
    }
    
    return [
        'user_id' => $user_id,
        'total' => $total_pueblos,
        'puntos_totales' => $puntos_totales
    ];
}
```

---

## 📊 EJEMPLO DE RESPUESTAS CORRECTAS

### `/lpbe/v1/pueblos-visitados-lite?user=current`
```json
{
  "user_id": 14732,
  "total": 84,
  "lugares": [
    { "id": 125, "nombre": "Aínsa", "slug": "ainsa", "puntos": 15 },
    { "id": 208, "nombre": "Peñíscola", "slug": "peniscola", "puntos": 10 }
  ]
}
```

### `/lpbe/v1/puntos-lite?user=current`
```json
{
  "user_id": 14732,
  "total": 84,
  "puntos_totales": 1245
}
```

---

## ✅ VERIFICACIÓN DESPUÉS DEL CAMBIO

### 1. Probar endpoints directamente

```bash
# Usuario actual (requiere autenticación)
curl -X GET "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-visitados-lite?user=current" \
  -H "Cookie: wordpress_logged_in_xxx=..."

curl -X GET "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos-lite?user=current" \
  -H "Cookie: wordpress_logged_in_xxx=..."

# Usuario específico
curl -X GET "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/pueblos-visitados-lite?user=14732"
curl -X GET "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos-lite?user=14732"
```

### 2. Verificar que `total` es el mismo en ambos

**Debe cumplirse:**
- `/pueblos-visitados-lite` → `total: 84`
- `/puntos-lite` → `total: 84`
- Web del usuario → 84 pueblos visitados

### 3. Verificar que los IDs coinciden exactamente

Ejecutar en phpMyAdmin:

```sql
-- Pueblos visitados según la lógica correcta
SELECT DISTINCT pueblo_id FROM (
    SELECT v.id_lugar AS pueblo_id
    FROM w47fa_jet_cct_visita v
    JOIN w47fa_jet_cct_miembro m ON m._ID = v.id_miembro
    WHERE m.id_usuario = 14732 AND v.checked = 1
    
    UNION
    
    SELECT vm.pueblo_id
    FROM w47fa_jet_cct_visita_manual vm
    WHERE vm.user_id = 14732 AND vm.checked = 1
) AS visitas_unificadas
ORDER BY pueblo_id;
```

Los IDs devueltos por esta consulta deben coincidir **exactamente** con:
- Los IDs en `/wp-json/lpbe/v1/pueblos-visitados-lite?user=14732`
- Los que usa `/wp-json/lpbe/v1/puntos-lite?user=14732` para calcular puntos

---

## 🚨 ERRORES COMUNES A EVITAR

### ❌ ERROR 1: Usar solo una tabla
```php
// INCORRECTO - Solo lee visitas manuales
SELECT pueblo_id FROM w47fa_jet_cct_visita_manual WHERE user_id = :user_id
```

### ❌ ERROR 2: Sumar totales por separado
```php
// INCORRECTO - Cuenta pueblos duplicados
$total_auto = count(visitas_auto);
$total_manual = count(visitas_manual);
$total = $total_auto + $total_manual; // Si un pueblo está en ambas, se cuenta 2 veces
```

### ❌ ERROR 3: Usar paginación
```php
// INCORRECTO - Devuelve solo parte de los resultados
'posts_per_page' => 10 // NO HACER ESTO
```

### ✅ CORRECTO: UNION con DISTINCT
```php
// CORRECTO - Elimina duplicados automáticamente
SELECT DISTINCT pueblo_id FROM (
    SELECT id_lugar AS pueblo_id FROM jet_cct_visita ...
    UNION
    SELECT pueblo_id FROM jet_cct_visita_manual ...
) AS visitas_unificadas
```

---

## 🎯 CRITERIOS DE ÉXITO

El problema estará **100% resuelto** cuando:

- [ ] `/pueblos-visitados-lite?user=14732` devuelve `total: 84`
- [ ] `/puntos-lite?user=14732` devuelve `total: 84`
- [ ] Los IDs de lugares en ambos endpoints son idénticos
- [ ] Los totales coinciden con la web (84 pueblos visitados)
- [ ] La app muestra: **84 pueblos visitados** (antes mostraba 81)
- [ ] La app muestra: **84 pueblos** en "Puntos Conseguidos" (antes mostraba 81)
- [ ] Los puntos totales se calculan correctamente usando esos 84 pueblos

---

## 📁 UBICACIÓN EN WORDPRESS

Estos endpoints están en:
- **Snippets** (plugin Code Snippets)
- **functions.php** del tema activo
- **Plugin personalizado** (si existe)

Busca los snippets que contengan:
- `register_rest_route('lpbe/v1', '/pueblos-visitados-lite'`
- `register_rest_route('lpbe/v1', '/puntos-lite'`

Reemplaza el código de cada uno con el código de este documento.

---

## ⚠️ IMPORTANTE

### NO tocar el endpoint `/lpbe/v1/visita-update`
- Este endpoint ya está correcto según `INSTRUCCIONES_SINCRONIZACION_WEB_APP.md`
- Solo se deben actualizar los endpoints **LITE** de lectura

### Orden de implementación
1. Actualizar `/lpbe/v1/pueblos-visitados-lite` primero
2. Probar que devuelve `total: 84`
3. Actualizar `/lpbe/v1/puntos-lite` después
4. Verificar que ambos devuelven el mismo `total`

---

## 🆘 SOPORTE

Si después de aplicar los cambios sigue habiendo diferencia:

1. **Verifica en phpMyAdmin** que la consulta SQL devuelve 84 registros
2. **Revisa los logs de PHP** en WordPress por errores
3. **Compara los IDs** devueltos por el endpoint con los de la base de datos
4. **Verifica** que no hay otro endpoint o caché interfiriendo
5. **Limpia la caché** de WordPress si usas algún plugin de caché

---

**Fecha**: 2025-01-31  
**Usuario afectado**: 14732 (y otros usuarios)  
**Prioridad**: 🔴 Alta - Datos incorrectos en la app  
**Estado**: ⏳ Pendiente de implementación en WordPress  
**Impacto**: 🟡 Medio - La app funciona pero muestra datos desactualizados
