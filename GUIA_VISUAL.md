# 🎯 Guía VISUAL - Prueba del Sistema de Reservaciones

Esta guía te muestra **exactamente** dónde hacer click en Swagger UI para probar el sistema completo de reservaciones.

---

## 📍 Paso 0: Abrir Swagger UI

1. Abre tu navegador
2. Ve a: **http://localhost:8000/docs**
3. Verás una interfaz como esta:

![Swagger UI Principal](/Users/galindoasc/.gemini/antigravity/brain/d5db2551-f503-467c-9ea4-36a7a4f541c2/swagger_top_1764367063110.png)

---

## 🔐 Paso 1: Login como Administrador

### 1.1. Busca la sección "auth"

Scroll hasta encontrar la sección **`auth`** (está cerca del inicio).

### 1.2. Haz click en `POST /api/v1/auth/login`

Verás algo como esto:

![Login Endpoint](/Users/galindoasc/.gemini/antigravity/brain/d5db2551-f503-467c-9ea4-36a7a4f541c2/swagger_login_expanded_1764367080995.png)

### 1.3. Haz click en "Try it out"

Es un botón azul a la derecha.

### 1.4. Modifica el JSON del Request body

Borra el contenido y pega esto:

```json
{
  "email": "admin@keikichi.com",
  "password": "Admin123!"
}
```

### 1.5. Haz click en "Execute"

Es un botón azul grande.

### 1.6. GUARDA el access_token

En la respuesta (más abajo), verás algo como:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  ...
}
```

**COPIA EL TEXTO COMPLETO DEL `access_token`** (es muy largo).

---

## 🔑 Paso 2: Autorizar las Peticiones

### 2.1. Busca el botón "Authorize"

Está arriba a la derecha, es un botón verde con un candado.

### 2.2. Haz click en "Authorize"

Se abrirá un popup.

### 2.3. En el campo "Value" pega

```
Bearer <tu_access_token_copiado>
```

**IMPORTANTE:** Escribe `Bearer` (con mayúscula), luego un espacio, luego pega tu token.

Ejemplo:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4. Haz click en "Authorize"

Luego click en "Close".

✅ **Ahora todas tus peticiones irán autenticadas.**

---

## 🚗 Paso 3: Crear un Viaje

### 3.1. Scroll hasta la sección "trips"

### 3.2. Haz click en `POST /api/v1/trips`

### 3.3. Haz click en "Try it out"

### 3.4. Borra el JSON y pega esto:

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

### 3.5. Haz click en "Execute"

### 3.6. GUARDA el "id" del viaje

En la respuesta, busca el campo `"id"`:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  ...
}
```

**COPIA ESTE ID** - lo necesitarás después.

---

## 👤 Paso 4: Crear un Cliente

### 4.1. Scroll de nuevo a la sección "auth"

### 4.2. Haz click en `POST /api/v1/auth/register`

### 4.3. Haz click en "Try it out"

### 4.4. Pega este JSON:

```json
{
  "email": "cliente@test.com",
  "password": "Test123!",
  "full_name": "Cliente de Prueba",
  "phone": "5512345678"
}
```

### 4.5. Haz click en "Execute"

### 4.6. GUARDA el nuevo access_token

**REPITE el Paso 2** (Autorizar) pero con este NUEVO token del cliente.

---

## 🔒 Paso 5: Ver los Espacios del Viaje

### 5.1. Scroll a la sección "spaces"

### 5.2. Haz click en `GET /api/v1/spaces`

### 5.3. Haz click en "Try it out"

### 5.4. En el campo "trip_id" pega el ID del viaje (del Paso 3.6)

### 5.5. Haz click en "Execute"

### 5.6. GUARDA los IDs de 2-3 espacios

En la respuesta verás una lista de espacios. Copia los `"id"` de 2 o 3 espacios que tengan `"status": "available"`.

Ejemplo:
```json
[
  {
    "id": "space-id-1",
    "space_number": 1,
    "status": "available",
    ...
  },
  {
    "id": "space-id-2",
    "space_number": 2,
    "status": "available",
    ...
  }
]
```

---

## ⏱️ Paso 6: Crear Hold Temporal (10 minutos)

### 6.1. Scroll hasta la sección "reservations"

Verás algo como esto:

![Sección Reservations](/Users/galindoasc/.gemini/antigravity/brain/d5db2551-f503-467c-9ea4-36a7a4f541c2/swagger_reservations_1764367071702.png)

### 6.2. Haz click en `POST /api/v1/reservations/hold`

### 6.3. Haz click en "Try it out"

### 6.4. Pega este JSON (reemplaza con TUS IDs):

```json
{
  "trip_id": "TU_TRIP_ID_AQUI",
  "space_ids": [
    "SPACE_ID_1",
    "SPACE_ID_2",
    "SPACE_ID_3"
  ]
}
```

### 6.5. Haz click en "Execute"

### 6.6. Verifica la respuesta

Deberías ver:

```json
{
  "message": "Espacios reservados temporalmente",
  "hold_expires_at": "2025-11-28T14:10:00",
  "expires_in_minutes": 10,
  ...
}
```

✅ **Los espacios están en hold por 10 minutos.**

---

## 📝 Paso 7: Crear Reservación

**IMPORTANTE:** Esto debe hacerse ANTES de que expire el hold (10 minutos).

### 7.1. En la misma sección "reservations"

### 7.2. Haz click en `POST /api/v1/reservations`

### 7.3. Haz click en "Try it out"

### 7.4. Pega este JSON (reemplaza con TUS IDs):

```json
{
  "trip_id": "TU_TRIP_ID_AQUI",
  "space_ids": ["SPACE_ID_1", "SPACE_ID_2", "SPACE_ID_3"],
  "payment_method": "bank_transfer",
  "cargo_type": "Electrónicos",
  "cargo_description": "Laptops y tablets en cajas protectoras",
  "cargo_weight": 150.5,
  "cargo_value": 25000.00,
  "requires_invoice": true
}
```

### 7.5. Haz click en "Execute"

### 7.6. GUARDA el ID de la reservación

En la respuesta:

```json
{
  "id": "reservation-id-123",
  "status": "pending",
  "payment_status": "unpaid",
  "total_amount": 1740.00,
  ...
}
```

**COPIA EL `"id"`** de la reservación.

**Verifica:**
- `status` debe ser `"pending"`
- `payment_status` debe ser `"unpaid"`
- `total_amount` debe ser `1740.00` (500 x 3 + 16% IVA)

---

## 📤 Paso 8: Subir Comprobante de Pago

### 8.1. Haz click en `POST /api/v1/reservations/{reservation_id}/payment-proof`

### 8.2. Haz click en "Try it out"

### 8.3. En "reservation_id" pega el ID de tu reservación

### 8.4. En "file" haz click en "Choose File"

Selecciona **cualquier imagen** (JPG, PNG) o PDF de tu computadora.

### 8.5. Haz click en "Execute"

### 8.6. Verifica la respuesta

```json
{
  "message": "Comprobante de pago subido exitosamente",
  "payment_status": "pending_review",
  ...
}
```

✅ **El comprobante se subió. Ahora necesita aprobación del admin.**

---

## ✅ Paso 9: Aprobar el Pago (como Admin)

**IMPORTANTE:** Debes volver a autenticarte como admin.

### 9.1. Vuelve al Paso 1 (Login)

Pero esta vez usa:
```json
{
  "email": "admin@keikichi.local",
  "password": "Admin123!ChangeMe"
}
```

### 9.2. Actualiza la autorización con el token del admin

(Repite el Paso 2 con el nuevo token).

### 9.3. Haz click en `POST /api/v1/reservations/{reservation_id}/confirm-payment`

### 9.4. Haz click en "Try it out"

### 9.5. En "reservation_id" pega el ID de la reservación

### 9.6. Pega este JSON:

```json
{
  "approved": true,
  "notes": "Pago verificado - Transferencia BBVA"
}
```

### 9.7. Haz click en "Execute"

### 9.8. Verifica la respuesta

```json
{
  "message": "Pago aprobado exitosamente",
  "payment_status": "paid",
  "ticket_pdf_path": "tickets/ticket_reservation-id-123.pdf"
}
```

✅ **El pago está aprobado y se generó automáticamente un ticket PDF.**

---

## 📄 Paso 10: Descargar el Ticket PDF

### 10.1. Haz click en `GET /api/v1/reservations/{reservation_id}/ticket`

### 10.2. Haz click en "Try it out"

### 10.3. En "reservation_id" pega el ID de tu reservación

### 10.4. Haz click en "Execute"

### 10.5. Haz click en "Download file"

Aparece un botón azul que dice "Download file".

✅ **Se descargará un PDF con:**
- Información del viaje
- Espacios reservados
- Desglose de pagos
- QR code con el ID de la reservación
- Términos y condiciones

---

## 🎉 ¡Prueba Completada!

Has probado el flujo completo:
1. ✅ Login como admin
2. ✅ Crear viaje
3. ✅ Crear cliente
4. ✅ Ver espacios disponibles
5. ✅ Crear hold temporal (10 min)
6. ✅ Crear reservación
7. ✅ Subir comprobante de pago
8. ✅ Aprobar pago (admin)
9. ✅ Descargar ticket PDF

---

## 🔍 Otros Endpoints para Explorar

En la sección **reservations** también puedes probar:

- `GET /api/v1/reservations` - Ver todas las reservaciones
- `GET /api/v1/reservations/{id}` - Ver detalle de una reservación
- `PATCH /api/v1/reservations/{id}` - Modificar reservación (solo si está `pending`)
- `DELETE /api/v1/reservations/{id}` - Cancelar reservación

---

## ❓ ¿Tuviste algún problema?

Si algo no funcionó:

1. **Verifica que estés autenticado** - El botón "Authorize" debe estar con candado cerrado
2. **Usa los IDs correctos** - Copia y pega los IDs exactos de las respuestas
3. **Revisa los errores** - Si hay error, Swagger muestra el mensaje en rojo
4. **Reinicia el backend** si es necesario:
   ```bash
   cd infra
   docker compose -f docker-compose.dev.yml --env-file ../.env restart keikichi_backend
   ```

---

🚀 **¡Ya sabes cómo usar Swagger UI para probar el sistema de reservaciones!**
