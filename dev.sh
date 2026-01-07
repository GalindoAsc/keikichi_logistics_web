#!/bin/bash
# ============================================
# KEIKICHI LOGISTICS - Desarrollo Local
# Para ejecutar en MacBook con OrbStack/Docker
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

show_help() {
    echo "Uso: ./dev.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  up        Iniciar contenedores de desarrollo (default)"
    echo "  down      Detener contenedores"
    echo "  logs      Ver logs en tiempo real"
    echo "  restart   Reiniciar contenedores"
    echo "  rebuild   Reconstruir y reiniciar"
    echo "  db        Conectar a PostgreSQL"
    echo "  shell     Shell en el backend"
    echo "  help      Mostrar esta ayuda"
}

case "${1:-up}" in
    up)
        echo -e "${BLUE}========================================${NC}"
        echo -e "${BLUE} KEIKICHI - Desarrollo Local${NC}"
        echo -e "${BLUE}========================================${NC}"
        docker compose -f docker-compose.dev.yml up -d --build
        echo ""
        echo -e "${GREEN}✓ Contenedores iniciados${NC}"
        echo -e "${YELLOW}Accesos:${NC}"
        echo "  - Frontend: http://localhost:5173"
        echo "  - Backend:  http://localhost:8000"
        echo "  - API Docs: http://localhost:8000/docs"
        echo ""
        echo -e "${YELLOW}Ver logs: ./dev.sh logs${NC}"
        ;;
    down)
        echo -e "${YELLOW}Deteniendo contenedores...${NC}"
        docker compose -f docker-compose.dev.yml down
        echo -e "${GREEN}✓ Contenedores detenidos${NC}"
        ;;
    logs)
        docker compose -f docker-compose.dev.yml logs -f
        ;;
    restart)
        docker compose -f docker-compose.dev.yml restart
        ;;
    rebuild)
        echo -e "${YELLOW}Reconstruyendo...${NC}"
        docker compose -f docker-compose.dev.yml down
        docker compose -f docker-compose.dev.yml up -d --build
        echo -e "${GREEN}✓ Listo${NC}"
        ;;
    db)
        docker compose -f docker-compose.dev.yml exec db psql -U keikichi -d keikichi_dev
        ;;
    shell)
        docker compose -f docker-compose.dev.yml exec backend bash
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac
