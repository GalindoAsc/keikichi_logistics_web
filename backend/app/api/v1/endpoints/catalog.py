from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.schemas.catalog import (
    Product, ProductCreate, ProductUpdate, 
    Unit, UnitCreate, UnitUpdate,
    SavedStop, SavedStopCreate, SavedStopUpdate
)
from app.services.catalog_service import CatalogService
from app.models.user import User

router = APIRouter()

def check_admin_access(user: User):
    if user.role not in ["superadmin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

# Products
@router.get("/products", response_model=List[Product])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    service = CatalogService(db)
    return await service.list_products(skip=skip, limit=limit)

@router.post("/products", response_model=Product)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    return await service.create_product(product)

@router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    db_product = await service.update_product(product_id, product)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/products/{product_id}", response_model=Product)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    db_product = await service.delete_product(product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

# Units
@router.get("/units", response_model=List[Unit])
async def read_units(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    service = CatalogService(db)
    return await service.list_units(skip=skip, limit=limit)

@router.post("/units", response_model=Unit)
async def create_unit(
    unit: UnitCreate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    return await service.create_unit(unit)

@router.put("/units/{unit_id}", response_model=Unit)
async def update_unit(
    unit_id: int,
    unit: UnitUpdate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    db_unit = await service.update_unit(unit_id, unit)
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return db_unit

@router.delete("/units/{unit_id}", response_model=Unit)
async def delete_unit(
    unit_id: int,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    check_admin_access(current_user)
    service = CatalogService(db)
    db_unit = await service.delete_unit(unit_id)
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return db_unit


# SavedStops (Paradas/Tiradas guardadas)
@router.get("/stops", response_model=List[SavedStop])
async def read_stops(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Lista las paradas guardadas, con búsqueda opcional por nombre."""
    service = CatalogService(db)
    return await service.list_stops(skip=skip, limit=limit, search=search)


@router.post("/stops", response_model=SavedStop)
async def create_stop(
    stop: SavedStopCreate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Crea una nueva parada guardada. Cualquier usuario autenticado puede crear."""
    service = CatalogService(db)
    return await service.create_stop(stop)


@router.get("/stops/{stop_id}", response_model=SavedStop)
async def read_stop(
    stop_id: int,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Obtiene una parada por ID."""
    service = CatalogService(db)
    db_stop = await service.get_stop(stop_id)
    if not db_stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    return db_stop


@router.put("/stops/{stop_id}", response_model=SavedStop)
async def update_stop(
    stop_id: int,
    stop: SavedStopUpdate,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Actualiza una parada guardada. Solo admins."""
    check_admin_access(current_user)
    service = CatalogService(db)
    db_stop = await service.update_stop(stop_id, stop)
    if not db_stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    return db_stop


@router.delete("/stops/{stop_id}", response_model=SavedStop)
async def delete_stop(
    stop_id: int,
    db: AsyncSession = Depends(deps.get_db_session),
    current_user: User = Depends(deps.get_current_user),
):
    """Elimina una parada guardada. Solo admins."""
    check_admin_access(current_user)
    service = CatalogService(db)
    db_stop = await service.delete_stop(stop_id)
    if not db_stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    return db_stop
