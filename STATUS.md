# Keikichi Logistics - Estado del repositorio vs. brief técnico

## Resumen rápido (estado actual)
- **Infraestructura**: Compose de desarrollo (`infra/docker-compose.dev.yml`) y producción (`docker-compose.yml`) con servicios para PostgreSQL, backend, frontend y Nginx. Dockerfiles y `nginx/nginx.conf` presentes; faltan certificados SSL y ajustes finos de caché/headers para un despliegue real.
- **Backend**: Estructura modular con modelos, esquemas, servicios y rutas `/api/v1/{auth,users,trips,spaces}` sobre FastAPI + SQLAlchemy async. Migración inicial de Alembic con enums/tablas del dominio. Aún no hay sockets ni tareas programadas y la autorización es básica.
- **Frontend**: React con router y layouts (Root/Auth), páginas de auth (login/register/forgot), listado/detalle de viajes y mapa de espacios usando TanStack Query y store de auth en Zustand. Faltan flujos de reservas/pagos, vistas por rol y tiempo real.
- **Variables de entorno**: `.env.example` incluye DB, JWT, admin por defecto y URLs front/back. Aún no lista parámetros completos de correo/storage para producción.

## Evidencia
- Backend con routers `auth`, `users`, `trips` y `spaces` registrados en `backend/app/api/v1/router.py`; servicios/modelos en `backend/app/services/` y `backend/app/models/`. Migración: `backend/alembic/versions/0001_initial.py`.
- Frontend con rutas y páginas en `frontend/src/App.tsx`, hooks en `frontend/src/hooks/useTrips.ts` y componentes de viajes/espacios en `frontend/src/components/`.
- Compose dev: `infra/docker-compose.dev.yml` (db + backend --reload + frontend dev). Compose prod y Nginx en raíz (`docker-compose.yml`, `nginx/nginx.conf`).
- `.env.example` lista JWT, DB y URLs; requiere ampliación para correo/storage.

## Brecha vs. brief técnico
- **Seguridad/roles**: Tokens JWT y roles existen, pero faltan políticas de autorización granular y rotación/invalidación de refresh tokens.
- **Reservaciones/pagos**: Modelos y migración creados, pero sin servicios ni rutas para holds completos, pagos, documentos, mensajes o auditoría.
- **Tiempo real**: Sin Socket.IO ni listeners front/back para actualizar espacios/estado en vivo.
- **Front-end por rol**: Pendientes dashboards para admin/manager, aprobación de clientes y UI de pagos/documentos.
- **Infra prod**: Sin certificados SSL ni checklist completo de variables de prod (correo, storage, límites de carga, etc.).

## Próximos pasos sugeridos (alineados al brief)
1. **Endurecer backend**: Añadir políticas de autorización por rol, refresh tokens y endpoints para reservaciones/pagos/documentos/auditoría.
2. **Tiempo real**: Integrar Socket.IO (servidor y hook front) para rooms `user:*` y `trip:*` con eventos de espacios/estados.
3. **Front-end por rol**: Implementar layouts/dashboard para admin/manager, flujo de aprobación de clientes y UIs de pagos/documentos.
4. **Infra prod**: Completar variables de entorno de correo/storage, agregar certificados SSL y ajustar Nginx (headers, límites, gzip).
5. **Pruebas**: Añadir tests de auth/trips y smoke de front (build/lint) para CI.

Consulta `ROADMAP.md` para las tareas priorizadas del siguiente ciclo.
