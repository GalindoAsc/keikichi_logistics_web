from sqlalchemy import Column, Integer, String, Boolean, Text
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


class SavedStop(Base):
    """
    Catálogo de paradas/tiradas guardadas para autocompletado.
    Se van creando conforme se usan en cotizaciones.
    """
    __tablename__ = "saved_stops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)  # Nombre identificador de la parada
    address = Column(Text, nullable=True)  # Dirección completa
    city = Column(String(100), nullable=True)  # Ciudad
    state = Column(String(100), nullable=True)  # Estado/Provincia
    country = Column(String(50), nullable=True, default="USA")  # País
    default_contact = Column(String(255), nullable=True)  # Contacto por defecto
    default_phone = Column(String(50), nullable=True)  # Teléfono por defecto
    default_schedule = Column(String(100), nullable=True)  # Horario típico ej: "8:00 AM - 5:00 PM"
    notes = Column(Text, nullable=True)  # Notas adicionales
    is_active = Column(Boolean, default=True)
