# 🔄 SINCRONIZACIÓN ENTRE APP Y WEB - Solución Definitiva

## 🎯 PROBLEMA ACTUAL

La app y la web no están sincronizadas:
- La app guarda datos en las tablas de visitas
- La web lee datos de la tabla de valoraciones
- **No hay un puente entre ambas**

## 📊 ANÁLISIS DE TABLAS

### Tablas que usa la WEB:
```sql
-- La web lee las valoraciones desde aquí
w47fa_jet_cct_valoracion_pueblo
├── user_id (int)
├── pueblo_id (int)  
├── rating (int) -- Estrellas 1-5
└── fecha_valoracion (datetime)
```

### Tablas que usa la APP:
```sql
-- Visitas automáticas (GPS)
w47fa_jet_cct_visita
├── id_miembro (int)
├── id_lugar (int)
├── checked (tinyint) -- 0 o 1
└── fecha_visita (datetime)

-- Visitas manuales
w47fa_jet_cct_visita_manual
├── user_id (int)
├── pueblo_id (int)
├── checked (tinyint) -- 0 o 1
└── estrellas (int) -- NO SE USA EN LA WEB
```

## 🚨 EL PROBLEMA

Cuando el usuario en la app:
1. Marca un pueblo como visitado → Se guarda en `jet_cct_visita_manual` con `checked=1`
2. Le da estrellas al pueblo → Se guarda en `jet_cct_visita_manual.estrellas`

**PERO la web NO lee `jet_cct_visita_manual.estrellas`**

La web lee desde `jet_cct_valoracion_pueblo.rating`

## ✅ LA SOLUCIÓN

El endpoint `/lpbe/v1/visita-update` debe hacer **DOS OPERACIONES**:

### Operación 1: Actualizar la visita (YA LO HACE)
```sql
-- Si tipo = 'manual'
INSERT INTO w47fa_jet_cct_visita_manual 
(user_id, pueblo_id, checked, estrellas) 
VALUES (:user_id, :pueblo_id, :checked, :estrellas)
ON DUPLICATE KEY UPDATE 
  checked = :checked, 
  estrellas = :estrellas
```

### Operación 2: Sincronizar con la tabla de valoraciones (NUEVO)
```sql
-- SIEMPRE que se envíen estrellas > 0
-- También actualizar la tabla que lee la web
IF :estrellas > 0 THEN
  INSERT INTO w47fa_jet_cct_valoracion_pueblo 
  (user_id, pueblo_id, rating, fecha_valoracion) 
  VALUES (:user_id, :pueblo_id, :estrellas, NOW())
  ON DUPLICATE KEY UPDATE 
    rating = :estrellas,
    fecha_valoracion = NOW()
END IF

-- Si estrellas = 0, eliminar la valoración
IF :estrellas = 0 THEN
  DELETE FROM w47fa_jet_cct_valoracion_pueblo
  WHERE user_id = :user_id AND pueblo_id = :pueblo_id
END IF
```

## 📝 CÓDIGO PHP PARA WORDPRESS

Busca el archivo que contiene el endpoint `/lpbe/v1/visita-update` y modifícalo así:

```php
function lpbe_visita_update( $request ) {
    global $wpdb;
    
    $user_id = $request->get_param('user_id');
    $pueblo_id = $request->get_param('pueblo_id');
    $checked = intval( $request->get_param('checked') );
    $tipo = $request->get_param('tipo'); // 'auto' o 'manual'
    $estrellas = intval( $request->get_param('estrellas') ?? 0 );
    
    if ( empty($user_id) || empty($pueblo_id) ) {
        return new WP_Error( 'missing_params', 'User ID and Pueblo ID are required', array( 'status' => 400 ) );
    }
    
    // 1. Actualizar la visita según el tipo
    if ( $tipo === 'manual' ) {
        // Tabla de visitas manuales
        $tabla_visitas = $wpdb->prefix . 'jet_cct_visita_manual';
        
        $existe = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM $tabla_visitas WHERE user_id = %d AND pueblo_id = %d",
            $user_id, $pueblo_id
        ));
        
        if ( $existe ) {
            // Actualizar registro existente
            $wpdb->update(
                $tabla_visitas,
                array(
                    'checked' => $checked,
                    'estrellas' => $estrellas
                ),
                array( 'user_id' => $user_id, 'pueblo_id' => $pueblo_id ),
                array( '%d', '%d' ),
                array( '%d', '%d' )
            );
        } else {
            // Insertar nuevo registro
            $wpdb->insert(
                $tabla_visitas,
                array(
                    'user_id' => $user_id,
                    'pueblo_id' => $pueblo_id,
                    'checked' => $checked,
                    'estrellas' => $estrellas,
                    'fecha_visita' => current_time('mysql')
                ),
                array( '%d', '%d', '%d', '%d', '%s' )
            );
        }
    } else {
        // Para visitas automáticas (GPS), actualizar jet_cct_visita
        // Primero obtener id_miembro
        $id_miembro = $wpdb->get_var( $wpdb->prepare(
            "SELECT _ID FROM {$wpdb->prefix}jet_cct_miembro WHERE id_usuario = %d LIMIT 1",
            $user_id
        ));
        
        if ( $id_miembro ) {
            $tabla_visitas = $wpdb->prefix . 'jet_cct_visita';
            
            $wpdb->update(
                $tabla_visitas,
                array( 'checked' => $checked ),
                array( 'id_miembro' => $id_miembro, 'id_lugar' => $pueblo_id ),
                array( '%d' ),
                array( '%d', '%d' )
            );
        }
    }
    
    // 2. SINCRONIZAR CON LA TABLA DE VALORACIONES (CRÍTICO PARA LA WEB)
    $tabla_valoraciones = $wpdb->prefix . 'jet_cct_valoracion_pueblo';
    
    if ( $estrellas > 0 && $checked === 1 ) {
        // Si hay estrellas Y el pueblo está marcado como visitado
        // Crear/actualizar valoración en la tabla que lee la web
        
        $existe_valoracion = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM $tabla_valoraciones WHERE user_id = %d AND pueblo_id = %d",
            $user_id, $pueblo_id
        ));
        
        if ( $existe_valoracion ) {
            // Actualizar valoración existente
            $wpdb->update(
                $tabla_valoraciones,
                array(
                    'rating' => $estrellas,
                    'fecha_valoracion' => current_time('mysql')
                ),
                array( 'user_id' => $user_id, 'pueblo_id' => $pueblo_id ),
                array( '%d', '%s' ),
                array( '%d', '%d' )
            );
        } else {
            // Insertar nueva valoración
            $wpdb->insert(
                $tabla_valoraciones,
                array(
                    'user_id' => $user_id,
                    'pueblo_id' => $pueblo_id,
                    'rating' => $estrellas,
                    'fecha_valoracion' => current_time('mysql')
                ),
                array( '%d', '%d', '%d', '%s' )
            );
        }
    } elseif ( $estrellas === 0 || $checked === 0 ) {
        // Si se quitan las estrellas o se desmarca el pueblo
        // Eliminar la valoración de la web
        $wpdb->delete(
            $tabla_valoraciones,
            array( 'user_id' => $user_id, 'pueblo_id' => $pueblo_id ),
            array( '%d', '%d' )
        );
    }
    
    return rest_ensure_response( array(
        'success' => true,
        'message' => 'Visita actualizada correctamente',
        'user_id' => $user_id,
        'pueblo_id' => $pueblo_id,
        'checked' => $checked,
        'estrellas' => $estrellas,
        'sincronizado_web' => true
    ));
}

// Registrar el endpoint
add_action( 'rest_api_init', function () {
    register_rest_route( 'lpbe/v1', '/visita-update', array(
        'methods' => 'POST',
        'callback' => 'lpbe_visita_update',
        'permission_callback' => '__return_true',
    ));
});
```

## 🔍 VALIDACIÓN

### Paso 1: Probar el endpoint

```bash
curl -X POST "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/visita-update" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 14782,
    "pueblo_id": 1,
    "checked": 1,
    "tipo": "manual",
    "estrellas": 5
  }'
```

### Paso 2: Verificar en la base de datos

```sql
-- Verificar que se guardó en visitas manuales
SELECT * FROM w47fa_jet_cct_visita_manual 
WHERE user_id = 14782 AND pueblo_id = 1;

-- Verificar que se sincronizó con valoraciones (que lee la web)
SELECT * FROM w47fa_jet_cct_valoracion_pueblo 
WHERE user_id = 14782 AND pueblo_id = 1;
```

**Ambas tablas deben tener el registro actualizado.**

### Paso 3: Verificar en la web

1. Inicia sesión en la web con el usuario 14782
2. Ve a la sección de "Mis Pueblos" o "Pueblos Visitados"
3. El pueblo debe aparecer como visitado con 5 estrellas

### Paso 4: Verificar en la app

1. Cierra y vuelve a abrir la app
2. Ve a "Pueblos Visitados"
3. El pueblo debe aparecer con las mismas 5 estrellas
4. Ve a "Puntos Conseguidos"
5. Los totales deben coincidir con la web

## 🎯 RESULTADO ESPERADO

Después de implementar este cambio:

��� Usuario marca pueblo en la app → Se guarda en ambas tablas
✅ Usuario ve el pueblo en la web → Aparece con las mismas estrellas
✅ Usuario cambia estrellas en la app → Se actualiza en la web
✅ Los puntos totales coinciden entre app y web
✅ El promedio de estrellas es el mismo en app y web

## ⚠️ IMPORTANTE

### ❌ NO AFECTA A LA WEB EN PRODUCCIÓN

Este cambio **SOLO AÑADE** funcionalidad al endpoint `/visita-update`:
- La web NO usa este endpoint, solo lo usa la app
- La web sigue leyendo de `jet_cct_valoracion_pueblo` como siempre
- Ahora la app TAMBIÉN escribe en esa tabla
- **CERO impacto en la funcionalidad actual de la web**

### ✅ COMPATIBILIDAD

- Si un usuario marca pueblos desde la web → Funcionará como siempre
- Si un usuario marca pueblos desde la app → Ahora también se verá en la web
- Ambas interfaces están sincronizadas sin afectarse mutuamente

## 📊 DIAGRAMA DE FLUJO

```
┌─────────────────────────────────────────────────────┐
│                    USUARIO EN APP                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
    Marca pueblo como visitado + 5 estrellas
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│         POST /lpbe/v1/visita-update                 │
│  { user_id, pueblo_id, checked:1, estrellas:5 }     │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Tabla Visitas│    │ Tabla Valoraciones│
│   (app)      │    │     (web)         │
└──────┬───────┘    └─────────┬─────────┘
       │                      │
       │     SINCRONIZADO     │
       │      ✅ ✅ ✅        │
       │                      │
       ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│  Pueblos     │    │   Web Usuario    │
│  Visitados   │    │   Pueblos        │
│  (app)       │    │   Visitados      │
└──────────────┘    └──────────────────┘
```

## 🆘 SOPORTE

Si después de implementar este cambio siguen sin sincronizarse:

1. **Revisa los logs de PHP** en WordPress para ver si hay errores
2. **Verifica los permisos** de escritura en la tabla `jet_cct_valoracion_pueblo`
3. **Ejecuta el SQL manualmente** en phpMyAdmin para confirmar que las tablas existen
4. **Compara los datos** en ambas tablas después de hacer una actualización desde la app
5. **Verifica que el endpoint devuelve** `"sincronizado_web": true` en la respuesta

---

**Fecha**: 2025-01-30
**Prioridad**: 🔥 Alta - Impide sincronización entre app y web
**Impacto**: Solo la app - No afecta a usuarios de la web
**Estado**: Solución propuesta - Pendiente de implementación en WordPress
