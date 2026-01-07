#!/bin/bash

# --- CONFIGURACIÓN DEL N5 PRO ---
# 1. Tu usuario de Windows (el que usas para entrar al PC)
REMOTE_USER="dgali" 
# 2. La IP de Tailscale del N5 (Esa no cambia nunca)
REMOTE_HOST="100.106.83.19"
# 3. La carpeta donde pusiste el proyecto en el N5
# Nota: Usa barras normales '/' aunque sea Windows para evitar problemas con SSH
REMOTE_DIR="D:\Projectos\keikichi_logistics_web"

# Colores para que se vea pro
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> [MAC] Guardando y subiendo cambios a GitHub...${NC}"
# Esto asegura que GitHub tenga la última versión antes de que el N5 intente bajarla
git add .
git commit -m "deploy: update from Mac"
git push origin main

echo -e "${BLUE}>>> [N5 PRO] Conectando vía Tailscale...${NC}"
echo -e "${GREEN}>>> Actualizando código y reconstruyendo contenedores...${NC}"

# COMANDO SSH ACTUALIZADO (Modo "Reset Forzado")
# 1. git fetch --all: Descarga info de GitHub pero no toca nada.
# 2. git reset --hard origin/main: Borra cambios locales y fuerza que sea idéntico a GitHub.
# 3. git clean -fd: Borra archivos "basura" que no están en Git (como los de Syncthing).
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" \
"cd $REMOTE_DIR; git fetch --all; git reset --hard origin/main; git clean -fd; docker-compose up -d --build"

echo -e "${GREEN}>>> ¡Despliegue en N5 Pro completado con éxito! 🚀${NC}"