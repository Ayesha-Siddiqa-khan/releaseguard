import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.deployment import Deployment
from app.schemas.deployment import (
    DeploymentCreate,
    DeploymentUpdate,
    DeploymentResponse,
    DeploymentListResponse,
)

router = APIRouter()


@router.get("/deployments", response_model=DeploymentListResponse)
async def list_deployments(
    environment: str | None = Query(None),
    status: str | None = Query(None),
    branch: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Deployment)
    count_query = select(func.count(Deployment.id))

    if environment:
        query = query.where(Deployment.environment == environment)
        count_query = count_query.where(Deployment.environment == environment)
    if status:
        query = query.where(Deployment.status == status)
        count_query = count_query.where(Deployment.status == status)
    if branch:
        query = query.where(Deployment.branch == branch)
        count_query = count_query.where(Deployment.branch == branch)

    query = query.order_by(Deployment.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    deployments = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return DeploymentListResponse(
        deployments=[DeploymentResponse.model_validate(d) for d in deployments],
        total=total,
    )


@router.post("/deployments", response_model=DeploymentResponse, status_code=201)
async def create_deployment(
    deployment: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
):
    db_deployment = Deployment(**deployment.model_dump())
    db.add(db_deployment)
    await db.commit()
    await db.refresh(db_deployment)
    return DeploymentResponse.model_validate(db_deployment)


@router.get("/deployments/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return DeploymentResponse.model_validate(deployment)


@router.patch("/deployments/{deployment_id}", response_model=DeploymentResponse)
async def update_deployment(
    deployment_id: uuid.UUID,
    update: DeploymentUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Deployment).where(Deployment.id == deployment_id))
    deployment = result.scalar_one_or_none()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deployment, field, value)
    deployment.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(deployment)
    return DeploymentResponse.model_validate(deployment)
