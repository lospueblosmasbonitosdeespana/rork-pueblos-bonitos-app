# ACTUALIZACIÓN ENDPOINT /lpbe/v1/puntos

## UBICACIÓN
El endpoint debe actualizarse en WordPress (snippet PHP o plugin).

## CÓDIGO PHP COMPLETO

```php
<?php
add_action('rest_api_init', function () {
    register_rest_route('lpbe/v1', '/puntos', [
        'methods' => 'GET',
        'callback' => 'lpbe_get_user_points_v2',
        'permission_callback' => '__return_true'
    ]);
});

function lpbe_get_user_points_v2($request) {
    global $wpdb;
    
    $user_id = $request->get_param('user_id');
    
    if (!$user_id) {
        return new WP_Error('missing_user_id', 'Se requiere user_id', ['status' => 400]);
    }
    
    $prefix = $wpdb->prefix;
    
    // 1️⃣ UNIFICAR PUEBLOS VISITADOS (geolocalizados + manuales + valorados)
    $sql_pueblos = "
        SELECT DISTINCT pueblo_id
        FROM (
            -- Pueblos geolocalizados
            SELECT v.id_lugar AS pueblo_id
            FROM {$prefix}jet_cct_visita v
            JOIN {$prefix}jet_cct_miembro m ON m._ID = v.id_miembro
            WHERE m.id_usuario = %d AND v.checked = 1
            
            UNION
            
            -- Pueblos marcados manualmente
            SELECT vm.pueblo_id
            FROM {$prefix}jet_cct_visita_manual vm
            WHERE vm.user_id = %d
            
            UNION
            
            -- Pueblos valorados con estrellas
            SELECT vp.pueblo_id
            FROM {$prefix}jet_cct_valoracion_pueblo vp
            WHERE vp.user_id = %d AND vp.rating >= 1
        ) AS visitas_unificadas
    ";
    
    $pueblos_visitados_ids = $wpdb->get_col($wpdb->prepare($sql_pueblos, $user_id, $user_id, $user_id));
    $total_pueblos = count($pueblos_visitados_ids);
    
    // 2️⃣ CALCULAR PUNTOS TOTALES
    $puntos_totales = 0;
    if ($total_pueblos > 0) {
        $ids_string = implode(',', array_map('intval', $pueblos_visitados_ids));
        $sql_puntos = "
            SELECT COALESCE(SUM(puntos), 0) AS total
            FROM {$prefix}jet_cct_lugar
            WHERE _ID IN ($ids_string)
        ";
        $puntos_totales = (int) $wpdb->get_var($sql_puntos);
    }
    
    // 3️⃣ CALCULAR PROMEDIO DE ESTRELLAS
    $sql_promedio = "
        SELECT AVG(rating) AS promedio
        FROM {$prefix}jet_cct_valoracion_pueblo
        WHERE user_id = %d AND rating >= 1
    ";
    $promedio_estrellas = (float) $wpdb->get_var($wpdb->prepare($sql_promedio, $user_id));
    $promedio_estrellas = $promedio_estrellas > 0 ? round($promedio_estrellas, 1) : 0;
    
    // 4️⃣ PUEBLOS RESTANTES
    $total_pueblos_asociacion = 122;
    $pueblos_restantes = max(0, $total_pueblos_asociacion - $total_pueblos);
    
    // 5️⃣ DETERMINAR NIVEL ACTUAL
    $niveles = [
        ['nombre' => 'Turista Curioso', 'min' => 0, 'max' => 199],
        ['nombre' => 'Explorador Local', 'min' => 200, 'max' => 399],
        ['nombre' => 'Viajero Apasionado', 'min' => 400, 'max' => 699],
        ['nombre' => 'Amante de los Pueblos', 'min' => 700, 'max' => 999],
        ['nombre' => 'Gran Viajero', 'min' => 1000, 'max' => 1299],
        ['nombre' => 'Leyenda LPBE', 'min' => 1300, 'max' => 1499],
        ['nombre' => 'Embajador de los Pueblos', 'min' => 1500, 'max' => PHP_INT_MAX]
    ];
    
    $nivel_actual = 'Turista Curioso';
    $nivel_siguiente = 'Explorador Local';
    $puntos_siguiente_nivel = 200;
    
    foreach ($niveles as $index => $nivel) {
        if ($puntos_totales >= $nivel['min'] && $puntos_totales <= $nivel['max']) {
            $nivel_actual = $nivel['nombre'];
            if (isset($niveles[$index + 1])) {
                $nivel_siguiente = $niveles[$index + 1]['nombre'];
                $puntos_siguiente_nivel = $niveles[$index + 1]['min'];
            } else {
                $nivel_siguiente = $nivel['nombre'];
                $puntos_siguiente_nivel = $nivel['min'];
            }
            break;
        }
    }
    
    // 6️⃣ OBTENER FAVORITOS (top 5 pueblos con mejor valoración)
    $sql_favoritos = "
        SELECT 
            vp.pueblo_id,
            l.post_title AS nombre,
            vp.rating AS estrellas
        FROM {$prefix}jet_cct_valoracion_pueblo vp
        JOIN {$prefix}jet_cct_lugar l ON l._ID = vp.pueblo_id
        WHERE vp.user_id = %d AND vp.rating >= 4
        ORDER BY vp.rating DESC, l.post_title ASC
        LIMIT 5
    ";
    $favoritos = $wpdb->get_results($wpdb->prepare($sql_favoritos, $user_id), ARRAY_A);
    
    // 7️⃣ RESPUESTA FINAL
    return [
        'puntos_totales' => $puntos_totales,
        'total_pueblos' => $total_pueblos,
        'promedio_estrellas' => $promedio_estrellas,
        'pueblos_restantes' => $pueblos_restantes,
        'nivel' => $nivel_actual,
        'nivel_siguiente' => $nivel_siguiente,
        'puntos_siguiente_nivel' => $puntos_siguiente_nivel,
        'favoritos' => $favoritos ?: []
    ];
}
```

## CAMBIOS PRINCIPALES

### 1. Unificación de pueblos visitados
Ahora el cálculo incluye:
- ✅ Pueblos geolocalizados (`jet_cct_visita` con `checked=1`)
- ✅ Pueblos marcados manualmente (`jet_cct_visita_manual`)
- ✅ Pueblos valorados con estrellas (`jet_cct_valoracion_pueblo` con `rating≥1`)

Esto asegura que si un usuario valora un pueblo con estrellas, automáticamente se cuenta como visitado.

### 2. Nuevos campos en respuesta
- `promedio_estrellas` → Media de todas las valoraciones del usuario
- `pueblos_restantes` → 122 menos los pueblos visitados
- `favoritos` → Array con los 5 pueblos mejor valorados (rating ≥ 4)

### 3. Niveles actualizados
```
- Turista Curioso: 0-199 pts
- Explorador Local: 200-399 pts
- Viajero Apasionado: 400-699 pts
- Amante de los Pueblos: 700-999 pts
- Gran Viajero: 1000-1299 pts
- Leyenda LPBE: 1300-1499 pts
- Embajador de los Pueblos: 1500+ pts
```

### 4. Ejemplo de respuesta JSON
```json
{
  "puntos_totales": 1245,
  "total_pueblos": 84,
  "promedio_estrellas": 4.2,
  "pueblos_restantes": 38,
  "nivel": "Gran Viajero",
  "nivel_siguiente": "Leyenda LPBE",
  "puntos_siguiente_nivel": 1300,
  "favoritos": [
    {
      "pueblo_id": "123",
      "nombre": "Albarracín",
      "estrellas": "5"
    }
  ]
}
```

## INSTALACIÓN

1. Accede al panel de WordPress
2. Ve a **Snippets** o al archivo `functions.php` de tu tema
3. Reemplaza el código actual del endpoint `/lpbe/v1/puntos` con este nuevo código
4. Guarda y activa el snippet

## VERIFICACIÓN

Prueba el endpoint con:
```
https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=14782
```

Debe devolver los mismos valores que muestra la web para ese usuario.
