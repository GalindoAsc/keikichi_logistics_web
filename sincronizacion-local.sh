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

# Usar expect para manejar la contraseña automáticamente
/usr/bin/expect <<EOF
set timeout -1
spawn ssh -t $NAS_USER@$NAS_HOST "cd $NAS_DIR && echo '>>> Pulling latest changes...' && git pull && echo '>>> Executing deploy script...' && chmod +x deploy.sh && ./deploy.sh deploy"
expect {
  "yes/no" { send "yes\r"; exp_continue }
  "assword:" { send "$NAS_PASS\r" }
}
expect eof
EOF

echo -e "${GREEN}>>> ¡Despliegue LOCAL completado!${NC}"
