# ProdeMundial ⚽🏆

Plataforma moderna de pronósticos deportivos (prodes) diseñada para competir en ligas privadas con amigos. Construida sobre un stack moderno con React 19, Tailwind CSS v4, TypeScript y Supabase como Backend-as-a-Service (BaaS).

---

## 🚀 Inicio Rápido en 5 Minutos

### 1. Clonar y configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en la configuración de Supabase:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

---

## ✨ Características Principales

- **Autenticación Segura**: Inicia sesión mediante Google OAuth integrado con Supabase Auth.
- **Pronósticos en Tiempo Real**: Guarda y edita tus predicciones de partidos antes de que comiencen.
- **Corte Automático de Seguridad**: Regla estricta de 30 minutos antes del inicio de cada partido (ejecutada a nivel de base de datos) para evitar trampas.
- **Cálculo de Puntos Automatizado**: Un trigger de base de datos calcula automáticamente los puntos obtenidos tan pronto como se registra el resultado final de un partido.
- **Ligas Privadas**: Creación de ligas personalizadas y unión mediante códigos de invitación únicos.

---

## 🏛️ Arquitectura & Stack Tecnológico

El proyecto está diseñado bajo un esquema desacoplado donde la interfaz de usuario se mantiene liviana y la lógica de negocio crítica (seguridad de tiempos y puntuación) corre directamente dentro del motor de base de datos de Supabase (PostgreSQL).

| Tecnología | Rol en el Proyecto |
| :--- | :--- |
| **React 19** | Biblioteca principal de UI utilizando patrones funcionales y hooks reactivos. |
| **Vite** | Empaquetador ultra rápido para el entorno de desarrollo y compilación. |
| **Tailwind CSS v4** | Diseño visual adaptativo con soporte nativo para modo oscuro y variables CSS directas. |
| **TypeScript** | Tipado estricto para garantizar la consistencia en el flujo de datos. |
| **Supabase** | Gestión de autenticación, base de datos en tiempo real y políticas de seguridad (RLS). |

---

## 📁 Estructura del Código

```bash
src/
├── contexts/
│   └── AuthContext.tsx    # Proveedor de estado global de sesión de usuario y métodos OAuth.
├── hooks/
│   ├── useAuth.ts         # Acceso tipado al contexto de autenticación.
│   ├── useLeagues.ts      # Lógicas para listar y unirse a ligas privadas.
│   ├── useMatches.ts      # Consumo de partidos ordenados por cronología.
│   └── usePredictions.ts  # Upsert y listado en tiempo real de pronósticos del usuario.
├── lib/
│   ├── supabase.ts        # Inicialización del cliente Supabase.
│   └── types.ts           # Definiciones de tipos TypeScript compartidos.
├── pages/
│   └── Dashboard.tsx      # Interfaz interactiva principal del usuario.
├── index.css              # Configuración de Tailwind CSS v4 y tokens de diseño.
└── main.tsx               # Punto de entrada de la aplicación.
```

---

## 🗄️ Base de Datos & Lógica de Negocio en Base de Datos

Las migraciones y la definición del esquema se encuentran en [supabase/migrations/schema.sql](file:///e:/Alexis/Programacion/proyectos/ProdeMundial/supabase/migrations/schema.sql).

### 1. Entidades Principales
- **`users`**: Espejo de los usuarios autenticados en Supabase.
- **`leagues`**: Grupos de competencia creados por los dueños del prode.
- **`league_members`**: Relación muchos a muchos para asociar usuarios a ligas.
- **`matches`**: Fixture del torneo con estado (`pending`, `in_progress`, `finished`).
- **`predictions`**: Pronósticos individuales asociados a un usuario y partido.

### 2. Regla de Corte (Row Level Security - RLS)
Para evitar que se modifiquen o inserten pronósticos cuando un partido ya empezó (o está por empezar), la tabla `predictions` tiene habilitadas políticas de RLS restrictivas:

```sql
CREATE POLICY "Enable insert for users before cutoff" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );
```
*Esta política garantiza a nivel motor que cualquier intento de inserción o actualización falle si faltan menos de 30 minutos para el inicio del partido (`kickoff_time`).*

### 3. Sistema de Puntuación (Triggers)
La asignación de puntos se realiza de manera asíncrona y automática mediante el trigger `on_match_finished` cuando un partido pasa a estado `finished`:

- **3 Puntos**: Acierto exacto del marcador (ej. Pronosticó 2-1 y el partido terminó 2-1).
- **1 Punto**: Acierto del resultado final (ganador o empate) pero con marcador incorrecto (ej. Pronosticó 1-0 y el partido terminó 3-1).
- **0 Puntos**: Pronóstico incorrecto.

---

## 🛠️ Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local en `http://localhost:5173`.
- `npm run build`: Compila la aplicación optimizada para producción.
- `npm run lint`: Ejecuta el análisis estático de código mediante ESLint.
- `npm run preview`: Previsualiza la build de producción de manera local.

---

## ⚖️ Licencia

Este proyecto es privado. Todos los derechos reservados.
