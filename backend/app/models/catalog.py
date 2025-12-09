from sqlalchemy import Column, Integer, String, Boolean
from app.models.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name_es = Column(String, unique=True, index=True, nullable=False)
    name_en = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    abbreviation = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
