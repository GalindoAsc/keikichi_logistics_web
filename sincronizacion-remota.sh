#!/bin/bash

# Configuración - REMOTO (Fuera de casa)
NAS_USER="galindoasc"
NAS_HOST="189.222.209.68"
NAS_PORT="22"
NAS_PASS="P0kemonplatino."
NAS_DIR="/volume1/docker/keikichi"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}>>> [REMOTO] Sincronizando cambios locales con Git...${NC}"
git add .
git commit -m "deploy: update from remote script"
git push origin main

echo -e "${BLUE}>>> [REMOTO] Conectando al NAS (${NAS_HOST})...${NC}"

# Usar sshpass para autenticación robusta
echo -e "${GREEN}>>> Ejecutando comandos en NAS...${NC}"

# Force SSH to only use password authentication and ignore keys
sshpass -p "$NAS_PASS" ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no -o PreferredAuthentications=password,keyboard-interactive -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" \
"cd $NAS_DIR && echo '>>> Pulling changes...' && git pull && chmod +x deploy.sh && ./deploy.sh deploy"


echo -e "${GREEN}>>> ¡Despliegue REMOTO completado!${NC}"
