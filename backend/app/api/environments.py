from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.environment_status import EnvironmentStatus
from app.schemas.environment import EnvironmentStatusResponse, EnvironmentStatusUpdate

router = APIRouter()


@router.get("/environments", response_model=list[EnvironmentStatusResponse])
async def list_environments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnvironmentStatus).order_by(EnvironmentStatus.environment))
    environments = result.scalars().all()
    return [EnvironmentStatusResponse.model_validate(e) for e in environments]


@router.get("/environments/{environment}", response_model=EnvironmentStatusResponse)
async def get_environment(
    environment: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EnvironmentStatus).where(EnvironmentStatus.environment == environment)
    )
    env_status = result.scalar_one_or_none()
    if not env_status:
        raise HTTPException(status_code=404, detail="Environment not found")
    return EnvironmentStatusResponse.model_validate(env_status)


@router.patch("/environments/{environment}", response_model=EnvironmentStatusResponse)
async def update_environment(
    environment: str,
    update: EnvironmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EnvironmentStatus).where(EnvironmentStatus.environment == environment)
    )
    env_status = result.scalar_one_or_none()
    if not env_status:
        raise HTTPException(status_code=404, detail="Environment not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(env_status, field, value)

    await db.commit()
    await db.refresh(env_status)
    return EnvironmentStatusResponse.model_validate(env_status)
