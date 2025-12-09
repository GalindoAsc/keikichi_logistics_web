from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class LabelPriceBase(BaseModel):
    dimensions: str
    price: float = Field(..., gt=0)
    description: Optional[str] = None


class LabelPriceCreate(LabelPriceBase):
    pass


class LabelPriceUpdate(BaseModel):
    dimensions: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None


class LabelPriceOut(LabelPriceBase):
    id: UUID

    model_config = {"from_attributes": True}
