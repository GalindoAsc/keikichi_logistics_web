# ⚡ Comandos Rápidos - Keikichi Logistics

Guía de referencia rápida para los comandos más comunes. Copia y pega directamente.

---

## 🚀 Primera Vez (Setup Inicial)

```bash
# 1. Clonar el proyecto
git clone https://github.com/GalindoAsc/keikichi_logistics_web.git
cd keikichi_logistics_web

# 2. Cambiar a la rama de desarrollo
git checkout claude/keikichi-logistics-app-01X28hvdbJLTa6iEePksh4JB

# 3. Obtener últimos cambios
git pull

# 4. Crear archivo .env
cp .env.example .env

# 5. Iniciar servicios (tarda 3-5 minutos la primera vez)
cd infra
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 🔄 Uso Diario

### Iniciar la aplicación

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml up -d
```

### Detener la aplicación

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml down
```

### Ver logs en tiempo real

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml logs -f
```

**Salir de logs:** `Ctrl+C`

---

## 🔍 Ver Estado

### Ver qué contenedores están corriendo

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml ps
```

### Ver logs de un servicio específico

```bash
# Backend
docker compose -f docker-compose.dev.yml logs -f keikichi_backend

# Frontend
docker compose -f docker-compose.dev.yml logs -f keikichi_frontend

# Base de datos
docker compose -f docker-compose.dev.yml logs -f keikichi_db
```

---

## 🔄 Actualizar Código

### Obtener cambios del repositorio

```bash
# Desde la raíz del proyecto
cd ~/keikichi_logistics_web
git pull

# Reconstruir contenedores si hay cambios en dependencias
cd infra
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 🔧 Reiniciar Servicios

### Reiniciar todos los servicios

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml restart
```

### Reiniciar un servicio específico

```bash
# Backend
docker compose -f docker-compose.dev.yml restart keikichi_backend

# Frontend
docker compose -f docker-compose.dev.yml restart keikichi_frontend

# Base de datos
docker compose -f docker-compose.dev.yml restart keikichi_db
```

---

## 🗑️ Limpiar y Reconstruir

### Reconstruir todo desde cero (sin borrar base de datos)

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

### Eliminar TODO y empezar de cero (⚠️ borra la base de datos)

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 🐳 Comandos de Docker

### Ver todas las imágenes Docker

```bash
docker images
```

### Ver todos los contenedores (corriendo y detenidos)

```bash
docker ps -a
```

### Limpiar imágenes no usadas (liberar espacio)

```bash
docker system prune -a
```

**⚠️ Esto elimina todas las imágenes Docker no usadas**

---

## 💾 Base de Datos

### Conectarse a PostgreSQL

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml exec keikichi_db psql -U keikichi -d keikichi_logistics_dev
```

**Comandos útiles dentro de psql:**
- `\l` - Listar bases de datos
- `\dt` - Listar tablas
- `\d nombre_tabla` - Describir una tabla
- `SELECT * FROM users;` - Consultar tabla users
- `\q` - Salir

### Backup de base de datos

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml exec keikichi_db pg_dump -U keikichi keikichi_logistics_dev > backup.sql
```

### Restaurar backup

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml exec -T keikichi_db psql -U keikichi keikichi_logistics_dev < backup.sql
```

---

## 🌐 URLs de Acceso

### Aplicación

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Interfaz de usuario React |
| Backend API | http://localhost:8000 | API REST de FastAPI |
| API Docs (Swagger) | http://localhost:8000/docs | Documentación interactiva |
| API Docs (ReDoc) | http://localhost:8000/redoc | Documentación alternativa |

### Endpoints útiles

- Health check: http://localhost:8000/health
- API info: http://localhost:8000/api/v1/info

---

## 🔧 Entrar a los Contenedores

A veces necesitas ejecutar comandos dentro del contenedor.

### Backend (Python/FastAPI)

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml exec keikichi_backend bash
```

**Comandos útiles dentro:**
- `ls` - Ver archivos
- `python` - Abrir consola Python
- `pip list` - Ver paquetes instalados
- `exit` - Salir

### Frontend (Node/React)

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml exec keikichi_frontend sh
```

**Comandos útiles dentro:**
- `ls` - Ver archivos
- `npm list` - Ver paquetes instalados
- `exit` - Salir

---

## 🐛 Debugging

### Ver uso de recursos de Docker

```bash
docker stats
```

**Muestra:** CPU, memoria, red de cada contenedor en tiempo real
**Salir:** `Ctrl+C`

### Ver detalles de un contenedor

```bash
docker inspect keikichi_backend_dev
```

### Ver logs de las últimas 50 líneas

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml logs --tail=50 keikichi_backend
```

### Ver logs desde una hora específica

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml logs --since 1h keikichi_backend
```

---

## 📦 Instalar Nuevas Dependencias

### Backend (Python)

1. Agregar la dependencia a `backend/requirements.txt`
2. Reconstruir el contenedor:
   ```bash
   cd ~/keikichi_logistics_web/infra
   docker compose -f docker-compose.dev.yml up -d --build keikichi_backend
   ```

### Frontend (Node)

1. Agregar la dependencia a `frontend/package.json`
2. Reconstruir el contenedor:
   ```bash
   cd ~/keikichi_logistics_web/infra
   docker compose -f docker-compose.dev.yml up -d --build keikichi_frontend
   ```

---

## 🔄 Git (Actualizar Código)

### Ver estado de cambios

```bash
cd ~/keikichi_logistics_web
git status
```

### Ver qué rama estás usando

```bash
git branch
```

### Descartar cambios locales

```bash
git checkout -- .
```

### Obtener últimos cambios

```bash
git pull
```

### Cambiar de rama

```bash
git checkout nombre-de-rama
```

---

## ⚙️ Variables de Entorno

### Ver variables actuales

```bash
cat ~/keikichi_logistics_web/.env
```

### Editar variables

```bash
nano ~/keikichi_logistics_web/.env
```

**Después de editar:** Reinicia los servicios
```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml restart
```

---

## 🆘 Solución Rápida de Problemas

### "Algo no funciona, quiero empezar de cero"

```bash
cd ~/keikichi_logistics_web/infra

# 1. Detener todo
docker compose -f docker-compose.dev.yml down -v

# 2. Limpiar Docker
docker system prune -a

# 3. Iniciar de nuevo
docker compose -f docker-compose.dev.yml up -d --build
```

⚠️ **Esto borra la base de datos y todos los datos locales**

### "El frontend no se actualiza con mis cambios"

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml restart keikichi_frontend
```

### "El backend da error después de cambiar requirements.txt"

```bash
cd ~/keikichi_logistics_web/infra
docker compose -f docker-compose.dev.yml up -d --build keikichi_backend
```

---

## 📝 Aliases Útiles (Opcional)

Agrega estos a tu `~/.bashrc` o `~/.zshrc` para hacer los comandos más cortos:

```bash
# Keikichi Logistics aliases
alias kl-start="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml up -d"
alias kl-stop="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml down"
alias kl-logs="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml logs -f"
alias kl-ps="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml ps"
alias kl-restart="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml restart"
alias kl-rebuild="cd ~/keikichi_logistics_web/infra && docker compose -f docker-compose.dev.yml up -d --build"
```

**Después de agregar los aliases:**
```bash
source ~/.zshrc  # o ~/.bashrc
```

**Ahora puedes usar:**
- `kl-start` - Iniciar
- `kl-stop` - Detener
- `kl-logs` - Ver logs
- `kl-ps` - Ver estado
- `kl-restart` - Reiniciar
- `kl-rebuild` - Reconstruir

---

**💡 Tip:** Guarda este archivo en favoritos para consultarlo rápidamente.
