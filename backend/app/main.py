"""
Keikichi Logistics - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Crear app FastAPI
app = FastAPI(
    title="Keikichi Logistics API",
    description="API para gestión de transporte logístico",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Keikichi Logistics API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@app.get("/api/v1/info")
async def api_info():
    """API information endpoint"""
    return {
        "api_version": "v1",
        "modules": {
            "infrastructure": "✅ Completado",
            "database": "⏳ Pendiente",
            "authentication": "⏳ Pendiente",
            "trips": "⏳ Pendiente",
            "spaces": "⏳ Pendiente",
            "reservations": "⏳ Pendiente",
            "payments": "⏳ Pendiente",
            "documents": "⏳ Pendiente",
            "messages": "⏳ Pendiente",
            "admin": "⏳ Pendiente",
            "websockets": "⏳ Pendiente",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
