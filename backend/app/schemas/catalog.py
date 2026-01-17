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


# SavedStop Schemas (Paradas/Tiradas guardadas para autocompletado)
class SavedStopBase(BaseModel):
    name: str  # Nombre identificador (ej: "Bodega Los Angeles", "Centro Distribución Phoenix")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "USA"
    default_contact: Optional[str] = None
    default_phone: Optional[str] = None
    default_schedule: Optional[str] = None  # Horario típico ej: "8:00 AM - 5:00 PM"
    notes: Optional[str] = None
    is_active: bool = True


class SavedStopCreate(SavedStopBase):
    pass


class SavedStopUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    default_contact: Optional[str] = None
    default_phone: Optional[str] = None
    default_schedule: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SavedStop(SavedStopBase):
    id: int
    
    model_config = {"from_attributes": True}
