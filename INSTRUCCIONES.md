# Keikichi Logistics - Guía de Operación

## 🔑 Acceso al Sistema

### Credenciales de Administrador
- **Email**: `admin@keikichi.com`
- **Contraseña**: La que configuraste en `.env` (`DEFAULT_ADMIN_PASSWORD`)

### URLs
| Entorno | Frontend | Backend | API Docs |
|---------|----------|---------|----------|
| **Producción** | https://keikichi.com | https://keikichi.com/api/v1 | https://keikichi.com/docs |
| **Local (dev)** | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/docs |

---

## �️ Desarrollo Local (MacBook + OrbStack)

```bash
# Iniciar
./dev.sh

# Otros comandos
./dev.sh down      # Detener
./dev.sh logs      # Ver logs
./dev.sh rebuild   # Reconstruir
./dev.sh db        # Conectar a PostgreSQL
./dev.sh shell     # Shell en backend
```

> ⚠️ La base de datos local (`keikichi_dev`) está separada de producción.

---

## 🚀 Deploy a Producción (N5 Pro)

### Arquitectura
```
MacBook ──SSH/Tailscale──▶ N5 Pro (Windows 11 + Docker)
                                    │
                                    ▼
                          Cloudflare Tunnel ──▶ keikichi.com
```

### Comando de deploy
```bash
./deploy-n5.sh
```

El script:
1. Hace commit y push a GitHub
2. Conecta al N5 vía Tailscale (100.106.83.19)
3. Pull + rebuild de contenedores

### Cloudflare Tunnel (rutas configuradas)
| Hostname | Service |
|----------|---------|
| `keikichi.com` | `http://host.docker.internal:3080` |
| `keikichi.com/api` | `http://host.docker.internal:8001` |
| `keikichi.com/docs` | `http://host.docker.internal:8001` |

---

## 🔧 Solución de Problemas

### Error "Network Error" o 405
Limpia caché del navegador (Ctrl+Shift+R / Cmd+Shift+R)

### Credenciales Docker expiradas (N5)
```powershell
docker logout
docker login
```

### Reiniciar todo en N5
```powershell
cd D:\Projectos\keikichi_logistics_web
docker compose -f docker-compose.n5.yml down
docker compose -f docker-compose.n5.yml up -d --build
```

### Ver logs del backend en N5
```powershell
docker logs keikichi_backend -f
```

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `dev.sh` | Desarrollo local (MacBook) |
| `deploy-n5.sh` | Deploy a producción (N5 Pro) |
| `docker-compose.dev.yml` | Compose para desarrollo |
| `docker-compose.n5.yml` | Compose para producción N5 |
| `.env.n5.example` | Template de variables para N5 |

---

**Última actualización**: 2026-01-07
