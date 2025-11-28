# Keikichi Logistics - Ruta de implementación inmediata

Este roadmap convierte el brief técnico en acciones concretas para arrancar el desarrollo. Se prioriza cubrir la infraestructura base, autenticación y primeros recursos de dominio antes de avanzar a pagos y tiempo real.

## Objetivos del próximo ciclo
- Tener backend con estructura modular (modelos, esquemas, routers y servicios) conectada a PostgreSQL y migraciones iniciales.
- Exponer autenticación completa (`/api/v1/auth`) con registro/login/refresh y usuario administrador por defecto.
- Publicar CRUD inicial de viajes y generación automática de espacios.
- Levantar frontend con enrutamiento, layouts y páginas base por rol para consumir los endpoints de auth y viajes.
- Preparar infraestructura de producción (compose y Nginx) alineada al brief.

## Tareas priorizadas

### 1) Backend: fundaciones
- Crear estructura `backend/app` con módulos: `core/` (seguridad, excepciones, permisos), `database.py`, `config.py` (pydantic-settings), `models/`, `schemas/`, `api/v1/`, `services/`, `utils/`.
- Configurar SQLAlchemy async con `DATABASE_URL` y sesión de dependencia `get_db` en `api/deps.py`.
- Inicializar Alembic: `alembic init`, configurar `env.py` para async engine y ruta a modelos base.
- Añadir migración inicial que cree todas las tablas y enums indicados en el brief.

### 2) Backend: autenticación y usuarios
- Modelos `User` y `ClientProfile` con enums de rol y flags de activación/verificación.
- Servicios de hashing (passlib) y JWT (python-jose) en `core/security.py` con expiración y refresh.
- Endpoints `/api/v1/auth`: register, login, refresh, logout, me, forgot/reset password (stub con correo simulado), creación de admin por defecto en startup.
- Endpoints `/api/v1/users`: listar/obtener, aprobar/rechazar clientes, actualizar perfil propio y contraseña.
- Tests básicos de auth (pytest + httpx) para login/registro y protección de rutas.

### 3) Backend: viajes y espacios
- Modelos `Trip` y `Space` con enums y restricciones numéricas del brief.
- Servicio que genere espacios automáticamente al crear viaje (`total_spaces`) y calcule resumen por estado.
- Routers `/api/v1/trips` y `/api/v1/spaces` con filtros, cambio de estado de viaje, hold/bloqueo/desbloqueo y agregar/quitar espacios.
- Validaciones Zod-equivalentes en Pydantic (`schemas/trip.py`, `schemas/space.py`).

### 4) Frontend: base y auth
- Configurar React Router con layouts `RootLayout`, `AuthLayout`, `DashboardLayout` y páginas de autenticación.
- Implementar store de auth (Zustand) y cliente Axios con interceptores para access/refresh token.
- Crear formularios de Login/Register con React Hook Form + Zod y flujos de protección de rutas.
- Añadir TanStack Query provider, tema shadcn/ui y utilidades `cn`, `constants`, `validators`.

### 5) Frontend: viajes y espacios
- Páginas `TripsPage`, `TripDetailPage` y componente `SpaceMap` (modo view/select) con barra de ocupación y leyenda.
- Hooks `useTrips` y `useSpaces` conectados a los endpoints; estados de carga/error y polling inicial mientras no haya websockets.

### 6) Infraestructura y despliegue
- Añadir `docker-compose.yml` de producción con servicios `db`, `backend`, `frontend`, `nginx` según el brief.
- Incorporar `nginx/nginx.conf` (prod) y `nginx/nginx.dev.conf` (si aplica) con reverse proxy y límites de carga.
- Completar `backend/Dockerfile` y `frontend/Dockerfile` finales usando variables de build `VITE_API_URL` y `VITE_WS_URL`.
- Revisar `.env.example` para asegurar todas las variables listadas en el brief, incluyendo JWT, defaults de sistema y rutas de upload.

### 7) Tiempo real y tareas programadas (inicio)
- Configurar servidor Socket.IO (`sockets/manager.py`, `sockets/events.py`) y cliente front en `useSocket` con rooms `user:*` y `trip:*`.
- Preparar tareas programadas (`tasks/hold_expiration.py`, `tasks/payment_deadline.py`) con APScheduler, aunque inicialmente solo registradas.

## Definición de “hecho” para este ciclo
- Contenedores dev corriendo con DB y backend sirviendo `/api/v1/auth` y `/api/v1/trips` funcionales.
- Migraciones Alembic aplicables desde cero y generando las tablas y enums del brief.
- Frontend mostrando login/registro funcional y listado de viajes con detalle básico y mapa de espacios en modo lectura.
- Variables de entorno documentadas y compose prod listo para despliegue (aunque no se despliegue todavía).

## Riesgos / dependencias
- Sin correo real para forgot/reset password: usar stub y dejar hook para integrar proveedor luego.
- Cálculo de impuestos/moneda: utilizar `DEFAULT_TAX_RATE` y `DEFAULT_CURRENCY` del brief hasta que haya configuración editable.
- Concurrencia en holds/reservas: empezar sin locking optimista y planearlo cuando existan endpoints de reservación/pago.
