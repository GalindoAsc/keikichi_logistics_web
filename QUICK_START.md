# ✅ Backend de Reservaciones - FUNCIONANDO

## 🎯 Estado Actual

✅ **Backend 100% operativo** - Todos los endpoints funcionando  
✅ **Base de datos conectada** - Tablas creadas automáticamente  
✅ **Swagger UI disponible** - http://localhost:8000/docs  
✅ **Tareas programadas activas** - Hold expiration (5 min) y Payment deadline (1 hora)

---

## 🚀 Pruebas Rápidas

### 1. Verificar que el backend responde

```bash
curl http://localhost:8000/health
```

**Resultado esperado:**
```json
{"status": "healthy", "environment": "development"}
```

### 2. Abrir Swagger UI

👉 **http://localhost:8000/docs**

Verás todos los endpoints disponibles organizados por categorías:
- **auth** - Login/Registro
- **users** - Gestión de usuarios
- **trips** - Viajes
- **spaces** - Espacios
- **reservations** ⭐ **NUEVO** - Sistema completo de reservaciones

---

## 📋 Flujo Completo de Prueba

Sigue este orden para probar el sistema end-to-end:

### Paso 1: Login como Admin

En Swagger UI, ejecuta:

```
POST /api/v1/auth/login
```
```json
{
  "email": "admin@keikichi.local",
  "password": "Admin123!ChangeMe"
}
```

Copia el `access_token` de la respuesta y haz click en **"Authorize"** (botón verde arriba a la derecha). Pega el token en el formato:
```
Bearer <tu_access_token>
```

### Paso 2: Crear un Viaje

```
POST /api/v1/trips
```
```json
{
  "origin": "CDMX",
  "destination": "Monterrey",
  "departure_date": "2025-12-15",
  "departure_time": "08:00",
  "total_spaces": 28,
  "price_per_space": 500.00,
  "tax_included": false,
  "tax_rate": 0.16,
  "payment_deadline_hours": 24
}
```

**Guarda el `id` del viaje** y los `id` de algunos espacios de la respuesta.

### Paso 3: Registrar un Cliente

```
POST /api/v1/auth/register
```
```json
{
  "email": "cliente@test.com",
  "password": "Test123!",
  "full_name": "Cliente de Prueba",
  "phone": "5512345678"
}
```

Copia el nuevo `access_token` y actualiza la autorización (botón "Authorize" de nuevo).

### Paso 4: Crear Hold Temporal (10 minutos)

```
POST /api/v1/reservations/hold
```
```json
{
  "trip_id": "<trip_id_del_paso_2>",
  "space_ids": [
    "<space_id_1>",
    "<space_id_2>",
    "<space_id_3>"
  ]
}
```

**Resultado:** Los espacios quedan "on_hold" por 10 minutos. Si no creas la reservación en este tiempo, se liberan automáticamente.

### Paso 5: Crear Reservación

```
POST /api/v1/reservations
```
```json
{
  "trip_id": "<trip_id>",
  "space_ids": ["<space_id_1>", "<space_id_2>", "<space_id_3>"],
  "payment_method": "bank_transfer",
  "cargo_type": "Electrónicos",
  "cargo_description": "Laptops y tablets en cajas protectoras",
  "cargo_weight": 150.5,
  "cargo_value": 25000.00,
  "requires_invoice": true
}
```

**Guarda el `id` de la reservación** de la respuesta.

**Verifica:** 
- `status`: "pending"
- `payment_status`: "unpaid"
- `total_amount`: Debería ser 1740.00 (500 x 3 espacios + 16% IVA = 1740)

### Paso 6: Subir Comprobante de Pago

```
POST /api/v1/reservations/{reservation_id}/payment-proof
```

En Swagger:
1. Click en "Try it out"
2. Ingresa el `reservation_id`
3. Click en "Choose File" y selecciona una imagen o PDF
4. Click "Execute"

**Resultado:** `payment_status` cambia a "pending_review"

### Paso 7: Aprobar Pago (como Admin)

**Importante:** Vuelve a autenticarte como admin (usa el token del Paso 1).

```
POST /api/v1/reservations/{reservation_id}/confirm-payment
```
```json
{
  "approved": true,
  "notes": "Pago verificado - BBVA transferencia"
}
```

**Resultado:**
- `payment_status`: "paid"
- `status`: "confirmed"
- Se genera automáticamente un ticket PDF con QR code

### Paso 8: Descargar Ticket PDF

```
GET /api/v1/reservations/{reservation_id}/ticket
```

El PDF contiene:
- Información del viaje (origen, destino, fecha)
- Espacios reservados (números)
- Desglose de pagos
- QR code con ID de reservación
- Términos y condiciones

---

## 🔍 Endpoints Disponibles

### Reservations

- `POST /api/v1/reservations/hold` ⏱️ Crear hold temporal (10 min)
- `POST /api/v1/reservations` 📝 Crear reservación
- `GET /api/v1/reservations` 📋 Listar reservaciones (paginado)
- `GET /api/v1/reservations/{id}` 🔍 Ver detalle
- `PATCH /api/v1/reservations/{id}` ✏️ Actualizar (solo pending)
- `DELETE /api/v1/reservations/{id}` 🗑️ Cancelar
- `POST /api/v1/reservations/{id}/payment-proof` 📤 Subir comprobante
- `POST /api/v1/reservations/{id}/confirm-payment` ✅ Aprobar/Rechazar pago (admin)
- `GET /api/v1/reservations/{id}/ticket` 📄 Descargar ticket PDF

---

## ⚙️ Tareas Programadas

### 1. Liberación de Holds (cada 5 minutos)

Busca espacios con `status=on_hold` y `hold_expires_at < now()` y los cambia a `available`.

**Verificar en logs:**
```bash
cd infra
docker compose -f docker-compose.dev.yml --env-file ../.env logs keikichi_backend | grep "Hold Expiration"
```

### 2. Cancelación por Falta de Pago (cada hora)

Cancela reservaciones `pending` con `payment_status=unpaid` que exceden `payment_deadline_hours`.

**Verificar en logs:**
```bash
docker compose -f docker-compose.dev.yml --env-file ../.env logs keikichi_backend | grep "Payment Deadline"
```

---

## 📊 Ver Logs en Tiempo Real

```bash
cd infra
docker compose -f docker-compose.dev.yml --env-file ../.env logs -f keikichi_backend
```

Verás:
- `[Startup] Upload directories initialized`
- `[Startup] Scheduled tasks initialized`
- `[Hold Expiration Task] ...` (cada 5 min)
- `[Payment Deadline Task] ...` (cada hora)

---

## 🎨 Frontend

Abre http://localhost:5173

**Estado actual:**
- ✅ Login/Registro funcionando
- ✅ Listado de viajes funcionando
- ⚠️ Sistema de reservaciones NO tiene UI todavía (solo backend)

**Pendiente:** Componentes React para el flujo de reservación (puedo implementarlos si quieres).

---

## ✅ Checklist de Pruebas

- [ ] Backend responde en `/health`
- [ ] Swagger UI accesible en `/docs`
- [ ] Login como admin funciona
- [ ] Crear viaje funciona
- [ ] Registrar cliente funciona
- [ ] Crear hold temporal funciona (10 min)
- [ ] Crear reservación funciona
- [ ] Los espacios cambian a `reserved`
- [ ] Cálculo de precios es correcto (subtotal + impuestos)
- [ ] Subir comprobante funciona
- [ ] Aprobar pago funciona (admin)
- [ ] Se genera ticket PDF automáticamente
- [ ] Descargar ticket PDF funciona
- [ ] El ticket contiene QR code
- [ ] Cancelar reservación funciona
- [ ] Los espacios se liberan al cancelar

---

## 🐛 Si algo no funciona

**Reiniciar backend:**
```bash
cd infra
docker compose -f docker-compose.dev.yml --env-file ../.env restart keikichi_backend
```

**Ver logs:**
```bash
docker compose -f docker-compose.dev.yml --env-file ../.env logs keikichi_backend --tail=50
```

**Verificar servicios:**
```bash
docker compose -f docker-compose.dev.yml --env-file ../.env ps
```

Todos deberían estar "Up" y keikichi_backend_dev debe estar "(healthy)".

--- ¡Todo listo para probar! 🚀
