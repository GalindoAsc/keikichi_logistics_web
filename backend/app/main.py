"""
Keikichi Logistics - FastAPI Application
Sistema de gestión de transporte logístico México-USA
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app import models
from app.config import settings
from app.api.v1.router import api_router
from app.database import engine, AsyncSessionLocal
from app.utils.file_upload import ensure_upload_directories
from app.tasks.hold_expiration import release_expired_holds
from app.tasks.payment_deadline import cancel_unpaid_reservations

# Scheduler instance
scheduler = AsyncIOScheduler()


# OpenAPI Tags for better documentation organization
OPENAPI_TAGS = [
    {
        "name": "auth",
        "description": "🔐 **Autenticación** - Registro, login, tokens y gestión de sesión"
    },
    {
        "name": "users",
        "description": "👤 **Usuarios** - Perfil, actualización de datos y contraseña"
    },
    {
        "name": "trips",
        "description": "🚚 **Viajes** - Gestión de viajes, rutas y fechas de salida"
    },
    {
        "name": "spaces",
        "description": "📦 **Espacios** - Administración de espacios en viajes (28 por trailer)"
    },
    {
        "name": "reservations",
        "description": "📋 **Reservaciones** - Crear, cancelar, pagar y gestionar reservaciones"
    },
    {
        "name": "documents",
        "description": "📄 **Documentos** - Subir y gestionar documentos de cliente (INE, fianzas, etc.)"
    },
    {
        "name": "verifications",
        "description": "✅ **Verificaciones** - Proceso de verificación de identidad de clientes"
    },
    {
        "name": "notifications",
        "description": "🔔 **Notificaciones** - Sistema de notificaciones en tiempo real"
    },
    {
        "name": "admin-users",
        "description": "👥 **Admin: Usuarios** - Gestión administrativa de cuentas de usuario"
    },
    {
        "name": "admin-dashboard",
        "description": "📊 **Admin: Dashboard** - Estadísticas y métricas del sistema"
    },
    {
        "name": "admin-verifications",
        "description": "🔍 **Admin: Verificaciones** - Aprobar/rechazar documentos de verificación"
    },
    {
        "name": "fleet",
        "description": "🚛 **Flota** - Gestión de vehículos (trailers, camiones) y conductores"
    },
    {
        "name": "catalog",
        "description": "📚 **Catálogos** - Productos, unidades y datos maestros"
    },
    {
        "name": "label-prices",
        "description": "🏷️ **Precios de Etiquetas** - Configuración de precios por etiquetado"
    },
    {
        "name": "system-config",
        "description": "⚙️ **Configuración** - Variables del sistema (tipo de cambio, impuestos, etc.)"
    },
    {
        "name": "files",
        "description": "📁 **Archivos** - Subida y descarga de archivos"
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler (replaces on_event startup/shutdown)
    
    This is the modern FastAPI pattern for handling startup and shutdown.
    """
    # === STARTUP ===
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    
    # Initialize database data
    from app.initial_data import init_db
    async with AsyncSessionLocal() as session:
        await init_db(session)
    
    # Ensure upload directories exist
    ensure_upload_directories()
    print("[Startup] Upload directories initialized")
    
    # Start scheduled tasks
    scheduler.add_job(
        release_expired_holds,
        'interval',
        minutes=5,
        id='release_expired_holds',
        max_instances=1,
        replace_existing=True
    )
    scheduler.add_job(
        cancel_unpaid_reservations,
        'interval',
        hours=1,
        id='cancel_unpaid_reservations',
        max_instances=1,
        replace_existing=True
    )
    scheduler.start()
    print("[Startup] Scheduled tasks initialized")
    print("  - Hold expiration: every 5 minutes")
    print("  - Payment deadline: every 1 hour")
    
    yield  # Application runs here
    
    # === SHUTDOWN ===
    scheduler.shutdown()
    print("[Shutdown] Scheduler stopped")


def custom_openapi():
    """Generate custom OpenAPI schema with enhanced documentation"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Keikichi Logistics API",
        version="1.0.0",
        description="""
## 🚚 Sistema de Gestión de Transporte Logístico

**Keikichi Logistics** es una plataforma integral para la gestión de transporte de carga 
entre México y Estados Unidos.

### Características Principales

- 📅 **Gestión de Viajes** - Programar y administrar viajes con 28 espacios por trailer
- 📦 **Reservaciones** - Sistema de reservación con hold temporal y confirmación de pago
- 💳 **Pagos** - Múltiples métodos de pago (transferencia, efectivo, MercadoPago)
- 📄 **Documentación** - Gestión de documentos (INE, fianzas, facturas)
- 🔔 **Notificaciones** - Sistema de notificaciones en tiempo real vía WebSocket
- 📊 **Dashboard** - Estadísticas y reportes para administradores

### Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación:

1. Obtén un token en `/auth/login`
2. Incluye el token en el header: `Authorization: Bearer <token>`
3. Renueva el token con `/auth/refresh` antes de que expire

### Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `client` | Cliente final que reserva espacios |
| `manager` | Administrador con permisos de gestión |
| `superadmin` | Acceso completo al sistema |

### Links Útiles

- 📖 [Documentación Completa](/docs)
- 🔧 [Documentación Alternativa (ReDoc)](/redoc)
- ❤️ [Health Check](/health)
        """,
        routes=app.routes,
        tags=OPENAPI_TAGS,
    )
    
    # Add contact and license info
    openapi_schema["info"]["contact"] = {
        "name": "Keikichi Logistics Soporte",
        "url": "https://keikichi.com",
        "email": "soporte@keikichi.com"
    }
    openapi_schema["info"]["license"] = {
        "name": "Propietario",
        "url": "https://keikichi.com/terms"
    }
    
    # Add server info
    openapi_schema["servers"] = [
        {"url": "https://keikichi.com", "description": "Producción"},
        {"url": "http://localhost:8000", "description": "Desarrollo Local"},
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(
    title="Keikichi Logistics API",
    description="API para gestión de transporte logístico México-USA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
)

# Custom OpenAPI schema
app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["health"], summary="Root Endpoint")
async def root():
    """
    Endpoint raíz que muestra información básica de la API.
    
    No requiere autenticación.
    """
    return {
        "message": "Keikichi Logistics API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"], summary="Health Check")
async def health_check():
    """
    Verificar el estado de salud del servicio.
    
    Útil para monitoreo y load balancers.
    
    Returns:
        - **status**: Estado del servicio (healthy/unhealthy)
        - **environment**: Entorno actual (development/production)
    """
    return {
        "status": "healthy",
        "environment": settings.environment,
    }
