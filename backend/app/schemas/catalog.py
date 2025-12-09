from pydantic import BaseModel
from typing import Optional


# Product Schemas
class ProductBase(BaseModel):
    name_es: str
    name_en: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    name_es: Optional[str] = None
    is_active: Optional[bool] = None


class Product(ProductBase):
    id: int
    
    model_config = {"from_attributes": True}


# Unit Schemas
class UnitBase(BaseModel):
    name: str
    abbreviation: Optional[str] = None
    is_active: bool = True


class UnitCreate(UnitBase):
    pass


class UnitUpdate(UnitBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class Unit(UnitBase):
    id: int
    
    model_config = {"from_attributes": True}
