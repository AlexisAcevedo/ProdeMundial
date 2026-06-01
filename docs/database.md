# Base de Datos y Reglas de Negocio

La seguridad y la integridad transaccional de ProdeMundial residen 100% en su base de datos **PostgreSQL**, hosteada en Supabase. El cliente frontend React simplemente consume los datos expuestos que la base de datos permite.

## 1. Esquema Relacional Principal

- **`users`**: Es un espejo local vinculado por clave foránea a `auth.users` (la tabla segura de autenticación de Supabase). Guarda el nombre, email y avatar recolectados de Google.
- **`leagues`**: Competencias privadas a las que los usuarios pueden unirse. Cada una contiene un identificador alfanumérico único (`invite_code`).
- **`league_members`**: Tabla relacional (*many-to-many*) que define qué usuario pertenece a qué liga.
- **`matches`**: Contiene la lista central de los partidos reales del torneo. Maneja su propio estado (`pending`, `in_progress`, `finished`) y registra la hora de inicio (`kickoff_time`).
- **`predictions`**: Registra los pronósticos de marcador exacto realizados por cada usuario.
- **`league_comments`**: Muro de interactividad social ("Trash Talk"). Registra los mensajes en tiempo real vinculados a una liga.

## 2. Row Level Security (RLS)

La regla fundamental de todo Prode es evitar que alguien edite o adivine el resultado **después de que un partido comienza**. Esta regla se impone mediante **Políticas de Seguridad a Nivel de Fila (RLS)** directamente en PostgreSQL.

> [!CAUTION]
> La validación no se hace en React. Incluso si el cliente estuviese comprometido, la base de datos rechazaría cualquier trampa.

```sql
CREATE POLICY "Enable insert for users before cutoff" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );
```

**Explicación**: Solo se permite insertar o actualizar una fila en la tabla `predictions` si el usuario está autenticado (`auth.uid() = user_id`) y si la hora actual (`now()`) es menor a **30 minutos antes** de la hora de inicio (`kickoff_time`).

## 3. Triggers: El Motor de Puntajes

El cálculo de puntajes no recae en la memoria del navegador. En su lugar, un **Trigger** transaccional actualiza silenciosamente a todos los participantes en el momento en el que el administrador define el resultado de un partido.

El trigger `on_match_finished` se dispara cuando la fila de un partido (`matches`) cambia su estado a `finished`. En ese instante, invoca a la función `calculate_prediction_points()`, que aplica las reglas:

1. **Exacto (3 Puntos)**: El pronóstico coincide al 100% con el marcador final.
2. **Resultado Correcto (1 Punto)**: El usuario acertó si hubo un empate, ganó el Local o ganó el Visitante, pero no dio con los goles exactos.
3. **Incorrecto (0 Puntos)**: No acertó el resultado.

Esta arquitectura transaccional de triggers garantiza coherencia sin importar cuántos miles de usuarios estén participando simultáneamente.

## 4. Gestión de Migraciones

Todas las modificaciones de base de datos, políticas, triggers y funciones RPC se estructuran como scripts SQL dentro del directorio [../supabase/migrations/](../supabase/migrations/).

> [!IMPORTANT]
> **Procedimiento de Despliegue en Producción**:
> Al utilizar el entorno de trabajo **Antigravity IDE (MCP)**, la ejecución de los scripts `.sql` se automatiza completamente. El agente IA utiliza el MCP de Supabase para aplicar migraciones directamente a la base de datos de producción mediante la API, evitando tener que usar el SQL Editor.
> 
> *Nota para despliegues manuales sin MCP*: En caso de no contar con el agente, cada archivo `.sql` en el directorio de migraciones debe ser copiado y ejecutado manualmente a través del **SQL Editor** del Panel de Control de Supabase en orden secuencial.
