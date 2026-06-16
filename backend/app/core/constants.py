from enum import Enum


class Environment(str, Enum):
    STAGING = "staging"
    PRODUCTION = "production"
    DEVELOPMENT = "development"


class DeploymentStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RUNNING = "running"
    CANCELLED = "cancelled"
    ROLLBACK_LOGGED = "rollback_logged"


class RollbackStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


VALID_ENVIRONMENTS = [e.value for e in Environment]
VALID_DEPLOYMENT_STATUSES = [s.value for s in DeploymentStatus]
VALID_ROLLBACK_STATUSES = [s.value for s in RollbackStatus]
