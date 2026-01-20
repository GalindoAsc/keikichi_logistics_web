from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.api.deps import get_db_session
from app.core.permissions import require_manager_or_superadmin
from app.models.fleet import FleetDriver, FleetVehicle
from app.schemas.fleet import (
    FleetDriverCreate, FleetDriverUpdate, FleetDriverOut,
    FleetVehicleCreate, FleetVehicleUpdate, FleetVehicleOut
)

router = APIRouter()

# --- Drivers ---

@router.get("/drivers", response_model=List[FleetDriverOut])
async def list_drivers(
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(require_manager_or_superadmin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """List drivers with pagination"""
    query = select(FleetDriver).order_by(FleetDriver.full_name).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/drivers", response_model=FleetDriverOut)
async def create_driver(payload: FleetDriverCreate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    driver = FleetDriver(**payload.model_dump())
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver

@router.patch("/drivers/{driver_id}", response_model=FleetDriverOut)
async def update_driver(driver_id: UUID, payload: FleetDriverUpdate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    result = await db.execute(select(FleetDriver).where(FleetDriver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, key, value)
    
    await db.commit()
    await db.refresh(driver)
    return driver

@router.delete("/drivers/{driver_id}", status_code=204)
async def delete_driver(driver_id: UUID, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    result = await db.execute(select(FleetDriver).where(FleetDriver.id == driver_id))
    driver = result.scalars().first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    await db.delete(driver)
    await db.commit()

# --- Vehicles ---

@router.get("/vehicles", response_model=List[FleetVehicleOut])
async def list_vehicles(
    db: AsyncSession = Depends(get_db_session),
    current_user=Depends(require_manager_or_superadmin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """List vehicles with pagination"""
    query = select(FleetVehicle).order_by(FleetVehicle.plate).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/vehicles", response_model=FleetVehicleOut)
async def create_vehicle(payload: FleetVehicleCreate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    vehicle = FleetVehicle(**payload.model_dump())
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle

@router.patch("/vehicles/{vehicle_id}", response_model=FleetVehicleOut)
async def update_vehicle(vehicle_id: UUID, payload: FleetVehicleUpdate, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    result = await db.execute(select(FleetVehicle).where(FleetVehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    
    await db.commit()
    await db.refresh(vehicle)
    return vehicle

@router.delete("/vehicles/{vehicle_id}", status_code=204)
async def delete_vehicle(vehicle_id: UUID, db: AsyncSession = Depends(get_db_session), current_user=Depends(require_manager_or_superadmin)):
    result = await db.execute(select(FleetVehicle).where(FleetVehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    await db.delete(vehicle)
    await db.commit()
