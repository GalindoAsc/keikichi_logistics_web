# Keikichi Logistics - Guía de Inicio Rápido

## 🔑 1. Acceso al Sistema

### Credenciales de Administrador
- **Email**: `admin@keikichi.com`
- **Contraseña**: `Admin123!ChangeMe`

> ⚠️ **IMPORTANTE**: Estas son las credenciales por defecto del archivo `.env.example`. Si modificaste tu archivo `.env`, usa las credenciales que configuraste ahí (`DEFAULT_ADMIN_EMAIL` y `DEFAULT_ADMIN_PASSWORD`).

### URLs del Sistema
- **Frontend (Aplicación)**: http://localhost:5173
- **Backend (API)**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Base de Datos**: `localhost:5432` (PostgreSQL)

---

## 🚀 2. Comandos Esenciales

### Iniciar el Sistema
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Ver Estado de Contenedores
```bash
docker ps
```

### Ver Logs
```bash
# Backend
docker logs -f keikichi_backend_dev

# Frontend
docker logs -f keikichi_frontend_dev

# Base de Datos
docker logs -f keikichi_db_dev
```

### Reiniciar Servicios
```bash
# Reiniciar todo
docker-compose -f docker-compose.dev.yml restart

# Reiniciar solo backend
docker restart keikichi_backend_dev
```

### Detener el Sistema
```bash
docker-compose -f docker-compose.dev.yml down
```

### Limpiar y Reiniciar (si hay problemas)
```bash
# Eliminar contenedores
docker rm -f keikichi_db_dev keikichi_backend_dev keikichi_frontend_dev

# Reiniciar
docker-compose -f docker-compose.dev.yml up -d
```

---

## 📦 3. Funcionalidades Principales

### A. Gestión de Viajes
1. Ir a **Viajes** en el menú
2. Crear nuevo viaje con:
   - Origen/Destino
   - Fecha de salida
   - Precio por espacio
   - Costo de recolección (plano o por tarima)
   - Moneda (MXN/USD)
   - Tipo de cambio

### B. Catálogo de Productos y Unidades
1. Ir a **Ajustes → Productos y Unidades**
2. Pestaña **Productos**: Agregar/eliminar productos
3. Pestaña **Unidades**: Agregar/eliminar unidades de medida
4. Los productos se ordenan alfabéticamente

### C. Crear Reservación
1. Seleccionar un **Viaje disponible**
2. Escoger **espacios** en el mapa de la caja
3. Click en **"Reservar Espacios"**
4. **Configurar cada espacio**:
   - Producto
   - Cantidad de cajas
   - Peso por unidad
   - Tipo de empaque
   - Etiquetado (opcional)
5. **Servicios adicionales**:
   - Recolección (el costo se muestra al activar)
   - Fianza (para viajes internacionales)
   - Facturación
6. Seleccionar **método de pago**
7. Confirmar reservación

### D. Gestión de Cuentas (Solo Admin)
1. Ir a **Ajustes → Cuentas**
2. Ver todos los usuarios registrados
3. Verificar/Desverificar usuarios
4. Activar/Desactivar acceso
5. Eliminar usuarios

### E. Datos Bancarios
1. Ir a **Ajustes → Datos Bancarios**
2. Configurar información para transferencias
3. Con y sin factura

---

## 🔧 4. Solución de Problemas

### El Frontend no carga
```bash
# Instalar dependencias
docker exec keikichi_frontend_dev npm install

# Reiniciar
docker restart keikichi_frontend_dev
```

### Error de Login / 401 Unauthorized
1. Verifica que estés usando: `admin@dev.local`
2. Cierra sesión y vuelve a entrar
3. Revisa el archivo `.env` para confirmar las credenciales

### Error CORS / 500 Internal Server Error
```bash
# Reiniciar backend
docker restart keikichi_backend_dev

# Esperar 10 segundos y recargar página
```

### Base de Datos no conecta
```bash
# Verificar que la DB esté corriendo
docker ps | grep keikichi_db_dev

# Ver logs de la DB
docker logs keikichi_db_dev

# Reiniciar DB
docker restart keikichi_db_dev
```

### Página de Cuentas vacía
1. **Cierra sesión** completamente
2. **Inicia sesión** de nuevo con `admin@dev.local`
3. Ve a **Ajustes → Cuentas**

### Error al crear reservación
- Todos los errores de schema han sido corregidos
- Asegúrate de llenar todos los campos requeridos
- Verifica que el viaje tenga espacios disponibles

---

## 📊 5. Arquitectura del Sistema

### Stack Tecnológico
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: PostgreSQL 15
- **ORM**: SQLAlchemy (Async)
- **Autenticación**: JWT (Bearer tokens)

### Puertos
- `5173`: Frontend (Vite dev server)
- `8000`: Backend (FastAPI)
- `5432`: PostgreSQL

### Contenedores
- `keikichi_frontend_dev`: Aplicación React
- `keikichi_backend_dev`: API FastAPI
- `keikichi_db_dev`: Base de datos PostgreSQL

---

## 🎯 6. Próximos Pasos

1. ✅ Sistema de reservaciones funcionando
2. ✅ Catálogo de productos y unidades
3. ✅ Gestión de cuentas
4. ✅ Datos bancarios configurables
5. ⏳ Notificaciones por email
6. ⏳ Dashboard de estadísticas
7. ⏳ Exportar reportes

---

## 📞 7. Información Adicional

### Migraciones de Base de Datos
```bash
# Crear nueva migración
docker exec keikichi_backend_dev alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
docker exec keikichi_backend_dev alembic upgrade head

# Ver historial
docker exec keikichi_backend_dev alembic history
```

### Acceso Directo a la Base de Datos
```bash
docker exec -it keikichi_db_dev psql -U keikichi -d keikichi_logistics_dev
```

### Variables de Entorno Importantes
Ver `.env.example` para la configuración completa. Las más importantes son:
- `DEFAULT_ADMIN_EMAIL`: Email del admin
- `DEFAULT_ADMIN_PASSWORD`: Contraseña del admin
- `JWT_SECRET_KEY`: Clave secreta para JWT
- `DATABASE_URL`: URL de conexión a la DB

---

**Última actualización**: 2025-11-30
