# Architecture

## System Overview

ReleaseGuard is a full-stack DevOps dashboard built with a decoupled architecture. The frontend and backend communicate via REST API, with the backend connecting to PostgreSQL for persistent storage.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Frontend    │────▶│     Backend     │────▶│    PostgreSQL   │
│    (Next.js)    │     │    (FastAPI)    │     │      (RDS)      │
│   Port 3000     │     │   Port 8000     │     │   Port 5432     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   Docker Compose          SQLAlchemy
   Rewrites /api/*        Async ORM
```

## Frontend

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom dark theme variables
- **Components:** Custom component library with consistent design tokens
- **State:** Client-side fetching with React hooks
- **Testing:** Playwright for E2E smoke tests

## Backend

- **Framework:** FastAPI (Python 3.12)
- **ORM:** SQLAlchemy 2.0 (async with asyncpg)
- **Validation:** Pydantic v2 with field validators
- **Database:** PostgreSQL 16
- **Architecture:** Router-based with dependency injection for DB sessions

## API Design

RESTful endpoints with consistent response models:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/status/summary` | Dashboard summary |
| GET | `/api/deployments` | List deployments (filterable) |
| POST | `/api/deployments` | Create deployment |
| GET | `/api/deployments/{id}` | Get deployment |
| PATCH | `/api/deployments/{id}` | Update deployment |
| GET | `/api/environments` | List environments |
| POST | `/api/rollback-logs` | Create rollback log |
| GET | `/api/rollback-logs` | List rollback logs |

## Data Flow

1. **Deployment Recording**: GitHub Actions or manual triggers send deployment metadata to `POST /api/deployments`
2. **Dashboard polling**: Frontend fetches `/api/status/summary` for aggregated metrics
3. **Health Monitoring**: `/health` endpoint checks database connectivity and returns service status
4. **Rollback Documentation**: Operators log rollback decisions via `POST /api/rollback-logs`

## Database Schema

### deployments
- `id` (UUID, PK)
- `app_name` (String, indexed)
- `environment` (String, indexed) — staging | production | development
- `status` (String, indexed) — success | failed | running | cancelled | rollback_logged
- `commit_sha` (String, nullable)
- `branch` (String, nullable)
- `github_run_id` (String, nullable)
- `triggered_by` (String)
- `release_note` (Text, nullable)
- `duration_seconds` (Integer, nullable)
- `created_at`, `updated_at` (DateTime with timezone)

### rollback_logs
- `id` (UUID, PK)
- `deployment_id` (UUID, indexed, FK to deployments)
- `previous_version`, `target_version` (String)
- `reason` (Text)
- `logged_by` (String)
- `status` (String) — pending | completed | failed
- `created_at` (DateTime with timezone)

### environment_status
- `id` (UUID, PK)
- `environment` (String, unique, indexed)
- `frontend_status`, `backend_status`, `database_status` (String)
- `current_version` (String)
- `last_checked_at` (DateTime with timezone)

## Security

- CORS configured for frontend origin only
- No secrets in codebase — GitHub Secrets for CI/CD
- GitHub OIDC for AWS authentication
- Input validation on all endpoints via Pydantic
- UUID primary keys (non-enumerable)
