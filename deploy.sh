#!/bin/bash
# ============================================
# KEIKICHI LOGISTICS - Script de Deploy
# Para Synology DS 224+ con Cloudflare
# ============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} KEIKICHI LOGISTICS - DEPLOY${NC}"
echo -e "${BLUE}========================================${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml no encontrado${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env no encontrado${NC}"
    echo "Copia .env.production.example a .env y configura los valores"
    exit 1
fi

# Verificar certificados SSL
if [ ! -f "nginx/ssl/cloudflare-origin.pem" ]; then
    echo -e "${YELLOW}Advertencia: Certificado SSL no encontrado${NC}"
    echo "Necesitas generar certificados en Cloudflare:"
    echo "1. Ve a Cloudflare Dashboard > SSL/TLS > Origin Server"
    echo "2. Create Certificate"
    echo "3. Guarda el certificado en nginx/ssl/cloudflare-origin.pem"
    echo "4. Guarda la clave en nginx/ssl/cloudflare-origin-key.pem"
    read -p "¿Continuar sin SSL? (solo para pruebas) [y/N]: " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

# Función para backup de base de datos
backup_database() {
    echo -e "${YELLOW}Creando backup de la base de datos...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backups/db_backup_${TIMESTAMP}.sql"
    mkdir -p backups
    
    if docker ps | grep -q keikichi_db_prod; then
        docker exec keikichi_db_prod pg_dump -U keikichi keikichi_prod > "$BACKUP_FILE"
        echo -e "${GREEN}Backup creado: ${BACKUP_FILE}${NC}"
    else
        echo -e "${YELLOW}Base de datos no activa, saltando backup${NC}"
    fi
}

# Función de deploy
deploy() {
    echo -e "${BLUE}Iniciando deploy...${NC}"
    
    # Backup primero (si hay DB existente)
    backup_database
    
    # Pull de imágenes base
    echo -e "${YELLOW}Descargando imágenes base...${NC}"
    docker-compose -f docker-compose.prod.yml pull db nginx
    
    # Build de imágenes
    echo -e "${YELLOW}Construyendo imágenes...${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Detener contenedores antiguos
    echo -e "${YELLOW}Deteniendo contenedores anteriores...${NC}"
    docker-compose -f docker-compose.prod.yml down
    
    # Iniciar nuevos contenedores
    echo -e "${YELLOW}Iniciando nuevos contenedores...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    
    # Esperar a que los servicios estén listos
    echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
    sleep 10
    
    # Verificar salud
    verify_health
}

# Función para verificar salud
verify_health() {
    echo -e "${BLUE}Verificando salud de los servicios...${NC}"
    
    # Verificar backend
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend: Saludable${NC}"
    else
        echo -e "${RED}✗ Backend: No responde${NC}"
        docker-compose -f docker-compose.prod.yml logs backend --tail 20
    fi
    
    # Verificar nginx
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx: Saludable${NC}"
    else
        echo -e "${YELLOW}⚠ Nginx: Verificar configuración${NC}"
    fi
    
    # Mostrar estado de contenedores
    echo ""
    echo -e "${BLUE}Estado de contenedores:${NC}"
    docker-compose -f docker-compose.prod.yml ps
}

# Función para ver logs
logs() {
    SERVICE=${1:-""}
    if [ -z "$SERVICE" ]; then
        docker-compose -f docker-compose.prod.yml logs -f --tail 100
    else
        docker-compose -f docker-compose.prod.yml logs -f --tail 100 "$SERVICE"
    fi
}

# Función para detener
stop() {
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}Servicios detenidos${NC}"
}

# Función para reiniciar
restart() {
    echo -e "${YELLOW}Reiniciando servicios...${NC}"
    docker-compose -f docker-compose.prod.yml restart
    sleep 5
    verify_health
}

# Mostrar ayuda
show_help() {
    echo "Uso: ./deploy.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  deploy    - Desplegar/actualizar la aplicación (default)"
    echo "  stop      - Detener todos los servicios"
    echo "  restart   - Reiniciar todos los servicios"
    echo "  logs      - Ver logs de todos los servicios"
    echo "  logs <s>  - Ver logs de un servicio específico (backend, frontend, db, nginx)"
    echo "  backup    - Crear backup de la base de datos"
    echo "  health    - Verificar salud de los servicios"
    echo "  help      - Mostrar esta ayuda"
}

# Main
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    backup)
        backup_database
        ;;
    health)
        verify_health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Comando desconocido: $1${NC}"
        show_help
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Deploy completado${NC}"
echo -e "${GREEN}========================================${NC}"
