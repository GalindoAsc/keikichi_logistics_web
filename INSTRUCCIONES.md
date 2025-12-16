# Keikichi Logistics - Guía de Operación y Despliegue

## 🔑 1. Acceso al Sistema

### Credenciales de Administrador (Reset)
- **Email**: `admin@keikichi.com`
- **Contraseña**: `admin123`

### URLs del Sistema (Producción / Docker)
- **Frontend (Aplicación)**: 
  - Local: http://localhost
  - Red Local: `http://<TU_IP_LOCAL>` (ej. `http://192.168.1.100`)
- **Backend (API)**: http://localhost:8000/api/v1
- **API Docs (Swagger)**: http://localhost/api/docs

---

## 🚀 2. Despliegue en NAS (Synology/Otro)

Gracias a las recientes optimizaciones, el despliegue en NAS es directo:

1. **Copiar archivos**:
   Copia toda la carpeta del proyecto a tu NAS.

2. **Configuración (.env)**:
   El archivo `.env` ya está pre-configurado. No necesitas cambiar `VITE_API_URL` ni IPs manualmente.
   - El frontend detectará automáticamente la API usando rutas relativas (`/api/v1`).
   - Solo asegúrate de que los puertos `80` y `8000` estén libres en tu NAS.

3. **Ejecutar**:
   Desde la terminal del NAS (SSH) o Portainer:
   ```bash
   ./sincronizacion-local.sh 
   # O directamente:
   docker-compose up -d --build
   ```

---

## 🔧 3. Solución de Problemas Comunes

### Error "Network Error" o 405 Method Not Allowed
- **Causa**: El navegador intenta conectar a `localhost` en lugar de la IP del servidor, o la ruta de la API es incorrecta.
- **Solución**: Ya está corregido en la última versión. El frontend usa rutas relativas `/api/v1` que funcionan bajo cualquier IP o dominio.
- **Acción**: Si persiste, **limpia la caché del navegador** (Ctrl+Shift+R) para cargar el nuevo código del frontend.

### El Frontend no carga cambios
Si haces cambios y no se ven:
```bash
docker-compose up -d --build frontend
```

### Reiniciar todo el sistema (limpieza)
```bash
docker-compose down
docker-compose up -d --build
```

---

## 📊 4. Arquitectura

- **Frontend**: Nginx sirviendo React (Puerto 80). Redirecciona `/api` al backend.
- **Backend**: FastAPI (Puerto 8000 interno, expuesto vía Nginx).
- **Base de Datos**: PostgreSQL (Puerto 5432).

**Última actualización**: 2025-12-12
