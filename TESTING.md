# 🧪 Guía de Pruebas - Keikichi Logistics

Esta guía te ayudará a probar que la infraestructura del proyecto está funcionando correctamente.

---

## 🚀 Método 1: Script Automático (Recomendado)

### Ejecutar el script de prueba

```bash
# Desde la raíz del proyecto
./test-infrastructure.sh
```

Este script:
- ✅ Verifica que Docker esté instalado
- ✅ Valida los archivos de configuración
- ✅ Inicia todos los servicios
- ✅ Espera a que estén listos
- ✅ Prueba todos los endpoints
- ✅ Muestra el estado final

---

## 🔧 Método 2: Pruebas Manuales Paso a Paso

### Paso 1: Verificar requisitos previos

```bash
# Verificar Docker
docker --version
# Debe mostrar: Docker version 24.0.x o superior

# Verificar Docker Compose
docker compose version
# Debe mostrar: Docker Compose version 2.20.x o superior
```

### Paso 2: Verificar archivos de configuración

```bash
# Desde la raíz del proyecto
ls -la .env
ls -la infra/docker-compose.dev.yml
ls -la backend/Dockerfile.dev
ls -la frontend/Dockerfile.dev

# Todos deben existir
```

### Paso 3: Iniciar los servicios

```bash
# Navegar a la carpeta infra
cd infra

# Iniciar servicios (primera vez tomará varios minutos)
docker compose -f docker-compose.dev.yml up -d --build

# Ver logs en tiempo real
docker compose -f docker-compose.dev.yml logs -f
```

**Salida esperada:**
```
[+] Running 3/3
 ✔ Container keikichi_db_dev       Started
 ✔ Container keikichi_backend_dev  Started
 ✔ Container keikichi_frontend_dev Started
```

### Paso 4: Verificar estado de contenedores

```bash
# Ver estado de los contenedores
docker compose -f docker-compose.dev.yml ps
```

**Salida esperada:**
```
NAME                    STATUS              PORTS
keikichi_db_dev         Up 2 minutes        0.0.0.0:5432->5432/tcp
keikichi_backend_dev    Up 2 minutes (healthy) 0.0.0.0:8000->8000/tcp
keikichi_frontend_dev   Up 2 minutes        0.0.0.0:5173->5173/tcp
```

### Paso 5: Probar PostgreSQL

```bash
# Conectarse a PostgreSQL
docker compose -f docker-compose.dev.yml exec keikichi_db psql -U keikichi -d keikichi_logistics_dev

# Dentro de psql, ejecutar:
SELECT version();
\l
\q
```

**Salida esperada:**
```
PostgreSQL 15.x on x86_64-pc-linux-musl, compiled by gcc...
```

### Paso 6: Probar Backend (FastAPI)

#### Opción A: Usando curl

```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/

# API info
curl http://localhost:8000/api/v1/info
```

**Salida esperada (health):**
```json
{
  "status": "healthy",
  "environment": "development"
}
```

#### Opción B: Usando el navegador

Abre en tu navegador:
- http://localhost:8000 → Debería mostrar mensaje de bienvenida
- http://localhost:8000/docs → Documentación Swagger UI
- http://localhost:8000/redoc → Documentación ReDoc

### Paso 7: Probar Frontend (React)

#### Opción A: Usando curl

```bash
curl -I http://localhost:5173
```

**Salida esperada:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

#### Opción B: Usando el navegador (Recomendado)

Abre en tu navegador:
- http://localhost:5173

**Debería mostrar:**
- 🚚 Keikichi Logistics
- Plataforma de Gestión Logística
- Un contador funcional (+/-)
- Lista de módulos completados

### Paso 8: Probar Hot Reload

#### Backend Hot Reload

1. Abre `backend/app/main.py`
2. Modifica el mensaje en el endpoint `/`:
   ```python
   return {
       "message": "¡Keikichi Logistics API - MODIFICADO!",
       ...
   }
   ```
3. Guarda el archivo
4. Visita http://localhost:8000/ → Debería mostrar el mensaje modificado **sin reconstruir**

#### Frontend Hot Reload

1. Abre `frontend/src/App.tsx`
2. Modifica el título:
   ```tsx
   <h1 className="text-4xl font-bold text-gray-900 mb-4">
     🚚 Keikichi Logistics - HOT RELOAD FUNCIONA!
   </h1>
   ```
3. Guarda el archivo
4. El navegador se actualizará automáticamente con el cambio

### Paso 9: Ver logs de servicios

```bash
# Logs de todos los servicios
docker compose -f docker-compose.dev.yml logs -f

# Logs solo del backend
docker compose -f docker-compose.dev.yml logs -f keikichi_backend

# Logs solo del frontend
docker compose -f docker-compose.dev.yml logs -f keikichi_frontend

# Logs solo de la base de datos
docker compose -f docker-compose.dev.yml logs -f keikichi_db
```

---

## 🛠 Comandos Útiles

### Gestión de servicios

```bash
# Detener servicios (mantiene volúmenes)
docker compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes (⚠️ borra la BD)
docker compose -f docker-compose.dev.yml down -v

# Reiniciar servicios
docker compose -f docker-compose.dev.yml restart

# Reiniciar solo un servicio
docker compose -f docker-compose.dev.yml restart keikichi_backend

# Reconstruir contenedores
docker compose -f docker-compose.dev.yml up -d --build
```

### Acceso a contenedores

```bash
# Entrar al contenedor del backend
docker compose -f docker-compose.dev.yml exec keikichi_backend bash

# Entrar al contenedor del frontend
docker compose -f docker-compose.dev.yml exec keikichi_frontend sh

# Entrar a PostgreSQL
docker compose -f docker-compose.dev.yml exec keikichi_db psql -U keikichi -d keikichi_logistics_dev
```

### Monitoreo

```bash
# Ver uso de recursos
docker stats

# Ver estado de contenedores
docker compose -f docker-compose.dev.yml ps

# Inspeccionar un contenedor
docker inspect keikichi_backend_dev
```

---

## ✅ Checklist de Validación

Marca las siguientes verificaciones:

- [ ] Docker y Docker Compose instalados
- [ ] Archivo `.env` existe y está configurado
- [ ] Servicios iniciados correctamente
- [ ] PostgreSQL responde (`SELECT version()`)
- [ ] Backend responde en http://localhost:8000
- [ ] Backend docs accesibles en http://localhost:8000/docs
- [ ] Frontend responde en http://localhost:5173
- [ ] Frontend muestra la UI correctamente
- [ ] Hot reload funciona en backend
- [ ] Hot reload funciona en frontend
- [ ] Logs muestran información correcta
- [ ] No hay errores en los logs

---

## 🐛 Troubleshooting

### Problema: Puertos ya en uso

**Síntoma:** Error `port is already allocated`

**Solución:**
```bash
# Ver qué está usando el puerto 5432
lsof -i :5432
# o
netstat -tulpn | grep 5432

# Detener el proceso o cambiar el puerto en docker-compose.dev.yml
```

### Problema: Contenedores no inician

**Síntoma:** `exited with code 1`

**Solución:**
```bash
# Ver logs del contenedor que falló
docker compose -f docker-compose.dev.yml logs keikichi_backend

# Reconstruir sin caché
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

### Problema: Hot reload no funciona

**Síntoma:** Cambios en código no se reflejan

**Solución:**
```bash
# Verificar que los volúmenes estén montados
docker inspect keikichi_backend_dev | grep -A 10 Mounts

# Reiniciar el servicio
docker compose -f docker-compose.dev.yml restart keikichi_backend
```

### Problema: PostgreSQL no está listo

**Síntoma:** Backend muestra errores de conexión

**Solución:**
```bash
# Esperar más tiempo (puede tomar 30-60s la primera vez)
docker compose -f docker-compose.dev.yml logs -f keikichi_db

# Buscar: "database system is ready to accept connections"
```

### Problema: Frontend no carga

**Síntoma:** `ERR_CONNECTION_REFUSED` en http://localhost:5173

**Solución:**
```bash
# Ver logs del frontend
docker compose -f docker-compose.dev.yml logs -f keikichi_frontend

# Verificar que node_modules se instalaron
docker compose -f docker-compose.dev.yml exec keikichi_frontend ls -la node_modules

# Si no existen, reconstruir:
docker compose -f docker-compose.dev.yml up -d --build keikichi_frontend
```

---

## 📊 Resultados Esperados

Al finalizar todas las pruebas, deberías tener:

✅ **3 contenedores corriendo:**
- keikichi_db_dev (PostgreSQL)
- keikichi_backend_dev (FastAPI)
- keikichi_frontend_dev (React/Vite)

✅ **3 URLs funcionales:**
- http://localhost:5173 (Frontend)
- http://localhost:8000 (Backend API)
- http://localhost:8000/docs (API Docs)

✅ **Hot reload funcionando:**
- Cambios en `backend/app/` se reflejan automáticamente
- Cambios en `frontend/src/` se reflejan automáticamente

✅ **Sin errores en logs:**
- PostgreSQL muestra "ready to accept connections"
- Backend muestra "Application startup complete"
- Frontend muestra el dev server de Vite

---

## 🎯 Próximos Pasos

Una vez que todas las pruebas pasen:

1. ✅ **Módulo 1: Infraestructura Base** - COMPLETO
2. ⏳ **Módulo 2: Base de Datos** - Siguiente
   - Modelos SQLAlchemy
   - Migraciones Alembic
   - Seed data inicial

---

**¿Problemas?** Revisa la sección de Troubleshooting o verifica los logs de los contenedores.
