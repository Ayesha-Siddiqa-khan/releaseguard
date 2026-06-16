from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.deployment import Deployment
from app.models.environment_status import EnvironmentStatus
from app.schemas.health import StatusSummaryResponse

router = APIRouter()


@router.get("/status/summary", response_model=StatusSummaryResponse)
async def get_status_summary(db: AsyncSession = Depends(get_db)):
    total_result = await db.execute(select(func.count(Deployment.id)))
    total_deployments = total_result.scalar() or 0

    success_result = await db.execute(
        select(func.count(Deployment.id)).where(Deployment.status == "success")
    )
    successful_deployments = success_result.scalar() or 0

    failed_result = await db.execute(
        select(func.count(Deployment.id)).where(Deployment.status == "failed")
    )
    failed_deployments = failed_result.scalar() or 0

    running_result = await db.execute(
        select(func.count(Deployment.id)).where(Deployment.status == "running")
    )
    running_deployments = running_result.scalar() or 0

    latest_result = await db.execute(
        select(Deployment).order_by(Deployment.created_at.desc()).limit(1)
    )
    latest_deployment = latest_result.scalar_one_or_none()

    prod_result = await db.execute(
        select(EnvironmentStatus).where(EnvironmentStatus.environment == "production")
    )
    prod_env = prod_result.scalar_one_or_none()

    staging_result = await db.execute(
        select(EnvironmentStatus).where(EnvironmentStatus.environment == "staging")
    )
    staging_env = staging_result.scalar_one_or_none()

    envs_result = await db.execute(select(EnvironmentStatus).order_by(EnvironmentStatus.environment))
    envs = envs_result.scalars().all()

    return StatusSummaryResponse(
        total_deployments=total_deployments,
        successful_deployments=successful_deployments,
        failed_deployments=failed_deployments,
        running_deployments=running_deployments,
        latest_deployment={
            "id": str(latest_deployment.id),
            "status": latest_deployment.status,
            "environment": latest_deployment.environment,
            "created_at": latest_deployment.created_at.isoformat(),
        }
        if latest_deployment
        else None,
        current_production_version=prod_env.current_version if prod_env else None,
        current_staging_version=staging_env.current_version if staging_env else None,
        environments=[
            {
                "environment": e.environment,
                "frontend_status": e.frontend_status,
                "backend_status": e.backend_status,
                "database_status": e.database_status,
                "current_version": e.current_version,
                "last_checked_at": e.last_checked_at.isoformat(),
            }
            for e in envs
        ],
    )
