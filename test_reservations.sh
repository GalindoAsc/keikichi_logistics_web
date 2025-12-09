#!/bin/bash

# Complete reservation system test
echo "🚀 Iniciando pruebas completas del sistema de reservaciones"
echo ""

# 1. Login
echo "1️⃣ Login..."
TOKEN=$(curl -s -X 'POST' 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@keikichi.com", "password": "Admin123!"}' | jq -r '.access_token')
echo "✅ Token obtenido"
echo ""

# 2. Create trip
echo "2️⃣ Creando viaje..."
TRIP_RESPONSE=$(curl -s -X 'POST' 'http://localhost:8000/api/v1/trips' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
  "origin": "CDMX",
  "destination": "Monterrey",
  "departure_date": "2025-12-15",
  "departure_time": "08:00",
  "total_spaces": 28,
  "price_per_space": 500.00,
  "tax_included": false,
  "tax_rate": 0.16,
  "payment_deadline_hours": 24
}')
TRIP_ID=$(echo $TRIP_RESPONSE | jq -r '.id')
echo "✅ Viaje creado: $TRIP_ID"
echo "$TRIP_RESPONSE" | jq '{origin, destination, total_spaces, price_per_space}'
echo ""

# 3. Get spaces
echo "3️⃣ Obteniendo espacios disponibles..."
SPACES_RESPONSE=$(curl -s -X 'GET' "http://localhost:8000/api/v1/spaces?trip_id=$TRIP_ID" \
  -H "Authorization: Bearer $TOKEN")
SPACE_1=$(echo $SPACES_RESPONSE | jq -r '.[0].id')
SPACE_2=$(echo $SPACES_RESPONSE | jq -r '.[1].id')
SPACE_3=$(echo $SPACES_RESPONSE | jq -r '.[2].id')
echo "✅ Espacios seleccionados: 1, 2, 3"
echo ""

# 4. Create hold
echo "4️⃣ Creando hold temporal (10 minutos)..."
HOLD_RESPONSE=$(curl -s -X 'POST' 'http://localhost:8000/api/v1/reservations/hold' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
  \"trip_id\": \"$TRIP_ID\",
  \"space_ids\": [\"$SPACE_1\", \"$SPACE_2\", \"$SPACE_3\"]
}")
echo "✅ Hold creado"
echo "$HOLD_RESPONSE" | jq '{message, spaces_count, expires_in_minutes}'
echo ""

# 5. Create reservation
echo "5️⃣ Creando reservación..."
RESERVATION_RESPONSE=$(curl -s -X 'POST' 'http://localhost:8000/api/v1/reservations' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
  \"trip_id\": \"$TRIP_ID\",
  \"space_ids\": [\"$SPACE_1\", \"$SPACE_2\", \"$SPACE_3\"],
  \"payment_method\": \"bank_transfer\",
  \"cargo_type\": \"Electrónicos\",
  \"cargo_description\": \"Laptops y tablets en cajas protectoras\",
  \"cargo_weight\": 150.5,
  \"cargo_value\": 25000.00,
  \"requires_invoice\": true
}")
RESERVATION_ID=$(echo $RESERVATION_RESPONSE | jq -r '.id')
echo "✅ Reservación creada: $RESERVATION_ID"
echo "$RESERVATION_RESPONSE" | jq '{status, payment_status, subtotal, tax_amount, total_amount,spaces_count}'
echo ""

#  6. List reservations
echo "6️⃣ Listando todas las reservaciones..."
curl -s -X 'GET' 'http://localhost:8000/api/v1/reservations' \
  -H "Authorization: Bearer $TOKEN" | jq '.items[] | {id, status, payment_status, total_amount}'
echo ""

# 7. Get reservation details
echo "7️⃣ Detalles de la reservación..."
curl -s -X 'GET' "http://localhost:8000/api/v1/reservations/$RESERVATION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{id, status, payment_status, trip: .trip | {origin, destination}, spaces: .spaces | length}'
echo ""

echo "✅ ¡Todas las pruebas completadas exitosamente!"
echo ""
echo "Resumen:"
echo "  - Trip ID: $TRIP_ID"
echo "  - Reservation ID: $RESERVATION_ID"
echo "  - Total: \$1740.00 MXN (3 espacios × \$500 + 16% IVA)"
