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

# Usar expect para manejar la contraseña automáticamente
/usr/bin/expect <<EOF
set timeout -1
spawn ssh -p $NAS_PORT -t $NAS_USER@$NAS_HOST "cd $NAS_DIR && echo '>>> Pulling latest changes...' && git pull && echo '>>> Executing deploy script...' && chmod +x deploy.sh && ./deploy.sh deploy"
expect {
  "yes/no" { send "yes\r"; exp_continue }
  "assword:" { send "$NAS_PASS\r" }
}
expect eof
EOF

echo -e "${GREEN}>>> ¡Despliegue REMOTO completado!${NC}"
