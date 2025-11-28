"""
Keikichi Logistics - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app import models
from app.config import settings
from app.api.v1.router import router as api_router
from app.database import engine, AsyncSessionLocal

app = FastAPI(
    title="Keikichi Logistics API",
    description="API para gestión de transporte logístico",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.backend_cors_origins] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


@app.get("/")
async def root():
    return {
        "message": "Keikichi Logistics API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
    }
