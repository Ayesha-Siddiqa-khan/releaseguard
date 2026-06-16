from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.deployment import Deployment
from app.models.environment_status import EnvironmentStatus
from app.models.rollback_log import RollbackLog


async def seed_data(db: AsyncSession):
    existing = await db.execute(select(Deployment).limit(1))
    if existing.scalar_one_or_none():
        return

    now = datetime.now(timezone.utc)

    deployments = [
        Deployment(
            app_name="releaseguard",
            environment="production",
            status="success",
            commit_sha="a1b2c3d4e5f6",
            branch="main",
            github_run_id="100001",
            triggered_by="github-actions",
            release_note="Initial production deployment with dashboard, health checks, and deployment tracking.",
            duration_seconds=142,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=5),
        ),
        Deployment(
            app_name="releaseguard",
            environment="production",
            status="success",
            commit_sha="b2c3d4e5f6a1",
            branch="main",
            github_run_id="100002",
            triggered_by="github-actions",
            release_note="Added rollback logging and environment status panels.",
            duration_seconds=128,
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=3),
        ),
        Deployment(
            app_name="releaseguard",
            environment="staging",
            status="success",
            commit_sha="c3d4e5f6a1b2",
            branch="develop",
            github_run_id="100003",
            triggered_by="github-actions",
            release_note="Staging deployment for UI polish and API validation.",
            duration_seconds=95,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2),
        ),
        Deployment(
            app_name="releaseguard",
            environment="staging",
            status="failed",
            commit_sha="d4e5f6a1b2c3",
            branch="feature/new-widget",
            github_run_id="100004",
            triggered_by="github-actions",
            release_note="Failed due to database migration conflict.",
            duration_seconds=67,
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
        ),
        Deployment(
            app_name="releaseguard",
            environment="production",
            status="running",
            commit_sha="e5f6a1b2c3d4",
            branch="main",
            github_run_id="100005",
            triggered_by="github-actions",
            release_note="Deploying updated health monitoring and chart visualizations.",
            duration_seconds=None,
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=2),
        ),
        Deployment(
            app_name="releaseguard",
            environment="development",
            status="success",
            commit_sha="f6a1b2c3d4e5",
            branch="feature/api-v2",
            github_run_id="100006",
            triggered_by="manual",
            release_note="Dev environment setup for API v2 exploration.",
            duration_seconds=45,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=6),
        ),
        Deployment(
            app_name="releaseguard",
            environment="staging",
            status="success",
            commit_sha="a1b2c3d4e5f7",
            branch="develop",
            github_run_id="100007",
            triggered_by="github-actions",
            release_note="Staging updated with security patches and CORS fixes.",
            duration_seconds=110,
            created_at=now - timedelta(hours=12),
            updated_at=now - timedelta(hours=12),
        ),
    ]

    db.add_all(deployments)
    await db.flush()

    prod_deployment = deployments[1]
    rollback_logs = [
        RollbackLog(
            deployment_id=prod_deployment.id,
            previous_version="v1.0.0",
            target_version="v0.9.5",
            reason="Database connection pool exhaustion in production after v1.0.0 release.",
            logged_by="ops-engineer",
            status="completed",
            created_at=now - timedelta(days=4),
        ),
        RollbackLog(
            deployment_id=deployments[3].id,
            previous_version="v0.9.5",
            target_version="v0.9.4",
            reason="Migration conflict prevented staging from reaching healthy state.",
            logged_by="ci-pipeline",
            status="completed",
            created_at=now - timedelta(days=1),
        ),
    ]
    db.add_all(rollback_logs)

    env_statuses = [
        EnvironmentStatus(
            environment="production",
            frontend_status="healthy",
            backend_status="healthy",
            database_status="healthy",
            current_version="v1.0.1",
            last_checked_at=now,
        ),
        EnvironmentStatus(
            environment="staging",
            frontend_status="healthy",
            backend_status="degraded",
            database_status="healthy",
            current_version="v1.1.0-rc.2",
            last_checked_at=now - timedelta(minutes=5),
        ),
        EnvironmentStatus(
            environment="development",
            frontend_status="unknown",
            backend_status="healthy",
            database_status="healthy",
            current_version="v1.2.0-dev",
            last_checked_at=now - timedelta(minutes=30),
        ),
    ]
    db.add_all(env_statuses)

    await db.commit()
