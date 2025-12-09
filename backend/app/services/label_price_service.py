from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, BadRequestException
from app.models.label_price import LabelPrice
from app.schemas.label_price import LabelPriceCreate, LabelPriceUpdate

class LabelPriceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_prices(self) -> List[LabelPrice]:
        result = await self.db.execute(select(LabelPrice).order_by(LabelPrice.dimensions))
        return list(result.scalars().all())

    async def get_price(self, price_id: str) -> LabelPrice:
        result = await self.db.execute(select(LabelPrice).where(LabelPrice.id == price_id))
        price = result.scalars().first()
        if not price:
            raise NotFoundException("Label price not found")
        return price

    async def create_price(self, payload: LabelPriceCreate) -> LabelPrice:
        # Check for duplicate dimensions
        existing = await self.db.execute(select(LabelPrice).where(LabelPrice.dimensions == payload.dimensions))
        if existing.scalars().first():
            raise BadRequestException(f"Price for dimensions '{payload.dimensions}' already exists")

        price = LabelPrice(**payload.model_dump())
        self.db.add(price)
        await self.db.commit()
        await self.db.refresh(price)
        return price

    async def update_price(self, price_id: str, payload: LabelPriceUpdate) -> LabelPrice:
        price = await self.get_price(price_id)
        
        if payload.dimensions and payload.dimensions != price.dimensions:
             # Check for duplicate dimensions if changing
            existing = await self.db.execute(select(LabelPrice).where(LabelPrice.dimensions == payload.dimensions))
            if existing.scalars().first():
                raise BadRequestException(f"Price for dimensions '{payload.dimensions}' already exists")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(price, field, value)
        
        await self.db.commit()
        await self.db.refresh(price)
        return price

    async def delete_price(self, price_id: str) -> None:
        price = await self.get_price(price_id)
        await self.db.delete(price)
        await self.db.commit()
