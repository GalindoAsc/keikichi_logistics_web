# 🚀 Guía de Deploy - Synology DS 224+ con Cloudflare

## Requisitos Previos

### En tu NAS Synology
- ✅ Docker Package instalado
- ✅ Acceso SSH habilitado
- ✅ Al menos 2GB RAM disponible
- ✅ 10GB espacio en disco

### En tu Router
- ✅ Port forwarding configurado:
  - Puerto 80 → IP del NAS:80
  - Puerto 443 → IP del NAS:443

### En Cloudflare
- ✅ Dominio `keikichi.com` agregado
- ✅ DNS apuntando a tu IP pública

---

## Paso 1: Configurar Cloudflare

### 1.1 Registros DNS

Ve a **Cloudflare Dashboard > DNS > Records** y agrega:

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | @ | dgalindoasc.synology.me | Proxied ☁️ |
| CNAME | www | dgalindoasc.synology.me | Proxied ☁️ |

> 📝 Usamos CNAME a tu DDNS de Synology para que funcione aunque cambie tu IP.

### 1.2 Configuración SSL

Ve a **SSL/TLS > Overview**:
- Modo: **Full (strict)**

Ve a **SSL/TLS > Origin Server**:
1. Click **Create Certificate**
2. Tipo: RSA (2048)
3. Hostnames: `keikichi.com, *.keikichi.com`
4. Validez: 15 años
5. Click **Create**
6. **IMPORTANTE**: Guarda el certificado y la clave privada

### 1.3 Configuración de Seguridad

Ve a **Security > Settings**:
- Security Level: **Medium**
- Challenge Passage: **30 minutes**
- Browser Integrity Check: ✅

Ve a **Security > Bots**:
- Bot Fight Mode: ✅ **On**

---

## Paso 2: Preparar el NAS

### 2.1 Conectar por SSH

```bash
ssh tu_usuario@tu_nas_ip
# o
ssh tu_usuario@dgalindoasc.synology.me
```

### 2.2 Crear estructura de directorios

```bash
# Crear directorio para el proyecto
mkdir -p /volume1/docker/keikichi
cd /volume1/docker/keikichi

# Crear directorios necesarios
mkdir -p nginx/ssl uploads backups
```

### 2.3 Transferir archivos

Desde tu Mac, copia los archivos al NAS:

```bash
# Desde el directorio del proyecto
cd /Users/galindoasc/keikichi_logistics_web

# Copiar archivos esenciales
scp -r docker-compose.prod.yml tu_usuario@tu_nas:/volume1/docker/keikichi/
scp -r backend tu_usuario@tu_nas:/volume1/docker/keikichi/
scp -r frontend tu_usuario@tu_nas:/volume1/docker/keikichi/
scp -r nginx/nginx.prod.conf tu_usuario@tu_nas:/volume1/docker/keikichi/nginx/
scp deploy.sh tu_usuario@tu_nas:/volume1/docker/keikichi/
scp .env.production.example tu_usuario@tu_nas:/volume1/docker/keikichi/.env
```

---

## Paso 3: Configurar Certificados SSL

### 3.1 Guardar certificados de Cloudflare

En el NAS, crea los archivos de certificado:

```bash
cd /volume1/docker/keikichi/nginx/ssl

# Pegar el certificado (del paso 1.2)
nano cloudflare-origin.pem
# Pega el contenido y guarda (Ctrl+O, Ctrl+X)

# Pegar la clave privada
nano cloudflare-origin-key.pem
# Pega el contenido y guarda

# Ajustar permisos
chmod 600 cloudflare-origin-key.pem
chmod 644 cloudflare-origin.pem
```

---

## Paso 4: Configurar Variables de Entorno

### 4.1 Editar .env

```bash
cd /volume1/docker/keikichi
nano .env
```

**Cambiar estos valores** (genera claves seguras):

```bash
# Generar claves seguras en tu Mac:
openssl rand -base64 32  # Para POSTGRES_PASSWORD
openssl rand -base64 32  # Para SECRET_KEY
openssl rand -base64 32  # Para JWT_SECRET_KEY
```

Ejemplo de `.env` configurado:
```env
ENVIRONMENT=production
DEBUG=false
DOMAIN=keikichi.com
VITE_API_URL=https://keikichi.com/api/v1
VITE_WS_URL=wss://keikichi.com

POSTGRES_DB=keikichi_prod
POSTGRES_USER=keikichi
POSTGRES_PASSWORD=TuClaveSeguraAqui123

SECRET_KEY=OtraClaveSuperSecreta456
JWT_SECRET_KEY=YOtraMasParaJWT789

BACKEND_CORS_ORIGINS=["https://keikichi.com","https://www.keikichi.com"]

DEFAULT_ADMIN_EMAIL=tu@email.com
DEFAULT_ADMIN_PASSWORD=ContraseñaSeguraAdmin!
DEFAULT_ADMIN_NAME=Administrador
```

---

## Paso 5: Deploy

### 5.1 Ejecutar deploy

```bash
cd /volume1/docker/keikichi
chmod +x deploy.sh
./deploy.sh deploy
```

### 5.2 Verificar

```bash
# Ver estado de contenedores
docker ps

# Ver logs
./deploy.sh logs

# Verificar salud
./deploy.sh health
```

---

## Paso 6: Verificar Funcionamiento

### 6.1 Prueba local (en el NAS)

```bash
curl http://localhost/health
# Debería responder: {"status":"healthy","environment":"production"}
```

### 6.2 Prueba externa

Desde cualquier navegador:
- https://keikichi.com → Debería cargar la aplicación
- https://keikichi.com/docs → Debería mostrar Swagger

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
./deploy.sh logs

# Ver logs de un servicio específico
./deploy.sh logs backend
./deploy.sh logs nginx

# Reiniciar servicios
./deploy.sh restart

# Detener todo
./deploy.sh stop

# Crear backup de la base de datos
./deploy.sh backup

# Ver estado de salud
./deploy.sh health
```

---

## Troubleshooting

### El sitio no carga

1. Verificar que Cloudflare proxy esté activo (nube naranja)
2. Verificar port forwarding en tu router
3. Ver logs: `./deploy.sh logs nginx`

### Error de SSL

1. Verificar que el modo SSL en Cloudflare sea "Full (strict)"
2. Verificar que los certificados estén en `nginx/ssl/`
3. Verificar permisos de los certificados

### Backend no responde

```bash
# Ver logs del backend
./deploy.sh logs backend

# Reiniciar solo backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Base de datos no conecta

```bash
# Verificar que el contenedor DB está corriendo
docker ps | grep keikichi_db

# Ver logs de la DB
./deploy.sh logs db
```

---

## Mantenimiento

### Backups automáticos

Agrega una tarea programada en Synology DSM:

1. **Panel de Control > Programador de Tareas**
2. **Crear > Tarea programada > Script definido por el usuario**
3. Nombre: "Backup Keikichi DB"
4. Programación: Diario a las 3:00 AM
5. Script:
```bash
cd /volume1/docker/keikichi
./deploy.sh backup
# Mantener solo últimos 7 backups
find backups -name "*.sql" -mtime +7 -delete
```

### Actualizar la aplicación

```bash
cd /volume1/docker/keikichi
git pull  # Si usas git
./deploy.sh deploy
```

---

## Arquitectura Final

```
Internet
    │
    ▼
Cloudflare (CDN + SSL + WAF)
    │
    ▼ (Puerto 443 HTTPS)
Router (Port Forward)
    │
    ▼ (Puerto 80/443)
Synology NAS
    │
    ├── nginx (Reverse Proxy) :80/:443
    │       │
    │       ├── /api/* → backend:8000
    │       ├── /uploads → archivos estáticos
    │       └── /* → frontend:80
    │
    ├── backend (FastAPI) :8000
    │       │
    │       └── db (PostgreSQL) :5432
    │
    └── frontend (React/Nginx) :80
```
