# Corrección del endpoint /lpbe/v1/puntos

## Problema
Los puntos se están calculando incorrectamente (incrementalmente +1 por cada pueblo) en lugar de sumar el valor real del campo `puntos` de cada pueblo visitado.

## Solución SQL

El endpoint `/lpbe/v1/puntos` debe recalcular SIEMPRE el total desde la base de datos usando este SQL:

```sql
-- Obtener todos los pueblos visitados (sin duplicados)
-- y sumar sus puntos reales
WITH visitas AS (
    -- Visitas geolocalizadas (auto)
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

## Respuesta del endpoint

El endpoint debe devolver:
```json
{
  "puntos_totales": 150,  // SUMA REAL de l.puntos de pueblos visitados
  "total_pueblos": 10,     // COUNT DISTINCT de pueblos visitados
  "nivel": "Bronce",
  "nivel_siguiente": "Plata",
  "favoritos": [...]
}
```

## IMPORTANTE

1. **NO usar incrementos**: Nunca hacer `puntos_totales = puntos_totales + 1`
2. **Siempre recalcular**: Cada vez que se llame al endpoint, hacer el SUM completo
3. **Sin duplicados**: Usar DISTINCT por pueblo_id para evitar contar el mismo pueblo varias veces
4. **checked = 1**: Solo contar visitas con checked = 1 (tanto auto como manual)
5. **Sumar l.puntos**: Usar el campo `puntos` de la tabla `w47fa_jet_cct_lugar`, NO contar 1 por pueblo

## Endpoint /lpbe/v1/visita-update

Este endpoint SOLO debe crear/actualizar registros en la tabla de visitas.
NO debe modificar contadores de puntos.
La suma de puntos la calcula `/lpbe/v1/puntos`.

## Campos involucrados

- **w47fa_jet_cct_visita**: tabla de visitas geolocalizadas
  - `id_miembro`: user_id
  - `id_lugar`: pueblo_id
  - `checked`: 0 o 1 (visitado o no)
  
- **w47fa_jet_cct_visita_manual**: tabla de visitas manuales
  - `user_id`: id del usuario
  - `pueblo_id`: id del pueblo
  - `checked`: 0 o 1 (visitado o no)
  - `estrellas`: valoración (no afecta puntos)
  
- **w47fa_jet_cct_lugar**: tabla de lugares/pueblos
  - `_ID`: id del pueblo
  - `puntos`: puntos que vale cada pueblo (10, 15, 20, etc.)
  - `nombre`: nombre del pueblo

## Validación

Para validar que el cálculo es correcto:
1. Suma manual: contar pueblos visitados (checked=1) y verificar que cada uno suma sus puntos reales
2. Ejemplo: 
   - Pueblo A (id=1, puntos=10, checked=1) 
   - Pueblo B (id=2, puntos=15, checked=1)
   - Total correcto: 25 puntos
   - Total INCORRECTO: 2 puntos (si se cuenta +1 por cada uno)
