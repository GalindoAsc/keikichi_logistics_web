from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.catalog import Product, Unit
from app.schemas.catalog import ProductCreate, ProductUpdate, UnitCreate, UnitUpdate

class CatalogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Products
    async def list_products(self, skip: int = 0, limit: int = 100) -> List[Product]:
        result = await self.db.execute(select(Product).order_by(Product.name_es.asc()).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create_product(self, payload: ProductCreate) -> Product:
        product = Product(**payload.model_dump())
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def get_product(self, product_id: int) -> Optional[Product]:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalars().first()

    async def update_product(self, product_id: int, payload: ProductUpdate) -> Optional[Product]:
        product = await self.get_product(product_id)
        if not product:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product_id: int) -> Optional[Product]:
        product = await self.get_product(product_id)
        if not product:
            return None
        await self.db.delete(product)
        await self.db.commit()
        return product

    # Units
    async def list_units(self, skip: int = 0, limit: int = 100) -> List[Unit]:
        result = await self.db.execute(select(Unit).order_by(Unit.name.asc()).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create_unit(self, payload: UnitCreate) -> Unit:
        unit = Unit(**payload.model_dump())
        self.db.add(unit)
        await self.db.commit()
        await self.db.refresh(unit)
        return unit

    async def get_unit(self, unit_id: int) -> Optional[Unit]:
        result = await self.db.execute(select(Unit).where(Unit.id == unit_id))
        return result.scalars().first()

    async def update_unit(self, unit_id: int, payload: UnitUpdate) -> Optional[Unit]:
        unit = await self.get_unit(unit_id)
        if not unit:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(unit, field, value)
        await self.db.commit()
        await self.db.refresh(unit)
        return unit

    async def delete_unit(self, unit_id: int) -> Optional[Unit]:
        unit = await self.get_unit(unit_id)
        if not unit:
            return None
        await self.db.delete(unit)
        await self.db.commit()
        return unit
