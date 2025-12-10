#!/bin/bash

# Configuración - LOCAL (Misma red WiFi/LAN)
NAS_USER="galindoasc"
NAS_HOST="192.168.1.211"
NAS_PASS="P0kemonplatino."
NAS_DIR="/volume1/docker/keikichi"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}>>> [LOCAL] Sincronizando cambios locales con Git...${NC}"
git add .
git commit -m "deploy: update from local script"
git push origin main

echo -e "${BLUE}>>> [LOCAL] Conectando al NAS (${NAS_HOST})...${NC}"

# Usar sshpass para autenticación robusta
export SSHPASS="$NAS_PASS"
echo -e "${GREEN}>>> Ejecutando comandos en NAS...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no "$NAS_USER@$NAS_HOST" \
"cd $NAS_DIR && echo '>>> Pulling changes...' && git pull && chmod +x deploy.sh && ./deploy.sh deploy"


echo -e "${GREEN}>>> ¡Despliegue LOCAL completado!${NC}"
