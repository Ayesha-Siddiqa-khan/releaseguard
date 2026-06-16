import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.constants import VALID_ROLLBACK_STATUSES


class RollbackLogCreate(BaseModel):
    deployment_id: uuid.UUID
    previous_version: str = Field(..., min_length=1, max_length=100)
    target_version: str = Field(..., min_length=1, max_length=100)
    reason: str = Field(..., min_length=1)
    logged_by: str = Field("system", max_length=255)
    status: str = Field("pending", pattern=f"^({'|'.join(VALID_ROLLBACK_STATUSES)})$")


class RollbackLogResponse(BaseModel):
    id: uuid.UUID
    deployment_id: uuid.UUID
    previous_version: str
    target_version: str
    reason: str
    logged_by: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RollbackLogListResponse(BaseModel):
    rollback_logs: list[RollbackLogResponse]
    total: int
