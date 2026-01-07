#!/bin/bash

# --- CONFIGURACIÓN DEL N5 PRO ---
# 1. Tu usuario de Windows (el que usas para entrar al PC)
REMOTE_USER="Daniel" 
# 2. La IP de Tailscale del N5 (Esa no cambia nunca)
REMOTE_HOST="100.106.83.19"
# 3. La carpeta donde pusiste el proyecto en el N5
# Nota: Usa barras normales '/' aunque sea Windows para evitar problemas con SSH
REMOTE_DIR="C:/Proyectos/Keikichi"

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

# COMANDO MAGICO:
# 1. Entra al N5
# 2. Va a la carpeta
# 3. Descarga lo nuevo de GitHub
# 4. Reconstruye los contenedores (esto adapta todo al chip Ryzen AI 9)
ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" \
"cd $REMOTE_DIR && git pull && docker-compose up -d --build"

echo -e "${GREEN}>>> ¡Despliegue en N5 Pro completado con éxito! 🚀${NC}"