from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.system_config import SystemConfig

router = APIRouter()

class SystemConfigBase(BaseModel):
    key: str
    value: str
    value_type: str = "string"
    description: str | None = None

class SystemConfigCreate(SystemConfigBase):
    pass

class SystemConfigUpdate(BaseModel):
    value: str

from uuid import UUID

class SystemConfigResponse(SystemConfigBase):
    id: Any
    
    model_config = {"from_attributes": True}

@router.get("/", response_model=List[SystemConfigResponse])
async def get_all_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(SystemConfig))
    return result.scalars().all()

@router.get("/{key}", response_model=SystemConfigResponse)
async def get_config_by_key(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.put("/{key}", response_model=SystemConfigResponse)
async def update_config(
    key: str,
    config_in: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["superadmin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    config = result.scalar_one_or_none()
    
    if not config:
        # Create if not exists
        config = SystemConfig(
            key=key,
            value=config_in.value,
            value_type="string", # Default, can be updated later if needed
            updated_by=current_user.id
        )
        db.add(config)
    else:
        config.value = config_in.value
        config.updated_by = current_user.id
        
    await db.commit()
    await db.refresh(config)
    return config
