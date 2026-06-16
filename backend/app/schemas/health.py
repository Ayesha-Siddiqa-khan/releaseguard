from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
    version: str
    timestamp: datetime


class StatusSummaryResponse(BaseModel):
    total_deployments: int
    successful_deployments: int
    failed_deployments: int
    running_deployments: int
    latest_deployment: dict | None
    current_production_version: str | None
    current_staging_version: str | None
    environments: list[dict]
