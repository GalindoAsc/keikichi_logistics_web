# 🧪 Guía de Pruebas - Sistema de Reservaciones

## ✅ Verificación Inicial

**1. Verifica que todos los servicios estén corriendo:**

```bash
cd infra
docker compose -f docker-compose.dev.yml ps
```

Deberías ver 3 contenedores con estado `Up`:
- `keikichi_db_dev` (healthy)
- `keikichi_backend_dev` (healthy)
- `keikichi_frontend_dev` (running)

**2. Verifica que el backend responde:**

```bash
curl http://localhost:8000/health
```

Debería responder:
```json
{
  "status": "healthy",
  "environment": "development"
}
```

---

## 📋 Pruebas con Swagger UI

### Paso 1: Acceder a Swagger UI

Abre en tu navegador: **http://localhost:8000/docs**

Verás la documentación interactiva de la API con los nuevos endpoints de reservaciones.

### Paso 2: Autenticarse

**A. Crear un usuario cliente:**

1. Encuentra el endpoint `POST /api/v1/auth/register`
2. Click en "Try it out"
3. Ingresa:
```json
{
  "email": "cliente@test.com",
  "password": "Test123!",
  "full_name": "Cliente de Prueba",
  "phone": "5512345678"
}
```
4. Click "Execute"
5. Deberías recibir un token de acceso

**B. Autenticarte con el token:**

1. Click en el botón **"Authorize"** (arriba a la derecha)
2. Ingresa: `Bearer <tu_access_token>`
3. Click "Authorize"

Ahora todas las peticiones irán autenticadas.

---

## 🎯 Pruebas del Sistema de Reservaciones

### Prerequisito: Crear un Viaje

Primero necesitas crear un viaje con espacios disponibles.

**1. Login como Admin:**

```bash
POST /api/v1/auth/login
{
  "email": "admin@keikichi.local",
  "password": "Admin123!ChangeMe"
}
```

**2. Crear Viaje:**

```bash
POST /api/v1/trips
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

Guarda el `trip_id` de la respuesta.

---

### Test 1: Crear Hold Temporal 🔒

**Endpoint:** `POST /api/v1/reservations/hold`

**Request:**
```json
{
  "trip_id": "<trip_id_del_viaje>",
  "space_ids": [
    "<space_id_1>",
    "<space_id_2>",
    "<space_id_3>"
  ]
}
```

**Respuesta esperada:**
```json
{
  "message": "Espacios reservados temporalmente",
  "trip_id": "...",
  "space_ids": ["...", "...", "..."],
  "spaces_count": 3,
  "hold_expires_at": "2025-11-28T13:50:00",
  "expires_in_minutes": 10
}
```

✅ **Verifica:**
- Los espacios cambian de estado a `on_hold`
- Tienes 10 minutos para completar la reservación
- Si esperas más de 10 minutos, la tarea programada libera los espacios automáticamente

---

### Test 2: Crear Reservación 📝

**Endpoint:** `POST /api/v1/reservations`

**Request:**
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

**Respuesta esperada:**
```json
{
  "id": "<reservation_id>",
  "status": "pending",
  "payment_status": "unpaid",
  "payment_method": "bank_transfer",
  "subtotal": 1500.00,
  "tax_amount": 240.00,
  "total_amount": 1740.00,
  ...
}
```

✅ **Verifica:**
- La reservación se crea con estado `pending`
- Los espacios cambian de `on_hold` a `reserved`
- Los totales se calculan correctamente (subtotal + impuestos)
- Guarda el `reservation_id`

---

### Test 3: Listar Reservaciones 📋

**Endpoint:** `GET /api/v1/reservations`

**Parameters:**
- `page`: 1
- `page_size`: 20
- `status`: (opcional) pending, confirmed, cancelled
- `payment_status`: (opcional) unpaid, pending_review, paid

**Respuesta esperada:**
```json
{
  "items": [
    {
      "id": "...",
      "trip_id": "...",
      "status": "pending",
      "payment_status": "unpaid",
      "total_amount": 1740.00,
      "spaces_count": 3,
      "created_at": "2025-11-28T13:45:00",
      "trip_origin": "CDMX",
      "trip_destination": "Monterrey"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```

---

### Test 4: Ver Detalle de Reservación 🔍

**Endpoint:** `GET /api/v1/reservations/{reservation_id}`

**Respuesta esperada:**
```json
{
  "id": "...",
  "status": "pending",
  "payment_status": "unpaid",
  "spaces": [
    {"id": "...", "space_number": 1, "price": 500.00},
    {"id": "...", "space_number": 2, "price": 500.00},
    {"id": "...", "space_number": 3, "price": 500.00}
  ],
  "trip": {
    "origin": "CDMX",
    "destination": "Monterrey",
    "departure_date": "2025-12-15",
    ...
  },
  "cargo_type": "Electrónicos",
  "cargo_description": "Laptops y tablets...",
  ...
}
```

---

### Test 5: Subir Comprobante de Pago 📤

**Endpoint:** `POST /api/v1/reservations/{reservation_id}/payment-proof`

**Request:**
- Type: `multipart/form-data`
- Field `file`: Selecciona una imagen (JPG/PNG) o PDF

**Respuesta esperada:**
```json
{
  "message": "Comprobante de pago subido exitosamente",
  "reservation_id": "...",
  "payment_status": "pending_review",
  "payment_proof_path": "payments/abc-123.jpg"
}
```

✅ **Verifica:**
- El archivo se guarda en `uploads/payments/`
- El estado de pago cambia a `pending_review`
- La reservación ahora espera aprobación del admin

---

### Test 6: Aprobar Pago (Admin/Manager) ✅

**Endpoint:** `POST /api/v1/reservations/{reservation_id}/confirm-payment`

**Importante:** Debes autenticarte como admin/manager primero.

**Request:**
```json
{
  "approved": true,
  "notes": "Pago verificado - BBVA transferencia"
}
```

**Respuesta esperada:**
```json
{
  "message": "Pago aprobado exitosamente",
  "reservation_id": "...",
  "payment_status": "paid",
  "ticket_pdf_path": "tickets/ticket_<reservation_id>.pdf"
}
```

✅ **Verifica:**
- Estado cambia a `payment_status: paid`
- Estado de reservación cambia a `confirmed`
- Se genera automáticamente un ticket PDF con QR code
- El ticket se guarda en `uploads/tickets/`

---

### Test 7: Descargar Ticket PDF 📄

**Endpoint:** `GET /api/v1/reservations/{reservation_id}/ticket`

**Resultado:**
- Se descarga un PDF con:
  - Información del viaje
  - Espacios reservados (números)
  - Desglose de pagos
  - QR code con ID de reservación
  - Términos y condiciones

---

### Test 8: Cancelar Reservación 🚫

**Endpoint:** `DELETE /api/v1/reservations/{reservation_id}`

**Respuesta:** 204 No Content

✅ **Verifica:**
- La reservación cambia a estado `cancelled`
- Los espacios vuelven a `available`
- Puedes verificar con `GET /api/v1/spaces?trip_id=<trip_id>`

---

## 🔄 Pruebas de Tareas Programadas

### Test 9: Expiración Automática de Holds

**Escenario:**
1. Crea un hold temporal (Test 1)
2. **NO** crees la reservación
3. Espera 11 minutos
4. Consulta los espacios del viaje: `GET /api/v1/spaces?trip_id=<trip_id>`

**Resultado esperado:**
- Los espacios vuelven a estado `available`
- El campo `held_by` y `hold_expires_at` son `null`

**¿Por qué?** La tarea programada `release_expired_holds` corre cada 5 minutos y libera holds vencidos.

---

### Test 10: Cancelación por Falta de Pago

**Escenario:**
1. Crea una reservación (Test 2)
2. **NO** subas comprobante de pago
3. El viaje tiene `payment_deadline_hours: 24`
4. Espera 25+ horas (o modifica el viaje para tener `payment_deadline_hours: 0`)

**Resultado esperado:**
- La reservación cambia automáticamente a `cancelled`
- Los espacios se liberan a `available`

**¿Por qué?** La tarea programada `cancel_unpaid_reservations` corre cada hora y cancela reservaciones sin pago.

---

## 🎨 Pruebas del Frontend (Si aplica)

Como el frontend aún está en desarrollo, por ahora puedes:

1. Abrir http://localhost:5173
2. Hacer login/registro (funcionalidad existente)
3. Los hooks y API client están listos para usar

---

## 📊 Verificación de Logs

**Ver logs del backend:**
```bash
cd infra
docker compose -f docker-compose.dev.yml logs -f keikichi_backend
```

**Buscar logs de tareas programadas:**
```
[Hold Expiration Task] ...
[Payment Deadline Task] ...
[Startup] Scheduled tasks initialized
```

---

## ✅ Checklist de Pruebas

- [ ] Backend responde en `/health`
- [ ] Swagger UI accesible en `/docs`
- [ ] Puedes autenticarte como admin
- [ ] Puedes crear un viaje con espacios
- [ ] Puedes crear un hold temporal
- [ ] El hold expira después de 10 minutos
- [ ] Puedes crear una reservación
- [ ] Los espacios cambian a `reserved`
- [ ] Puedes subir comprobante de pago
- [ ] El admin puede aprobar/rechazar pagos
- [ ] Se genera ticket PDF automáticamente
- [ ] Puedes descargar el ticket PDF
- [ ] Puedes cancelar una reservación
- [ ] Los espacios se liberan al cancelar
- [ ] Las tareas programadas aparecen en logs

---

## 🐛 Solución de Problemas

**Error de conexión a DB:**
- Verifica que el archivo `.env` exista
- Reinicia el backend: `docker compose -f docker-compose.dev.yml restart keikichi_backend`

**El hold no expira:**
- Verifica logs: `docker compose -f docker-compose.dev.yml logs keikichi_backend`
- Deberías ver: `[Hold Expiration Task] ...` cada 5 minutos

**No se genera el PDF:**
- Verifica que las librerías estén instaladas:
  ```bash
  docker compose -f docker-compose.dev.yml exec keikichi_backend pip list | grep reportlab
  ```
- Verifica que la carpeta `uploads/tickets` exista

**No puedes subir archivos:**
- Verifica que la carpeta `uploads/payments` exista
- Verifica los permisos: `ls -la uploads/`

---

## 📝 Notas Importantes

1. **Holds de 10 minutos**: Configurable en `.env` con `SPACE_HOLD_MINUTES=10`
2. **Pago en efectivo**: Ahora es "en bodega, depósito en OXXO o banco"
3. **Métodos de pago**: cash, bank_transfer, mercadopago (mercadopago es stub)
4. **Todos los métodos requieren comprobante** excepto si pagas en bodega directamente

---

¡Listo para probar! 🚀
