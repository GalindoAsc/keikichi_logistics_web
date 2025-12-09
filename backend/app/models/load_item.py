import uuid
from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, JSON, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class LoadItem(Base):
    __tablename__ = "load_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reservation_id = Column(UUID(as_uuid=True), ForeignKey("reservations.id"), nullable=False)
    space_id = Column(UUID(as_uuid=True), ForeignKey("spaces.id"), nullable=True)
    
    product_name = Column(String(100), nullable=False)
    box_count = Column(Integer, nullable=False)
    total_weight = Column(Float, nullable=False)
    weight_unit = Column(String, default="kg")
    packaging_type = Column(String, nullable=True)
    
    # Labeling
    labeling_required = Column(Boolean, default=False)
    label_quantity = Column(Integer, nullable=True)
    label_dimensions = Column(String(50), nullable=True)
    label_file_id = Column(UUID(as_uuid=True), ForeignKey("client_documents.id"), nullable=True)
    
    # JSON field for flexible add-ons (labels, insurance, pickup, etc.)
    services = Column(JSON, default=dict)
    
    reservation = relationship("Reservation", back_populates="items")
