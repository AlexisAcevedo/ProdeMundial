# ProdeMundial

Plataforma moderna de pronósticos deportivos (prodes) diseñada para competir en ligas privadas con amigos.

## Inicio Rápido

1. Clonar y configurar entorno (archivo `.env`):
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```
2. Instalar dependencias: `npm install`
3. Ejecutar: `npm run dev`

## Características

- **Autenticación Segura**: Login simplificado con Google OAuth vía Supabase.
- **Pronósticos en Tiempo Real**: Guarda y actualiza tus predicciones antes de los partidos.
- **Seguridad Antifraude**: Regla estricta a nivel base de datos que bloquea cambios 30 minutos antes del inicio.
- **Puntuación Automática**: Los puntos se calculan instantáneamente en la base de datos al finalizar un partido.
- **Ligas Privadas**: Crea competencias cerradas y únete utilizando códigos de invitación.

## Documentación

- [Arquitectura del Proyecto](./docs/architecture.md)
- [Base de Datos y Reglas (RLS)](./docs/database.md)

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo local en `localhost:5173` |
| `npm run build` | Compila la aplicación optimizada para producción |
| `npm run lint` | Analiza y verifica el código con ESLint |
| `npm run preview` | Levanta el servidor local con la versión de producción |

## Licencia

Este proyecto es privado. Todos los derechos reservados.
