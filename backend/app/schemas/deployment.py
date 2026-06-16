import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.constants import VALID_ENVIRONMENTS, VALID_DEPLOYMENT_STATUSES


class DeploymentCreate(BaseModel):
    app_name: str = Field(..., min_length=1, max_length=255)
    environment: str = Field(..., pattern=f"^({'|'.join(VALID_ENVIRONMENTS)})$")
    status: str = Field(..., pattern=f"^({'|'.join(VALID_DEPLOYMENT_STATUSES)})$")
    commit_sha: str | None = Field(None, max_length=40)
    branch: str | None = Field(None, max_length=255)
    github_run_id: str | None = Field(None, max_length=100)
    triggered_by: str = Field("manual", max_length=255)
    release_note: str | None = None
    duration_seconds: int | None = Field(None, ge=0)


class DeploymentUpdate(BaseModel):
    status: str | None = Field(None, pattern=f"^({'|'.join(VALID_DEPLOYMENT_STATUSES)})$")
    release_note: str | None = None
    duration_seconds: int | None = Field(None, ge=0)


class DeploymentResponse(BaseModel):
    id: uuid.UUID
    app_name: str
    environment: str
    status: str
    commit_sha: str | None
    branch: str | None
    github_run_id: str | None
    triggered_by: str
    release_note: str | None
    duration_seconds: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeploymentListResponse(BaseModel):
    deployments: list[DeploymentResponse]
    total: int
