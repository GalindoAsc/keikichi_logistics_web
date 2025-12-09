# 🐳 Deploy con Portainer en Synology NAS

Guía para desplegar Keikichi Logistics usando Portainer en Synology DS 224+.

---

## 📋 Pre-requisitos

### En tu NAS
- [ ] Docker instalado desde Package Center
- [ ] Portainer instalado y accesible (normalmente en puerto 9000)
- [ ] Repositorio clonado en `/volume1/docker/keikichi`
- [ ] Certificados SSL en `/volume1/docker/keikichi/nginx/ssl/`

### En Cloudflare
- [ ] Dominio `keikichi.com` configurado
- [ ] Origin Certificates creados
- [ ] DNS CNAME apuntando a tu DDNS

---

## 🚀 Paso 1: Acceder a Portainer

1. Abre tu navegador y ve a: `http://<IP-DEL-NAS>:9000`
2. Inicia sesión en Portainer

---

## 📦 Paso 2: Crear el Stack

1. En el menú lateral, haz clic en **Stacks**
2. Clic en **+ Add stack**
3. **Name**: `keikichi`

### Opción A: Subir archivo (Recomendado)
1. Selecciona **Upload**
2. Sube el archivo `docker-compose.portainer.yml`

### Opción B: Web editor
1. Selecciona **Web editor**
2. Copia y pega el contenido de `docker-compose.portainer.yml`

---

## 🔐 Paso 3: Configurar Variables de Entorno

En la sección **Environment variables**, haz clic en **+ Add an environment variable** para cada una:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `POSTGRES_DB` | `keikichi_db` | Nombre de la base de datos |
| `POSTGRES_USER` | `keikichi` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | `<tu_password_seguro>` | **Genera uno seguro** |
| `SECRET_KEY` | `<64_caracteres>` | Clave secreta para la app |
| `JWT_SECRET_KEY` | `<64_caracteres>` | Clave para tokens JWT |
| `DEFAULT_ADMIN_EMAIL` | `admin@keikichi.com` | Email del admin |
| `DEFAULT_ADMIN_PASSWORD` | `Admin123!ChangeMe` | Password inicial |
| `VITE_API_URL` | `https://keikichi.com/api/v1` | URL de la API |
| `VITE_WS_URL` | `wss://keikichi.com/ws` | URL de WebSocket |
| `BACKEND_CORS_ORIGINS` | `https://keikichi.com,https://www.keikichi.com` | Orígenes permitidos |

### 🔑 Generar claves seguras

En tu terminal local (Mac/Linux):
```bash
# Para SECRET_KEY
openssl rand -hex 32

# Para JWT_SECRET_KEY (usa un valor diferente)
openssl rand -hex 32

# Para POSTGRES_PASSWORD
openssl rand -base64 24
```

---

## ▶️ Paso 4: Deploy

1. Revisa que todo esté configurado correctamente
2. Haz clic en **Deploy the stack**
3. Espera a que todos los contenedores inicien (puede tomar 2-5 minutos la primera vez)

---

## ✅ Paso 5: Verificar el Deploy

### En Portainer
1. Ve a **Containers** en el menú lateral
2. Deberías ver 4 contenedores con estado **running**:
   - `keikichi_db` (verde)
   - `keikichi_backend` (verde)
   - `keikichi_frontend` (verde)
   - `keikichi_nginx` (verde)

### Ver Logs
1. Haz clic en cualquier contenedor
2. Clic en **Logs** para ver la salida

### Probar la aplicación
- **Local**: `http://<IP-DEL-NAS>`
- **Externo**: `https://keikichi.com`
- **API Docs**: `https://keikichi.com/docs`

---

## 🔧 Mantenimiento

### Actualizar la aplicación

1. En el NAS, actualiza el código:
   ```bash
   cd /volume1/docker/keikichi
   git pull origin main
   ```

2. En Portainer:
   - Ve a **Stacks** → **keikichi**
   - Clic en **Editor** para ver el compose
   - Clic en **Update the stack**
   - Marca **Re-pull image and redeploy**
   - Clic en **Update**

### Ver logs de un contenedor

1. Ve a **Containers**
2. Clic en el contenedor deseado
3. Clic en el ícono de **Logs**

### Reiniciar un servicio

1. Ve a **Containers**
2. Selecciona el contenedor
3. Clic en **Restart**

### Backup de la base de datos

1. Ve a **Containers** → `keikichi_db`
2. Clic en **Console** → **Connect**
3. Ejecuta:
   ```bash
   pg_dump -U keikichi keikichi_db > /var/lib/postgresql/data/backup.sql
   ```

O desde SSH en el NAS:
```bash
docker exec keikichi_db pg_dump -U keikichi keikichi_db > /volume1/docker/keikichi/backups/backup_$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting

### El backend no inicia
- Verifica que la base de datos esté healthy primero
- Revisa los logs del backend para ver el error
- Asegúrate de que DATABASE_URL esté correctamente formado

### Error de SSL/certificados
- Verifica que los archivos existan en `/volume1/docker/keikichi/nginx/ssl/`
- Verifica los permisos: `chmod 600 *-key.pem`
- Revisa los logs de nginx

### El frontend muestra error de API
- Verifica que `VITE_API_URL` esté correctamente configurado
- El frontend se compila con esta variable, si la cambias necesitas rebuild

### No se puede acceder desde internet
- Verifica la configuración DNS en Cloudflare
- Asegúrate de que los puertos 80 y 443 estén abiertos en el router
- Revisa que el proxy de Cloudflare esté activo (nube naranja)

---

## 📊 Arquitectura del Stack

```
                    ┌─────────────────────────────────────────┐
                    │              CLOUDFLARE                  │
                    │         (SSL + WAF + CDN)               │
                    └─────────────────┬───────────────────────┘
                                      │ HTTPS
                                      ▼
┌────────────────────────────── SYNOLOGY NAS ─────────────────────────────┐
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         NGINX                                    │   │
│   │                    (Reverse Proxy)                               │   │
│   │                   Puertos 80, 443                                │   │
│   └───────────────────────┬─────────────────────────────────────────┘   │
│                           │                                              │
│           ┌───────────────┼───────────────┐                             │
│           │               │               │                              │
│           ▼               ▼               ▼                              │
│   ┌───────────┐   ┌───────────────┐   ┌────────────┐                    │
│   │  Frontend │   │    Backend    │   │   Uploads  │                    │
│   │  (React)  │   │  (FastAPI)    │   │  (Static)  │                    │
│   └───────────┘   └───────┬───────┘   └────────────┘                    │
│                           │                                              │
│                           ▼                                              │
│                   ┌───────────────┐                                      │
│                   │   PostgreSQL  │                                      │
│                   │   (Database)  │                                      │
│                   └───────────────┘                                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Notas Adicionales

- Los datos de PostgreSQL persisten en el volumen Docker `keikichi_postgres_data`
- Los archivos subidos se guardan en `/volume1/docker/keikichi/uploads`
- Los logs se pueden ver directamente desde Portainer
- Para actualizaciones de código, siempre haz `git pull` antes de actualizar el stack
