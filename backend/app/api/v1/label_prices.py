from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db_session
from app.core.permissions import require_superadmin, require_active_user
from app.schemas.label_price import LabelPriceCreate, LabelPriceOut, LabelPriceUpdate
from app.services.label_price_service import LabelPriceService

router = APIRouter()

@router.get("/", response_model=List[LabelPriceOut])
async def list_label_prices(
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(require_active_user)
):
    service = LabelPriceService(db)
    return await service.list_prices()

@router.post("/", response_model=LabelPriceOut)
async def create_label_price(
    payload: LabelPriceCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(require_superadmin)
):
    service = LabelPriceService(db)
    return await service.create_price(payload)

@router.patch("/{price_id}", response_model=LabelPriceOut)
async def update_label_price(
    price_id: str,
    payload: LabelPriceUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(require_superadmin)
):
    service = LabelPriceService(db)
    return await service.update_price(price_id, payload)

@router.delete("/{price_id}")
async def delete_label_price(
    price_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user = Depends(require_superadmin)
):
    service = LabelPriceService(db)
    await service.delete_price(price_id)
    return {"message": "Price deleted successfully"}
