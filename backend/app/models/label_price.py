import uuid
from sqlalchemy import Column, String, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class LabelPrice(Base):
    __tablename__ = "label_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dimensions = Column(String, unique=True, nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
