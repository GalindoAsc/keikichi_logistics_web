# Etapa 1: Fundaciones + Auth + Viajes/Espacios (MVP funcional)

Esta etapa convierte el roadmap inmediato en tareas ejecutables para lograr un MVP navegable: backend con auth y viajes/espacios operativos, frontend con login/registro y listado/detalle de viajes, e infraestructura mínima lista para levantar en dev/prod.

## Objetivos
- Backend sirviendo `/api/v1/auth` y `/api/v1/trips`/`/api/v1/spaces` con modelos, esquemas, servicios y migraciones iniciales.
- Frontend con layouts base, flujo de autenticación y páginas de viajes (lista + detalle con mapa de espacios en modo lectura).
- Contenedores dev levantan todo (db, backend con autoreload, frontend dev) y compose prod listo para build.

## Entregables
1) **Modelo de datos + migraciones**
   - Alembic inicial que crea todos los enums/tablas del brief (users, client_profiles, trips, spaces, reservations*, reservation_spaces*, client_documents*, system_config, audit_logs, messages). Las marcadas con * pueden crearse aunque los endpoints lleguen después; evita debt de migraciones parciales.
   - `backend/app/models/base.py` con `Base` declarativa y registro de modelos.

2) **Backend operativo**
   - Configuración `config.py`, `database.py` (SQLAlchemy async), dependencias en `api/deps.py` y arranque en `main.py` con router `api/v1/router.py`.
   - `core/security.py` para hashing (passlib) y JWT (access/refresh) con expiración de `.env`.
   - Rutas `/api/v1/auth`: register/login/refresh/logout/me y stub de forgot/reset (devuelve 200 y loguea a consola o almacena en memoria).
   - Rutas `/api/v1/users`: listar/obtener, aprobar/rechazar clientes, actualizar perfil propio, cambiar contraseña.
   - Rutas `/api/v1/trips` y `/api/v1/spaces`: creación de viaje con generación automática de espacios, filtros básicos, cambio de estado, resumen de espacios y hold/bloqueo/desbloqueo.
   - Manejo de errores y permisos básicos (role-based) en `core/exceptions.py` y `core/permissions.py`.

3) **Frontend navegable**
   - Router con `RootLayout`, `AuthLayout`, `DashboardLayout` y páginas de auth (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`).
   - Store de auth (Zustand) + cliente Axios con interceptores para access/refresh + hooks `useAuth`.
   - Páginas `TripsPage` y `TripDetailPage` consumiendo `/trips` y `/trips/{id}`; `SpaceMap` en modo view (sin selección todavía) con barra de ocupación.
   - Providers globales: TanStack Query, shadcn/ui theme, utilidades `cn`, `constants`, `validators` y `formatters` mínimos para fechas/divisas.

4) **Infraestructura**
   - `docker-compose.dev.yml` ejecutable (db + backend --reload + frontend dev) y script de migraciones.
   - `docker-compose.yml` y `nginx/nginx.conf` listos para prod según brief; Dockerfiles backend/frontend finalizados con args `VITE_API_URL` y `VITE_WS_URL`.
   - `.env.example` completo con todas las variables del brief (JWT, defaults de sistema, rutas de uploads, URLs front/back/ws).

5) **Pruebas mínimas**
   - Pytest: casos de registro/login y protección de ruta `/auth/me`.
   - Comandos de humo: `alembic upgrade head`, `npm run lint` (si aplica), `npm run build` para validar tipos.

## Plan de trabajo secuenciado
1) **Infraestructura backend + migraciones**: configurar `config.py`, `database.py`, `models/base.py`, `alembic/env.py` y generar migración inicial con todo el esquema.
2) **Seguridad y auth**: `core/security.py` (hash/JWT), dependencias `api/deps.py`, servicios y esquemas de auth/usuario, rutas `/auth` y `/users`, seed de admin en startup.
3) **Viajes/Espacios**: modelos + esquemas + servicios; rutas `/trips` y `/spaces` con generación de espacios y resumen por estado.
4) **Frontend base**: layouts, routing, providers, store de auth, cliente Axios y páginas de auth.
5) **Frontend viajes/espacios**: hooks `useTrips`/`useSpaces`, páginas Trips/TripDetail y `SpaceMap` en modo lectura.
6) **Infra prod/dev**: completar Dockerfiles, compose prod y Nginx; validar compose dev y `.env.example`.
7) **Pruebas y smoke**: correr migraciones, pytest de auth, lint/build frontend; documentar resultados en `TESTING.md`.

## Criterios de aceptación
- `docker compose -f docker-compose.dev.yml up --build` levanta db+backend+frontend; backend responde `/api/v1/health` o similar y `/api/v1/auth/login` funciona con usuario sembrado.
- `alembic upgrade head` crea todas las tablas/enums según el brief sin errores.
- Frontend permite login/registro y muestra lista/detalle de viajes (datos mockeados si API aún no está completa, pero conectado si ya está).
- `npm run build` y `pytest` pasan en CI local; no hay variables faltantes en `.env.example`.

## Riesgos y mitigaciones
- **Cobertura de migración inicial**: incluir todas las tablas desde ahora para evitar migraciones rompe-esquema; validar con ER del brief.
- **Auth refresh**: asegurar rotación/refresh en interceptores; en dev almacenar refresh en memory/LS y manejar 401 con retry.
- **Datos de viaje**: si aún no hay datos reales, crear seed o fixtures para que TripsPage no quede vacía; eliminar al conectar con API real.
- **Tiempo**: priorizar que auth y trips/spaces estén end-to-end antes de iniciar sockets o reservas completas.
