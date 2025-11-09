# 🔄 Solución: Desincronización entre App y Web

## 🎯 PROBLEMA
La app y la web no muestran los mismos datos de pueblos visitados y estrellas.

## 🔍 CAUSA
La app guarda las valoraciones (estrellas) en la tabla `w47fa_jet_cct_visita_manual`, pero **la web lee desde la tabla `w47fa_jet_cct_valoracion_pueblo`**.

Son dos tablas diferentes que no están sincronizadas.

## ✅ SOLUCIÓN (Backend WordPress)

El endpoint `/lpbe/v1/visita-update` debe escribir en **AMBAS tablas** cuando reciba estrellas desde la app:

1. **Tabla de visitas** (para la app): `w47fa_jet_cct_visita_manual`
2. **Tabla de valoraciones** (para la web): `w47fa_jet_cct_valoracion_pueblo` ← **AÑADIR ESTO**

## 📝 QUÉ HACER EN WORDPRESS

Localizar el snippet que maneja el endpoint `/lpbe/v1/visita-update` y añadir este código después de guardar la visita:

```php
// AÑADIR ESTE CÓDIGO al endpoint /lpbe/v1/visita-update

// Sincronizar con la tabla que lee la web
$tabla_valoraciones = $wpdb->prefix . 'jet_cct_valoracion_pueblo';

if ( $estrellas > 0 && $checked === 1 ) {
    // Guardar/actualizar valoración en la tabla de la web
    $existe = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $tabla_valoraciones WHERE user_id = %d AND pueblo_id = %d",
        $user_id, $pueblo_id
    ));
    
    if ( $existe ) {
        $wpdb->update(
            $tabla_valoraciones,
            array( 'rating' => $estrellas, 'fecha_valoracion' => current_time('mysql') ),
            array( 'user_id' => $user_id, 'pueblo_id' => $pueblo_id ),
            array( '%d', '%s' ),
            array( '%d', '%d' )
        );
    } else {
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
    // Si se quitan las estrellas o se desmarca, eliminar de la web
    $wpdb->delete(
        $tabla_valoraciones,
        array( 'user_id' => $user_id, 'pueblo_id' => $pueblo_id ),
        array( '%d', '%d' )
    );
}
```

## 🎯 RESULTADO

✅ Usuario marca pueblo en app → Aparece en la web
✅ Usuario pone estrellas en app → Se ven en la web
✅ Puntos totales coinciden entre app y web
✅ Promedio de estrellas es el mismo

## ⚠️ NO AFECTA A LA WEB

- La web NO usa el endpoint `/visita-update` (solo la app)
- Este cambio solo añade sincronización hacia la tabla de la web
- Usuarios de la web no se ven afectados
- Cero riesgo para la web en producción

## 📂 DOCUMENTACIÓN COMPLETA

Ver archivo: `INSTRUCCIONES_SINCRONIZACION_WEB_APP.md` para más detalles técnicos.

---

**Resumen**: La app necesita escribir en la tabla `w47fa_jet_cct_valoracion_pueblo` (que lee la web) además de en su propia tabla. Esto se hace en el endpoint `/lpbe/v1/visita-update` del backend de WordPress.
