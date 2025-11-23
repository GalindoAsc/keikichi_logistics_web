from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.space import Space
from app.schemas.space import SpaceResponse, SpaceUpdate

router = APIRouter()


@router.get("/trip/{trip_id}", response_model=List[SpaceResponse])
def get_trip_spaces(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all spaces for a specific trip
    """
    spaces = db.query(Space).filter(Space.trip_id == trip_id).order_by(Space.space_number).all()
    return spaces


@router.put("/{space_id}", response_model=SpaceResponse)
def update_space(
    space_id: str,
    space_in: SpaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """
    Update a space (admin only)
    """
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    update_data = space_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(space, field, value)

    db.commit()
    db.refresh(space)
    return space
