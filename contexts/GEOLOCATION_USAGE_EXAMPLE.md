# Servicio de Geolocalización - Documentación

## Descripción
El servicio de geolocalización detecta automáticamente cuando un usuario se acerca a menos de 2 km de un pueblo de la red, mostrando una notificación de bienvenida y registrando la visita en el sistema.

## Características implementadas

### ✅ Fase 1: Detección y notificación básica
- Solicita permisos de ubicación (foreground only)
- Detecta pueblos cercanos (≤ 2 km)
- Muestra notificación de bienvenida
- Evita repeticiones (cooldown de 24 horas)

### ✅ Fase 2: Registro automático de visitas
- Verifica si el usuario está autenticado
- Comprueba si el pueblo ya fue visitado previamente
- Registra la visita con origen "geo" (automático)
- Los puntos son gestionados automáticamente por JetEngine

## Flujo de funcionamiento

1. **Inicio de sesión**: El servicio se activa solo si el usuario está autenticado
2. **Permisos**: Solicita permisos de ubicación y notificaciones
3. **Seguimiento**: Verifica la ubicación cada 30 segundos o cada 100 metros
4. **Detección**: Calcula distancia a todos los pueblos usando fórmula Haversine
5. **Verificación cooldown**: Comprueba si ya se mostró notificación en las últimas 24h
6. **Notificación**: Muestra bienvenida al pueblo
7. **Verificación de visitas**: Consulta si el usuario ya visitó ese pueblo
8. **Registro**: Si no existe visita previa, registra con origen "geo"

## Endpoints utilizados

### GET `/wp-json/jet-cct/visita?user_id=[ID]`
Obtiene todas las visitas del usuario para verificar si ya visitó el pueblo.

### POST `/wp-json/jet-cct/visita`
Registra una nueva visita con los siguientes datos:
```json
{
  "id_lugar": "123",
  "origen": "geo",
  "fecha_visita": "2025-11-10T10:30:00.000Z"
}
```

## Reglas de negocio

### Cooldown de notificaciones
- No se muestra más de 1 notificación por pueblo cada 24 horas
- Se almacena en AsyncStorage para persistencia
- Si el usuario visita 3 pueblos diferentes el mismo día, verá las 3 bienvenidas

### Registro de visitas
- Solo se registra si el usuario está autenticado
- Solo se registra si NO existe una visita previa del usuario a ese pueblo
- El origen siempre es "geo" (diferente de "qr" para escaneos manuales)
- No se registran duplicados ni se suman puntos repetidos

### Políticas de Apple y Google
- El servicio funciona solo en foreground (mientras la app está abierta)
- No usa tareas en segundo plano ni background location
- Cumple con las políticas de privacidad de ambas plataformas

## Mensajes y logs

### Usuario no autenticado
```
⚠️ Usuario no autenticado, servicio de geolocalización desactivado
```

### Sin permisos de ubicación
```
La detección por geolocalización está desactivada. Actívala para registrar tus visitas automáticamente.
```

### Visita registrada con éxito
```
✅ Visita registrada automáticamente (geo) para [nombre del pueblo] - [user_id]
```

### Pueblo ya visitado
```
⏭️ Usuario ya visitó [nombre del pueblo] previamente, no se registra de nuevo
```

### En cooldown
```
⏳ Pueblo [id] ya saludado hace X horas (cooldown: 24h)
```

## Uso en el código

El servicio está envuelto en un provider que debe colocarse en el layout raíz:

```tsx
import { GeolocationProvider } from '@/contexts/geolocation';

// En app/_layout.tsx
<GeolocationProvider>
  <YourApp />
</GeolocationProvider>
```

No requiere configuración adicional. Se activa automáticamente cuando:
1. El usuario inicia sesión
2. Concede permisos de ubicación
3. Concede permisos de notificaciones

## Datos técnicos

- **Precisión**: Location.Accuracy.Balanced
- **Intervalo de tiempo**: 30 segundos
- **Intervalo de distancia**: 100 metros
- **Radio de detección**: 2 km
- **Cooldown de notificaciones**: 24 horas
- **Fórmula de distancia**: Haversine

## Notas importantes

- No modifica el comportamiento del mapa ni de la lista de pueblos
- No interfiere con el registro manual de visitas por QR
- Los puntos son gestionados por JetEngine automáticamente
- El sistema detecta y evita duplicados de forma robusta
