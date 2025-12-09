#!/bin/bash
# ==========================================
# KEIKICHI LOGISTICS - Test Script
# ==========================================
# Este script prueba que la infraestructura funciona correctamente

set -e

echo "🚀 Keikichi Logistics - Test de Infraestructura"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de verificación
check_step() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        exit 1
    fi
}

# 1. Verificar que Docker está instalado
echo "1️⃣  Verificando Docker..."
docker --version > /dev/null 2>&1
check_step "Docker está instalado"

docker compose version > /dev/null 2>&1
check_step "Docker Compose está instalado"
echo ""

# 2. Verificar archivos de configuración
echo "2️⃣  Verificando archivos de configuración..."
test -f .env
check_step "Archivo .env existe"

test -f infra/docker-compose.dev.yml
check_step "docker-compose.dev.yml existe"

test -f backend/Dockerfile.dev
check_step "Backend Dockerfile existe"

test -f frontend/Dockerfile.dev
check_step "Frontend Dockerfile existe"
echo ""

# 3. Iniciar servicios
echo "3️⃣  Iniciando servicios Docker Compose..."
cd infra
docker compose -f docker-compose.dev.yml up -d --build
check_step "Servicios iniciados"
echo ""

# 4. Esperar a que los servicios estén listos
echo "4️⃣  Esperando a que los servicios estén listos..."
echo -e "${YELLOW}Esto puede tomar 30-60 segundos en la primera ejecución...${NC}"
sleep 10

# Esperar a PostgreSQL
echo "   Esperando PostgreSQL..."
for i in {1..30}; do
    docker compose -f docker-compose.dev.yml exec -T keikichi_db pg_isready -U keikichi > /dev/null 2>&1 && break
    sleep 2
    echo -n "."
done
echo ""
check_step "PostgreSQL está listo"

# Esperar a Backend
echo "   Esperando Backend..."
for i in {1..30}; do
    curl -sf http://localhost:8000/health > /dev/null 2>&1 && break
    sleep 2
    echo -n "."
done
echo ""
check_step "Backend está respondiendo"

# Esperar a Frontend
echo "   Esperando Frontend..."
for i in {1..30}; do
    curl -sf http://localhost:5173 > /dev/null 2>&1 && break
    sleep 2
    echo -n "."
done
echo ""
check_step "Frontend está respondiendo"
echo ""

# 5. Probar endpoints
echo "5️⃣  Probando endpoints..."

# Backend health
HEALTH=$(curl -s http://localhost:8000/health | grep -o '"status":"healthy"')
test -n "$HEALTH"
check_step "Backend /health responde correctamente"

# Backend root
ROOT=$(curl -s http://localhost:8000/ | grep -o '"status":"running"')
test -n "$ROOT"
check_step "Backend / responde correctamente"

# Backend API info
API_INFO=$(curl -s http://localhost:8000/api/v1/info | grep -o '"api_version":"v1"')
test -n "$API_INFO"
check_step "Backend /api/v1/info responde correctamente"
echo ""

# 6. Verificar logs
echo "6️⃣  Verificando logs de servicios..."
docker compose -f docker-compose.dev.yml logs --tail=100 keikichi_db | grep -q "database system is ready to accept connections"
check_step "PostgreSQL logs OK"

docker compose -f docker-compose.dev.yml logs --tail=100 keikichi_backend | grep -q "Application startup complete"
check_step "Backend logs OK"
echo ""

# 7. Mostrar estado de contenedores
echo "7️⃣  Estado de los contenedores:"
docker compose -f docker-compose.dev.yml ps
echo ""

# 8. Resumen
echo "================================================"
echo -e "${GREEN}✅ ¡Todos los tests pasaron correctamente!${NC}"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   ReDoc:     http://localhost:8000/redoc"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:        docker compose -f infra/docker-compose.dev.yml logs -f"
echo "   Detener:         docker compose -f infra/docker-compose.dev.yml down"
echo "   Reiniciar:       docker compose -f infra/docker-compose.dev.yml restart"
echo ""
echo "✨ La infraestructura está lista para desarrollo!"
echo "================================================"
