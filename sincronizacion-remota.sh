#!/bin/bash

# Configuración - REMOTO (Fuera de casa)
NAS_USER="galindoasc"
NAS_HOST="189.222.209.68"
NAS_PORT="22"
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
echo -e "${GREEN}>>> Ejecutando comandos en NAS...${NC}"

# Usar SSH estándar con llave (sin contraseña)
ssh -p "$NAS_PORT" -o StrictHostKeyChecking=no "$NAS_USER@$NAS_HOST" \
"cd $NAS_DIR && echo '>>> Pulling changes...' && git pull && chmod +x deploy.sh && ./deploy.sh deploy"

echo -e "${GREEN}>>> ¡Despliegue REMOTO completado!${NC}"
