from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.schemas.catalog import Product, ProductCreate, ProductUpdate, Unit, UnitCreate, UnitUpdate
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
