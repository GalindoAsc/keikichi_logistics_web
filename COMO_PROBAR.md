# ✅ Sistema de Reservaciones - LISTO PARA USAR

## 🎉 El backend está funcionando correctamente

Ya solucioné todos los problemas técnicos. Ahora puedes probar el sistema.

---

## 📝 Comandos para Probar (Usa curl en tu terminal)

### 1️⃣ Crear Usuario Admin

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/register' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "admin@keikichi.com",
  "password": "Admin123!",
  "full_name": "Administrador",
  "phone": "5500000000"
}'
```

**IMPORTANTE:** Guarda el `access_token` que te devuelve.

### 2️⃣ Login

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "admin@keikichi.com",
  "password": "Admin123!"
}'
```

**GUARDA el `access_token`** que aparece en la respuesta.

### 3️⃣ Crear un Viaje

**Reemplaza** `TU_TOKEN_AQUI` con el token del paso anterior:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/trips' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer TU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
  "origin": "CDMX",
  "destination": "Monterrey",
  "departure_date": "2025-12-15",
  "departure_time": "08:00",
  "total_spaces": 28,
  "price_per_space": 500.00,
  "individual_pricing": false,
  "tax_included": false,
  "tax_rate": 0.16,
  "payment_deadline_hours": 24
}'
```

**GUARDA el `id`** del viaje de la respuesta.

---

## 🌐 O usa Swagger UI (Más Fácil)

1. Abre: **http://localhost:8000/docs**
2. Sigue los pasos de `GUIA_VISUAL.md`

---

## ✅ Resumen de Cambios Técnicos

Arreglé estos problemas:

1. ❌ Email `admin@keikichi.local` → ✅ `admin@keikichi.com` (dominio válido)
2. ❌ Bcrypt 5.0.0 incompatible → ✅ Bcrypt 4.1.2 (compatible con passlib)
3. ❌ `settings.UPLOAD_DIR` → ✅ `settings.upload_dir` (mayúsculas/minúsculas)
4. ❌ DATABASE_URL no se usaba → ✅ Config actualizado para usar DATABASE_URL

---

## 🚀 El sistema ya está 100% operacional

- ✅ Backend funcionando
- ✅ Base de datos conectada
- ✅ Todos los endpoints de reservaciones disponibles
- ✅ Swagger UI funcionando
- ✅ Tareas programadas activas

**Siguiente paso:** Abre http://localhost:8000/docs y prueba crear una reservación siguiendo `GUIA_VISUAL.md`
