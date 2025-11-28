# Keikichi Logistics - Estado del repositorio vs. brief técnico

## Resumen rápido
- **Infraestructura de desarrollo**: Compose dev operativo con PostgreSQL, backend FastAPI y frontend Vite con hot reload. Rutas de puertos y variables coinciden en general con el brief (puertos 8000/5173) aunque los servicios usan nombres `keikichi_*` y viven bajo `infra/`. La configuración de Nginx de desarrollo aún no existe.
- **Backend**: Solo hay una aplicación FastAPI mínima (`root`, `/health`, `/api/v1/info`) sin modelos, base de datos ni routers versionados. No se ha creado la estructura especificada en el brief (modelos, schemas, servicios, sockets, tareas, etc.).
- **Frontend**: App React básica con un contador y mensaje de “Infraestructura base completa”. No existen rutas, componentes, hooks ni stores descritos en el brief.
- **Variables de entorno**: `.env.example` incluye variables generales y defaults coherentes con el brief, pero faltan varias claves requeridas por el documento (e.g., parámetros específicos de correo o storage no listados). No hay archivo `.env` de producción.

## Evidencia
- Backend minimalista con tres endpoints informativos y sin estructura modular: `backend/app/main.py`.
- Frontend limitado a una vista estática con contador: `frontend/src/App.tsx`.
- Compose de desarrollo presente en `infra/docker-compose.dev.yml` con los servicios básicos y volúmenes de hot reload.
- Plantilla de variables de entorno en `.env.example` alineada parcialmente con los valores sugeridos en el brief.

## Brecha vs. brief técnico
- **Estructura y módulos backend**: Falta toda la jerarquía requerida (models, schemas, api/v1 routers, services, core, tasks, sockets, utils). No hay integración con PostgreSQL ni migraciones de Alembic.
- **Dominio funcional**: No existen endpoints para autenticación, usuarios, viajes, espacios, reservaciones, pagos, documentos, mensajes, configuración o auditoría.
- **Front-end**: No hay routing, layouts (Root/Auth/Dashboard), ni componentes clave (SpaceMap, BankDataDisplay, etc.), ni estado (Zustand) ni data fetching (TanStack Query).
- **WebSockets y tiempo real**: No hay configuración de Socket.IO client/servidor.
- **Infra producción**: No se incluye `docker-compose.yml` ni configuración de Nginx/SSL para producción como exige el brief.

## Próximos pasos sugeridos (alineados al brief)
1. **Estructurar backend**: Crear módulos `models`, `schemas`, `api/v1`, `services`, `core`, `tasks`, `sockets`, y configurar `database.py` con SQLAlchemy/Alembic.
2. **Implementar autenticación**: Endpoints `/auth` con JWT, registro/login/refresh/logout, protección de rutas y creación de admin por defecto.
3. **CRUD de viajes y espacios**: Modelos `Trip` y `Space`, generación de espacios por viaje y endpoints con validaciones del brief.
4. **Sistema de reservaciones y pagos**: Holds, estados, cálculo de impuestos, carga de comprobantes y flujo de confirmación/rechazo.
5. **Front-end completo**: Configurar router, layouts, páginas para cada rol, componentes shadcn/ui, hooks de datos (React Query) y formularios (React Hook Form + Zod).
6. **WebSockets**: Integrar Socket.IO con rooms (`user:*`, `trip:*`, `role:*`) y eventos descritos.
7. **Infra prod**: Añadir `docker-compose.yml`, `nginx.conf` y Dockerfiles finales siguiendo puertos/variables del brief.

Consulta `ROADMAP.md` para las tareas priorizadas del siguiente ciclo.
