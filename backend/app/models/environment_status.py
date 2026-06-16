import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EnvironmentStatus(Base):
    __tablename__ = "environment_status"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    environment: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    frontend_status: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    backend_status: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    database_status: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    current_version: Mapped[str] = mapped_column(String(100), nullable=False, default="0.0.0")
    last_checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
