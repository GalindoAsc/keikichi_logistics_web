# Keikichi Logistics

Sistema completo de gestión logística construido con FastAPI y React.

## 🚀 Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno de Python
- **SQLAlchemy** - ORM para PostgreSQL
- **PostgreSQL 15** - Base de datos
- **Redis** - Caché y sesiones
- **JWT** - Autenticación
- **Alembic** - Migraciones de base de datos

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **React Query** - Gestión de estado del servidor
- **React Router** - Enrutamiento

### DevOps
- **Docker & Docker Compose** - Contenedores
- **Nginx** - Reverse proxy

## 📋 Prerequisitos

- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local del frontend)
- Python 3.11+ (para desarrollo local del backend)

## 🏗️ Estructura del Proyecto

```
keikichi_logistics/
├── backend/                 # Backend FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints de la API
│   │   ├── core/           # Configuración y seguridad
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Schemas Pydantic
│   │   └── utils/          # Utilidades
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Configuración Nginx
├── docker-compose.yml
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd keikichi_logistics
```

### 2. Configurar variables de entorno

#### Backend
```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` con tus configuraciones:

```env
DATABASE_URL=postgresql://keikichi_user:keikichi_password@postgres:5432/keikichi_db
REDIS_URL=redis://redis:6379
SECRET_KEY=tu-clave-secreta-muy-segura-cambia-esto
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost

# Configuración bancaria (personaliza con tus datos)
BANK_NAME=Tu Banco
BANK_ACCOUNT=1234567890
BANK_ACCOUNT_HOLDER=Tu Empresa S.A.
BANK_ROUTING=001
```

#### Frontend
```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost/api
```

### 3. Levantar con Docker Compose

```bash
docker-compose up -d
```

Este comando levantará:
- **PostgreSQL** en puerto 5432
- **Redis** en puerto 6379
- **Backend** en puerto 8000
- **Frontend** en puerto 3000
- **Nginx** en puerto 80

### 4. Acceder a la aplicación

- **Aplicación**: http://localhost
- **API Docs**: http://localhost/api/docs
- **ReDoc**: http://localhost/api/redoc

## 👤 Usuario Inicial

Necesitarás crear un usuario administrador inicial. Hay dos formas:

### Opción 1: Usar la API directamente

```bash
curl -X POST "http://localhost/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@keikichi.com",
    "password": "admin123",
    "full_name": "Administrador",
    "role": "SuperAdmin"
  }'
```

### Opción 2: Usar la interfaz web

1. Ve a http://localhost/register
2. Regístrate con tus datos
3. Luego actualiza el rol directamente en la base de datos:

```bash
docker exec -it keikichi_postgres psql -U keikichi_user -d keikichi_db

UPDATE users SET role = 'SuperAdmin' WHERE email = 'tu-email@ejemplo.com';
```

## 🔧 Desarrollo Local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 📚 Funcionalidades

### Para Clientes
- ✅ Registro e inicio de sesión
- ✅ Ver viajes disponibles
- ✅ Filtrar viajes por origen, destino y fecha
- ✅ Visualizar espacios disponibles en mapa interactivo
- ✅ Reservar múltiples espacios
- ✅ Ver datos bancarios para pago
- ✅ Subir comprobante de pago
- ✅ Gestionar reservas

### Para Administradores
- ✅ Dashboard con estadísticas
- ✅ Crear y gestionar viajes
- ✅ Generación automática de espacios
- ✅ Ver todas las reservas
- ✅ Confirmar/cancelar reservas
- ✅ Ver comprobantes de pago
- ✅ Gestionar usuarios (SuperAdmin)

## 🗃️ Modelos de Datos

### User
- Roles: SuperAdmin, Manager, Client
- Autenticación JWT
- Gestión de permisos

### Trip
- Origen y destino
- Fecha y hora de salida
- Estado (Scheduled, InTransit, Completed, Cancelled)
- Notas para admin y clientes

### Space
- Numeración automática
- Estado (Available, Reserved, Blocked)
- Vinculado a un viaje

### Reservation
- Cliente y viaje
- Múltiples espacios
- Estado (Pending, Confirmed, Cancelled)
- Comprobante de pago

## 🔒 Seguridad

- Passwords hasheados con bcrypt
- Autenticación JWT
- CORS configurado
- Rate limiting
- Validación de datos con Pydantic
- SQL injection prevention (ORM)
- XSS prevention

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose build --no-cache

# Entrar al contenedor del backend
docker exec -it keikichi_backend bash

# Entrar a PostgreSQL
docker exec -it keikichi_postgres psql -U keikichi_user -d keikichi_db

# Ver base de datos
docker exec -it keikichi_postgres psql -U keikichi_user -d keikichi_db -c "SELECT * FROM users;"
```

## 📝 Migraciones de Base de Datos

Si necesitas hacer cambios en los modelos:

```bash
# Entrar al contenedor del backend
docker exec -it keikichi_backend bash

# Inicializar Alembic (solo primera vez)
alembic init alembic

# Crear migración
alembic revision --autogenerate -m "descripción del cambio"

# Aplicar migraciones
alembic upgrade head
```

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## 📦 Build para Producción

### Actualizar variables de entorno

Asegúrate de actualizar:
- `SECRET_KEY` a algo seguro
- URLs de producción
- Credenciales de base de datos
- Configuración CORS

### Build

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 📧 Contacto

Para soporte o preguntas, contacta a: admin@keikichi.com

---

Desarrollado con ❤️ por el equipo de Keikichi Logistics
