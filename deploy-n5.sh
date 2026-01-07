#!/bin/bash
set -e  # Exit on any error

# ============================================
# KEIKICHI LOGISTICS - Deploy to N5 Pro
# MacBook → GitHub → N5 Pro (Windows 11 + Docker)
# ============================================

# --- CONFIGURACIÓN DEL N5 PRO ---
REMOTE_USER="dgali"
# IP de Tailscale del N5 (fija)
REMOTE_HOST="100.106.83.19"
# Carpeta en el N5 (usar '/' para SSH aunque sea Windows)
REMOTE_DIR="/d/Projectos/keikichi_logistics_web"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} DEPLOY: Mac → GitHub → N5 Pro${NC}"
echo -e "${BLUE}========================================${NC}"

# --- PASO 1: Subir a GitHub ---
echo -e "${BLUE}>>> [MAC] Guardando y subiendo cambios a GitHub...${NC}"

# Verificar si hay cambios
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}No hay cambios para commitear${NC}"
else
    git add .
    git commit -m "deploy: update from Mac $(date '+%Y-%m-%d %H:%M')" || true
fi

# Push con la rama actual (main o la que sea)
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Pushing to ${CURRENT_BRANCH}...${NC}"
git push origin "$CURRENT_BRANCH"

# --- PASO 2: Deploy en N5 ---
echo -e "${BLUE}>>> [N5 PRO] Conectando vía Tailscale a ${REMOTE_HOST}...${NC}"

# Verificar conexión primero
if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Conexión OK'"; then
    echo -e "${RED}Error: No se puede conectar al N5 Pro${NC}"
    echo -e "${YELLOW}Verifica que:${NC}"
    echo "  1. Tailscale está activo en el N5"
    echo "  2. SSH está habilitado en Windows"
    echo "  3. La IP ${REMOTE_HOST} es correcta"
    exit 1
fi

echo -e "${GREEN}>>> Actualizando código y reconstruyendo contenedores...${NC}"

# Comando remoto - PowerShell syntax (Windows SSH usa PowerShell por defecto)
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "
cd D:\\Projectos\\keikichi_logistics_web

Write-Host '>>> Actualizando desde GitHub...'
git fetch --all
git reset --hard origin/main
git clean -fd

Write-Host '>>> Reconstruyendo contenedores Docker...'
docker compose -f docker-compose.n5.yml down
docker compose -f docker-compose.n5.yml up -d --build

Write-Host '>>> Verificando estado...'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}>>> ¡Despliegue en N5 Pro completado! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Acceso (una vez enlazado a DNS):${NC}"
echo "  - Frontend: https://keikichi.com"
echo "  - Backend:  https://keikichi.com/api/v1"
echo "  - API Docs: https://keikichi.com/docs"