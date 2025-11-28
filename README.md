# 🚚 Keikichi Logistics

Plataforma web para gestión de transporte logístico, venta de espacios de tarimas en tráileres, reservaciones y pagos.

---

## 🚀 Inicio Rápido

**¿Primera vez aquí?** Sigue estas guías paso a paso:

1. **[📖 QUICKSTART.md](QUICKSTART.md)** - Guía detallada para principiantes (sin asumir conocimientos previos)
2. **[⚡ COMANDOS_RAPIDOS.md](COMANDOS_RAPIDOS.md)** - Referencia rápida de comandos (copia y pega)
3. **[🧪 TESTING.md](TESTING.md)** - Cómo probar que todo funciona correctamente

**Si ya tienes experiencia con Docker**, los comandos esenciales son:

```bash
# 1. Clonar y configurar
git clone https://github.com/GalindoAsc/keikichi_logistics_web.git
cd keikichi_logistics_web
git checkout claude/keikichi-logistics-app-01X28hvdbJLTa6iEePksh4JB
cp .env.example .env

# 2. Iniciar servicios (tarda 3-5 min la primera vez)
cd infra
docker compose -f docker-compose.dev.yml up -d --build

# 3. Acceder a:
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Desarrollo](#-desarrollo)
- [Comandos Útiles](#-comandos-útiles)
- [Despliegue en NAS](#-despliegue-en-nas)
- [Módulos del Sistema](#-módulos-del-sistema)

---

## 🛠 Stack Tecnológico

### Backend
- **Python 3.11+** - Lenguaje de programación
- **FastAPI 0.109+** - Framework web
- **SQLAlchemy 2.0+** - ORM para base de datos
- **Alembic** - Migraciones de base de datos
- **PostgreSQL 15+** - Base de datos relacional
- **Pydantic** - Validación de datos
- **JWT** - Autenticación
- **Socket.IO** - WebSockets para tiempo real

### Frontend
- **React 18.2+** - Librería UI
- **TypeScript 5+** - Tipado estático
- **Vite 5+** - Build tool y dev server
- **Tailwind CSS 3.4+** - Framework CSS
- **shadcn/ui** - Componentes UI
- **React Router 6+** - Enrutamiento
- **TanStack Query 5+** - Data fetching
- **React Hook Form 7+** - Manejo de formularios
- **Zod 3+** - Validación de schemas

### Infraestructura
- **Docker & Docker Compose** - Contenedores
- **Nginx** - Reverse proxy
- **PostgreSQL** - Base de datos

---

## 📁 Estructura del Proyecto

```
keikichi_logistics_web/
├── backend/                    # Aplicación FastAPI
│   ├── app/                    # Código fuente Python
│   │   └── __init__.py
│   ├── Dockerfile.dev          # Docker para desarrollo
│   └── requirements.txt        # Dependencias Python
│
├── frontend/                   # Aplicación React
│   ├── src/                    # Código fuente TypeScript/React
│   ├── public/                 # Archivos públicos estáticos
│   ├── Dockerfile.dev          # Docker para desarrollo
│   ├── package.json            # Dependencias Node
│   └── vite.config.ts          # Configuración Vite
│
├── infra/                      # Infraestructura
│   ├── docker-compose.dev.yml  # Compose para desarrollo
│   └── nginx/                  # Configuración Nginx
│       └── nginx.dev.conf
│
├── uploads/                    # Archivos subidos (gitignored)
│   ├── documents/
│   ├── invoices/
│   └── payments/
│
├── .env                        # Variables de entorno (desarrollo)
├── .env.example                # Template de variables
├── .gitignore                  # Archivos ignorados por Git
└── README.md                   # Este archivo
```

---

## ✅ Requisitos Previos

- **Docker** 24.0+ y **Docker Compose** 2.20+
- **Git** 2.40+
- *Opcional*: Node.js 20+ y Python 3.11+ (para desarrollo local sin Docker)

### Verificar instalación:

```bash
docker --version
docker compose version
git --version
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repo> keikichi_logistics_web
cd keikichi_logistics_web
```

### 2. Configurar variables de entorno

**⚠️ IMPORTANTE:** Debes crear el archivo `.env` desde el template:

```bash
# Copiar el template de variables de entorno
cp .env.example .env

# Revisar/editar las variables (opcional para desarrollo)
nano .env
```

Para desarrollo local, los valores por defecto en `.env.example` ya funcionan. Solo cámbialos si necesitas ajustar algo específico.

**Variables importantes:**
- `POSTGRES_PASSWORD`: Cambiar en producción
- `SECRET_KEY`: Cambiar en producción
- `JWT_SECRET_KEY`: Cambiar en producción
- `DEFAULT_ADMIN_EMAIL` y `DEFAULT_ADMIN_PASSWORD`: Credenciales del superadmin inicial

### 3. Iniciar los servicios

```bash
cd infra
docker compose -f docker-compose.dev.yml up --build
```

Esto levantará:
- **PostgreSQL** en puerto `5432`
- **Backend (FastAPI)** en puerto `8000`
- **Frontend (Vite)** en puerto `5173`

### 4. Acceder a la aplicación

Una vez iniciados los contenedores:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

---

## 💻 Desarrollo

### Hot Reload

El entorno está configurado para **hot reload automático**:

- **Backend**: Cualquier cambio en `backend/app/` se recarga automáticamente
- **Frontend**: Cualquier cambio en `frontend/src/` se recarga automáticamente (HMR de Vite)

### Estructura de desarrollo modular

El proyecto se está construyendo **módulo por módulo**:

#### ✅ Módulos Completados
1. **Infraestructura Base** - Docker, estructura, configuración

#### 🔄 Módulos Planificados
2. **Base de Datos** - Modelos SQLAlchemy, migraciones Alembic
3. **Backend Base** - FastAPI app, configuración, middleware
4. **Autenticación** - JWT, usuarios, login/registro
5. **Viajes** - CRUD de viajes
6. **Espacios** - Mapa visual de espacios, sistema de holds
7. **Reservaciones** - Flujo de reservación
8. **Pagos** - Comprobantes, confirmación
9. **Documentos** - Upload y aprobación
10. **Mensajes** - Sistema de mensajería
11. **Admin Panel** - Dashboard, configuración
12. **WebSockets** - Actualizaciones en tiempo real
13. **Tareas Programadas** - Expiración de holds, deadlines

---

## 📝 Comandos Útiles

### Docker Compose

```bash
# Iniciar servicios en background
cd infra
docker compose -f docker-compose.dev.yml up -d

# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker compose -f docker-compose.dev.yml logs -f keikichi_backend

# Detener servicios
docker compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes (⚠️ borra la base de datos)
docker compose -f docker-compose.dev.yml down -v

# Reconstruir contenedores
docker compose -f docker-compose.dev.yml up --build

# Reiniciar un servicio específico
docker compose -f docker-compose.dev.yml restart keikichi_backend
```

### Backend (desde el contenedor)

```bash
# Entrar al contenedor del backend
docker compose -f docker-compose.dev.yml exec keikichi_backend bash

# Dentro del contenedor:
# Crear migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial de migraciones
alembic history

# Ejecutar tests
pytest

# Shell interactivo de Python
python
```

### Frontend (desde el contenedor)

```bash
# Entrar al contenedor del frontend
docker compose -f docker-compose.dev.yml exec keikichi_frontend sh

# Dentro del contenedor:
# Instalar nueva dependencia
npm install <paquete>

# Ejecutar linter
npm run lint

# Build de producción
npm run build
```

### Base de datos (PostgreSQL)

```bash
# Conectarse a PostgreSQL
docker compose -f docker-compose.dev.yml exec keikichi_db psql -U keikichi -d keikichi_logistics_dev

# Dentro de psql:
# Ver tablas
\dt

# Describir tabla
\d nombre_tabla

# Ejecutar query
SELECT * FROM users;

# Salir
\q

# Backup de base de datos
docker compose -f docker-compose.dev.yml exec keikichi_db pg_dump -U keikichi keikichi_logistics_dev > backup.sql

# Restaurar backup
docker compose -f docker-compose.dev.yml exec -T keikichi_db psql -U keikichi keikichi_logistics_dev < backup.sql
```

---

## 🏠 Despliegue en NAS

### Preparación

1. **Configurar variables de entorno para producción**:

```bash
cp .env.example .env.production

# Editar con valores de producción
nano .env.production
```

**Cambios críticos**:
```env
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generar-clave-segura-mínimo-32-caracteres>
JWT_SECRET_KEY=<generar-clave-jwt-segura>
POSTGRES_PASSWORD=<contraseña-segura>
DEFAULT_ADMIN_PASSWORD=<contraseña-admin-segura>

# Ajustar URLs según tu NAS
VITE_API_URL=http://<IP-NAS>:8000/api/v1
VITE_WS_URL=http://<IP-NAS>:8000
```

2. **Crear docker-compose.prod.yml** (próximamente)

3. **Configurar SSL/HTTPS** (recomendado para producción)

4. **Configurar backups automáticos de PostgreSQL**

### Despliegue

```bash
# En tu NAS, clonar el repositorio
git clone <url-del-repo> keikichi_logistics_web
cd keikichi_logistics_web

# Copiar .env de producción
cp .env.production .env

# Iniciar servicios
cd infra
docker compose -f docker-compose.prod.yml up -d

# Aplicar migraciones
docker compose -f docker-compose.prod.yml exec keikichi_backend alembic upgrade head

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔐 Seguridad

### Desarrollo
- Credenciales por defecto están en `.env`
- **NO usar en producción**

### Producción
- ✅ Cambiar todas las claves secretas
- ✅ Usar contraseñas fuertes
- ✅ Habilitar HTTPS
- ✅ Configurar firewall
- ✅ Backups regulares de base de datos
- ✅ Actualizar dependencias regularmente

---

## 🧩 Módulos del Sistema

### Roles de Usuario
- **SuperAdmin**: Control total del sistema
- **Manager**: Gestión operativa (viajes, reservaciones, pagos)
- **Client**: Clientes que reservan espacios

### Funcionalidades Principales
- Gestión de viajes y espacios de tarimas
- Sistema de reservaciones con holds temporales
- Procesamiento de pagos con comprobantes
- Gestión documental
- Sistema de mensajería
- Panel administrativo
- Actualizaciones en tiempo real (WebSockets)

---

## 📞 Soporte

Para reportar issues o solicitar features, crear un issue en el repositorio.

---

## 📄 Licencia

Propietario - Keikichi Logistics © 2024

---

**¡Happy Coding! 🚀**
