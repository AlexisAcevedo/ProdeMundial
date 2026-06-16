# Base de Datos y Reglas de Negocio

La seguridad y la integridad transaccional de ProdeMundial residen 100% en su base de datos **PostgreSQL**, hosteada en Supabase. El cliente frontend React simplemente consume los datos que la base de datos permite según las políticas configuradas.

## 1. Esquema Relacional Principal

| Tabla | Descripción |
|-------|-------------|
| `users` | Espejo local vinculado por FK a `auth.users` (Supabase Auth). Guarda nombre, email y avatar de Google. |
| `leagues` | Competencias privadas con código de invitación alfanumérico único (`invite_code` de 6 caracteres). |
| `league_members` | Relación *many-to-many* usuario ↔ liga. |
| `matches` | Partidos reales del torneo con estado (`pending`, `in_progress`, `finished`), hora de inicio (`kickoff_time`), etapa (`stage`) y grupo (`group`). |
| `predictions` | Pronósticos de marcador exacto (goles local/visitante) por usuario y partido, con campo `points` calculado por trigger. |
| `league_comments` | Mensajes del muro Trash Talk vinculados a una liga, con soporte de tiempo real. |
| `standings` | Vista/tabla materializada de posiciones por liga y global. |

## 2. Row Level Security (RLS)

La regla fundamental del prode es evitar que alguien edite su pronóstico **después de que un partido comienza**. Esta regla se impone mediante **Políticas de Seguridad a Nivel de Fila (RLS)** directamente en PostgreSQL.

> [!CAUTION]
> La validación no se hace en React. Incluso si el cliente estuviese comprometido, la base de datos rechazaría cualquier intento de trampa.

### Política Central: Bloqueo al Kickoff del Partido

```sql
CREATE POLICY "Enable insert for users before kickoff" ON public.predictions
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  );

CREATE POLICY "Enable update for users before kickoff" ON public.predictions
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  );
```

**Explicación**: Solo se permite insertar o actualizar una fila en `predictions` si el usuario está autenticado y si la hora actual (`now()`) es estrictamente menor al `kickoff_time` (hora de inicio) del partido correspondiente.

### Otras Políticas Relevantes

- **`predictions` (SELECT)**: Cualquiera puede leer los pronósticos de todos los usuarios en cualquier momento. Esto permite comparar los pronósticos de la comunidad desde el principio.
- **`leagues` (INSERT/UPDATE)**: Solo el creador de la liga puede modificarla.
- **`league_members` (INSERT)**: Cualquier usuario autenticado puede unirse proveyendo el `invite_code` correcto.
- **`league_comments` (INSERT)**: Solo los miembros activos de la liga pueden escribir en el Trash Talk.
- **`matches` (UPDATE)**: Solo roles de administrador (`service_role`) pueden modificar partidos o cargar resultados.

## 3. Triggers: El Motor de Puntajes

El cálculo de puntajes no recae en el navegador. Un **trigger transaccional** actualiza silenciosamente a todos los participantes en el momento en que el administrador define el resultado de un partido.

El trigger `on_match_finished` se dispara cuando una fila de `matches` cambia su estado a `finished`. Invoca `calculate_prediction_points()`, que aplica las reglas:

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (goles exactos) | **3 puntos** |
| Resultado correcto (empate/ganador sin exacto) | **1 punto** |
| Pronóstico incorrecto | **0 puntos** |

Esta arquitectura transaccional garantiza coherencia sin importar cuántos usuarios estén participando simultáneamente.

## 4. Estadísticas y Premios Avanzados (RPCs)

El sistema usa Stored Procedures (RPCs) como `get_league_stats` para calcular métricas avanzadas en el servidor usando Window Functions y funciones analíticas de PostgreSQL:

| Premio | Criterio |
|--------|----------|
| **Rey del Exacto** | Mayor cantidad de aciertos exactos (3 puntos) |
| **El Optimista** | Suma más alta de goles totales pronosticados |
| **Crapero Máximo** | Más pronósticos errados (0 puntos) en el historial |
| **Mejor Racha** | Mayor cantidad de partidos consecutivos sumando puntos |

Además, `get_global_standings` y `get_league_standings` son RPCs que calculan las tablas de posiciones agregando puntos de todas las predicciones finalizadas.

## 5. Seguridad Adicional (Migración 2026-06-05)

La migración `20260605200000_security_fixes.sql` incorporó mejoras de seguridad adicionales:
- Endurecimiento de políticas RLS existentes para prevenir edge cases de escalación.
- Separación explícita de roles para operaciones administrativas.
- Revisiones recomendadas por el advisor de seguridad de Supabase.

La migración `20260613000001_secure_predictions_read.sql` inicialmente restringió la lectura para evitar espionajes, pero luego la migración `20260615000000_open_predictions_read.sql` restauró la lectura abierta para permitir mayor interacción y comparaciones en tiempo real por parte de los usuarios.

## 7. Gestión de Migraciones

> [!IMPORTANT]
> El directorio `supabase/migrations/` contiene **dos tipos de archivos**:
> - Archivos con **timestamp ISO** (ej: `20260605200000_security_fixes.sql`): son migraciones formales aplicadas secuencialmente por Supabase CLI o MCP.
> - Archivos **sin timestamp** (ej: `schema.sql`, `get_league_stats.sql`): son scripts de referencia/utilitarios, **no se aplican automáticamente**. Deben ejecutarse manualmente o ya están incorporados en las migraciones timestampeadas.

### Procedimiento de Despliegue

Al utilizar **Antigravity IDE (MCP)**, la ejecución de scripts `.sql` se automatiza completamente mediante el MCP de Supabase.

*Para despliegues manuales sin MCP*: Copiar y ejecutar cada archivo `.sql` timestampeado en orden secuencial desde el **SQL Editor** del Panel de Control de Supabase.

## 8. Sincronización Automática de Partidos (API Zafronix)

El estado de los partidos en vivo y los resultados se sincronizan usando una **Edge Function de Supabase (`sync-football-data`)** que lee datos de la API de Zafronix. Esta Edge Function se ejecuta periódicamente gracias a la extensión **pg_cron** (actualizada en la migración `20260616130000_update_cron_frequency.sql`).

*   **Frecuencia**: El cron job está configurado para correr cada **5 minutos** (`*/5 * * * *`).
*   **Protección de scores (write-once)**: Los marcadores (`home_score`, `away_score`) solo se escriben la **primera vez** que un partido pasa a `finished`. Si la DB ya tiene scores de un partido finalizado, el sync NO los sobreescribe. Esto permite corregir manualmente resultados incorrectos de la API sin que el próximo ciclo de sync los revierta.
*   **Resultados en vivo**: Cuando un partido tiene el estado `in_progress` (en juego), la Edge Function actualiza el status pero no escribe scores intermedios. Los scores solo se persisten al estado `finished`.

> [!IMPORTANT]
> Si la API de Zafronix devuelve un resultado incorrecto para un partido `finished`, se debe:
> 1. Corregir el score manualmente en la DB (`UPDATE matches SET home_score = X, away_score = Y WHERE id = '...'`)
> 2. El trigger `on_match_finished` recalculará automáticamente los puntos de todas las predicciones afectadas.
> 3. El sync no volverá a pisar la corrección gracias a la protección write-once.

> [!WARNING]
> La caché (ETag) de la API de Zafronix a veces devuelve falsos positivos (`304 Not Modified`) impidiendo la correcta actualización de los partidos. Por seguridad y fiabilidad, nuestra Edge Function tiene deshabilitada esta comprobación de cabeceras HTTP y siempre consume la respuesta en tiempo real. Esto asegura que el estado `finished` se detecte correctamente, lo cual es crítico para que se disparen los triggers de puntos en la base de datos.
