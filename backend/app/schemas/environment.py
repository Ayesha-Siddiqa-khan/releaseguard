import uuid
from datetime import datetime
from pydantic import BaseModel

from app.core.constants import VALID_ENVIRONMENTS


class EnvironmentStatusResponse(BaseModel):
    id: uuid.UUID
    environment: str
    frontend_status: str
    backend_status: str
    database_status: str
    current_version: str
    last_checked_at: datetime

    model_config = {"from_attributes": True}


class EnvironmentStatusUpdate(BaseModel):
    frontend_status: str | None = None
    backend_status: str | None = None
    database_status: str | None = None
    current_version: str | None = None
