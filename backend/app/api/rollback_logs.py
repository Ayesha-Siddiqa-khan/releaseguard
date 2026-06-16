import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.rollback_log import RollbackLog
from app.schemas.rollback import (
    RollbackLogCreate,
    RollbackLogResponse,
    RollbackLogListResponse,
)

router = APIRouter()


@router.get("/rollback-logs", response_model=RollbackLogListResponse)
async def list_rollback_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(RollbackLog).order_by(RollbackLog.created_at.desc()).offset(offset).limit(limit)
    count_query = select(func.count(RollbackLog.id))

    result = await db.execute(query)
    logs = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return RollbackLogListResponse(
        rollback_logs=[RollbackLogResponse.model_validate(log) for log in logs],
        total=total,
    )


@router.post("/rollback-logs", response_model=RollbackLogResponse, status_code=201)
async def create_rollback_log(
    log: RollbackLogCreate,
    db: AsyncSession = Depends(get_db),
):
    db_log = RollbackLog(**log.model_dump())
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return RollbackLogResponse.model_validate(db_log)


@router.get("/rollback-logs/{log_id}", response_model=RollbackLogResponse)
async def get_rollback_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RollbackLog).where(RollbackLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Rollback log not found")
    return RollbackLogResponse.model_validate(log)
