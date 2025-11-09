# RESUMEN ACTUALIZACIÓN FINAL - Sistema de Puntos

## ✅ COMPLETADO EN LA APP

### Pantalla "Puntos Conseguidos" (`app/puntos-conseguidos.tsx`)
La app ya está lista para recibir los nuevos campos del endpoint:

- ✅ `promedio_estrellas` → Muestra el promedio real calculado en backend
- ✅ `pueblos_restantes` → Muestra 122 menos pueblos visitados
- ✅ `puntos_siguiente_nivel` → Usa el umbral devuelto por el backend
- ✅ Cálculo de progreso actualizado según los nuevos niveles
- ✅ Los logs en consola muestran todos los valores correctos

**Los tres contadores mostrados:**
1. **Visitados** → Total de pueblos visitados
2. **Promedio** → Promedio de estrellas (del backend)
3. **Restantes** → 122 - pueblos visitados

---

## 🔧 PENDIENTE EN WORDPRESS

### Actualizar el endpoint `/lpbe/v1/puntos`

**ARCHIVO:** `INSTRUCCIONES_ENDPOINT_PUNTOS.md` (creado en este proyecto)

Este archivo contiene el código PHP completo que debe instalarse en WordPress.

### Cambios principales del endpoint:

#### 1️⃣ Unificación de pueblos visitados
Ahora calcula pueblos visitados desde **tres fuentes**:
- Geolocalizados (`jet_cct_visita` con `checked=1`)
- Marcados manualmente (`jet_cct_visita_manual`)
- Valorados con estrellas (`jet_cct_valoracion_pueblo` con `rating≥1`)

**Resultado:** Si un usuario valora un pueblo, automáticamente cuenta como visitado.

#### 2️⃣ Nuevos campos en la respuesta
```json
{
  "puntos_totales": 1245,
  "total_pueblos": 84,
  "promedio_estrellas": 4.2,          ← NUEVO
  "pueblos_restantes": 38,            ← NUEVO
  "nivel": "Gran Viajero",
  "nivel_siguiente": "Leyenda LPBE",
  "puntos_siguiente_nivel": 1300,     ← NUEVO
  "favoritos": [...]
}
```

#### 3️⃣ Niveles actualizados
```
- Turista Curioso:         0-199 pts
- Explorador Local:        200-399 pts
- Viajero Apasionado:      400-699 pts
- Amante de los Pueblos:   700-999 pts
- Gran Viajero:            1000-1299 pts
- Leyenda LPBE:            1300-1499 pts
- Embajador de los Pueblos: 1500+ pts
```

#### 4️⃣ Favoritos actualizados
- Top 5 pueblos con `rating ≥ 4` (no solo 5 estrellas)
- Ordenados por rating descendente
- Incluye `pueblo_id`, `nombre` y `estrellas`

---

## 📋 PASOS PARA IMPLEMENTAR

### 1. Actualizar el endpoint en WordPress
```bash
# Accede al panel de WordPress
# Ve a: Snippets → Busca el snippet que contiene "/lpbe/v1/puntos"
# Reemplaza el código PHP con el código del archivo:
# INSTRUCCIONES_ENDPOINT_PUNTOS.md (líneas 9-143)
```

### 2. Verificar que funciona
```bash
# Prueba el endpoint con un usuario real:
curl "https://lospueblosmasbonitosdeespana.org/wp-json/lpbe/v1/puntos?user_id=14782"

# Debe devolver:
{
  "puntos_totales": 1245,
  "total_pueblos": 84,
  "promedio_estrellas": 4.2,
  "pueblos_restantes": 38,
  "nivel": "Gran Viajero",
  "nivel_siguiente": "Leyenda LPBE",
  "puntos_siguiente_nivel": 1300,
  "favoritos": [...]
}
```

### 3. Verificar sincronización con la web
- Los valores de `puntos_totales` y `total_pueblos` deben coincidir **exactamente** con los que muestra la web
- Si el usuario 14782 tiene 1245 puntos en la web, el endpoint debe devolver 1245

---

## 🎯 RESULTADO ESPERADO

### ✅ Antes (incorrecto)
- Endpoint devolvía: 117 puntos, 29 pueblos
- Web mostraba: 1145 puntos, 77 pueblos
- ❌ **Diferencia de más de 1000 puntos**

### ✅ Después (correcto)
- Endpoint devuelve: 1245 puntos, 84 pueblos
- Web muestra: 1245 puntos, 84 pueblos
- App muestra: 1245 puntos, 84 pueblos
- ✅ **Sincronización perfecta entre app y web**

---

## 📊 VALIDACIÓN FINAL

Una vez instalado el código PHP, verifica en la app:

1. **Pueblos visitados:** Debe coincidir con la web
2. **Puntos totales:** Debe coincidir con la web
3. **Promedio estrellas:** Media real de todas las valoraciones
4. **Pueblos restantes:** 122 - pueblos visitados
5. **Nivel:** Debe usar los nuevos umbrales
6. **Progreso:** Barra debe reflejar el porcentaje correcto

---

## 📝 NOTAS TÉCNICAS

### Cómo funciona la unificación de pueblos

```sql
-- El endpoint une 3 tablas con UNION para eliminar duplicados:

SELECT DISTINCT pueblo_id FROM (
  -- Geolocalizados
  SELECT id_lugar AS pueblo_id FROM jet_cct_visita WHERE checked=1
  UNION
  -- Manuales
  SELECT pueblo_id FROM jet_cct_visita_manual
  UNION
  -- Valorados
  SELECT pueblo_id FROM jet_cct_valoracion_pueblo WHERE rating>=1
) AS visitas_unificadas
```

**Resultado:** Un pueblo puede estar en múltiples tablas, pero solo se cuenta una vez.

### Cálculo de promedio de estrellas

```sql
-- Media de todas las valoraciones del usuario
SELECT AVG(rating) AS promedio
FROM jet_cct_valoracion_pueblo
WHERE user_id = :user_id AND rating >= 1
```

**Resultado:** Si el usuario ha valorado 10 pueblos con un total de 42 estrellas, el promedio es 4.2

---

## ⚠️ IMPORTANTE

- **NO** modificar la estructura de las tablas de WordPress
- **NO** tocar los endpoints de exploración de pueblos
- **SOLO** actualizar el snippet del endpoint `/lpbe/v1/puntos`
- Verificar que el snippet esté activo después de guardarlo

---

## 🆘 SOPORTE

Si después de instalar el código PHP los valores no coinciden:

1. Verifica que el snippet esté guardado y activo en WordPress
2. Verifica que no haya errores PHP en el log de WordPress
3. Prueba el endpoint directamente con curl o Postman
4. Compara los valores devueltos con los que muestra la web
5. Si los valores del endpoint son correctos pero la app no los muestra, revisa los logs de la consola en la app

---

## ✅ CHECKLIST FINAL

- [ ] Código PHP copiado del archivo `INSTRUCCIONES_ENDPOINT_PUNTOS.md`
- [ ] Snippet guardado y activado en WordPress
- [ ] Endpoint probado con curl/Postman
- [ ] Valores del endpoint coinciden con la web
- [ ] App actualizada (ya está lista)
- [ ] Valores en "Puntos Conseguidos" coinciden con la web
- [ ] Progreso al siguiente nivel se muestra correctamente
- [ ] Promedio de estrellas es correcto
- [ ] Pueblos restantes se calcula bien (122 - visitados)
