#!/bin/bash

echo "======================================"
echo "  Keikichi Logistics - Quick Start"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Copy environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "🚀 Starting Keikichi Logistics with Docker Compose..."
echo ""

# Build and start containers
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "======================================"
echo "  ✅ Keikichi Logistics is running!"
echo "======================================"
echo ""
echo "📱 Application:  http://localhost"
echo "📚 API Docs:     http://localhost/api/docs"
echo "📖 ReDoc:        http://localhost/api/redoc"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs:        docker-compose logs -f"
echo "   - Stop services:    docker-compose down"
echo "   - Restart services: docker-compose restart"
echo ""
echo "👤 Create your first admin user:"
echo "   curl -X POST 'http://localhost/api/auth/register' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"admin@keikichi.com\", \"password\": \"admin123\", \"full_name\": \"Admin\", \"role\": \"SuperAdmin\"}'"
echo ""
echo "======================================"
