# ReleaseGuard

**DevOps Deployment Monitoring Dashboard**

[![CI](https://github.com/yourusername/releaseguard/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/releaseguard/actions/workflows/ci.yml)
[![Deploy](https://github.com/yourusername/releaseguard/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/releaseguard/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A production-style DevOps dashboard for tracking deployments, monitoring service health, and documenting rollback decisions.

---

## What This Project Demonstrates

Built and deployed ReleaseGuard, a production-style DevOps dashboard using Next.js, FastAPI, PostgreSQL, Docker, GitHub Actions, AWS ECR, and a self-managed Kubernetes cluster to track deployments, monitor service health, and document rollback decisions.

---

## Why This Project Exists

In modern DevOps workflows, teams need visibility into what was deployed, when, by whom, and whether services are healthy. ReleaseGuard answers these questions through a unified command center that aggregates deployment metadata, environment health, and rollback decisions into a single, actionable view.

---

## Features

- **Command Center Dashboard** — Real-time overview with success rates, version tracking, and health indicators
- **Deployment History** — Filterable table with environment, status, branch, commit, and duration tracking
- **Deployment Details** — Deep-dive view with source info, release notes, and timeline
- **Health Monitoring** — Backend and database health checks with status indicators
- **Environment Status** — Monitor staging, production, and development environments with per-service health
- **Rollback Logging** — Document rollback decisions with version tracking (logging-only, no destructive automation)
- **CI/CD Integration** — GitHub Actions workflows for testing and deployment
- **AWS ECR** — Docker image storage with GitHub OIDC authentication (no static keys)
- **Kubernetes** — Self-managed cluster deployment via kubectl

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Lucide Icons |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS ECR |
| Deploy | Self-managed Kubernetes (via SSH + kubectl) |
| E2E Testing | Playwright |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Frontend    │────▶│     Backend     │────▶│    PostgreSQL   │
│    (Next.js)    │     │    (FastAPI)    │     │                 │
│   Port 3000     │     │   Port 8000     │     │   Port 5432     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   Docker Compose          SQLAlchemy
   Rewrites /api/*        Async ORM
```

## Local Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/releaseguard.git
cd releaseguard

# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build

# Seed the database with demo data
curl -X POST http://localhost:8000/api/seed

# Open the dashboard
open http://localhost:3000
```

### Manual Setup

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/status/summary` | Dashboard summary data |
| GET | `/api/deployments` | List deployments (filterable) |
| POST | `/api/deployments` | Create deployment record |
| GET | `/api/deployments/{id}` | Get deployment details |
| PATCH | `/api/deployments/{id}` | Update deployment |
| GET | `/api/environments` | List environment statuses |
| POST | `/api/rollback-logs` | Create rollback log |
| GET | `/api/rollback-logs` | List rollback logs |
| POST | `/api/seed` | Seed database with demo data |

## Testing

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

### Frontend Lint & Type Check

```bash
cd frontend
npm install
npm run lint
npm run type-check
```

### E2E Tests (Playwright)

```bash
cd frontend
npm install
npx playwright install chromium
npx playwright test
```

## CI/CD Workflow

### Two Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **CI** | `ci.yml` | Push to `main`/`develop`, PRs to `main` | Run tests, lint, type checks |
| **Deploy** | `deploy.yml` | Push to `main` | Build images and deploy to Kubernetes |

### Continuous Integration (`ci.yml`)

On every push and pull request:
1. Backend tests run with pytest (SQLite for fast isolation)
2. Frontend lint and TypeScript type checks
3. Docker build validation

### Continuous Deployment (`deploy.yml`)

On push to `main`:
1. Builds backend Docker image
2. Builds frontend Docker image
3. Pushes both to **the same ECR repository** using different tags
4. SSHs into Kubernetes control-plane
5. Updates both deployments via `kubectl set image`
6. Waits for rollout status
7. Shows pods and services for verification
8. Optionally records deployment metadata (if `API_URL` is set)

### ECR Image Tags

Both images share one ECR repository with tag prefixes:

| Image | Tags |
|-------|------|
| Backend | `backend-<commit-sha>`, `backend-latest` |
| Frontend | `frontend-<commit-sha>`, `frontend-latest` |

See [docs/ci-cd-flow.md](docs/ci-cd-flow.md) for detailed setup.

## Deployment

See [docs/github-actions-deployment-procedure.md](docs/github-actions-deployment-procedure.md) for the complete step-by-step deployment procedure.

**Quick version:**

```bash
# 1. Ensure your ECR repository exists
aws ecr describe-repositories --repository-names infra-dev/backend-api

# 2. Apply Kubernetes manifests (first time only)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl create secret generic releaseguard-secrets \
  --namespace releaseguard \
  --from-literal=database-url='postgresql+asyncpg://...'

# 3. Push to main to trigger deployment
git push origin main
```

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `K8S_SSH_HOST` | SSH hostname of the Kubernetes control-plane |
| `K8S_SSH_USER` | SSH username for the control-plane node |
| `K8S_SSH_PRIVATE_KEY` | SSH private key for authentication |

**Required GitHub Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `ap-south-1` | AWS region for ECR |
| `ECR_REPOSITORY` | `infra-dev/backend-api` | ECR repository (shared for both images) |
| `K8S_NAMESPACE` | `releaseguard` | Kubernetes namespace |
| `BACKEND_DEPLOYMENT` | `releaseguard-backend` | Backend deployment name |
| `FRONTEND_DEPLOYMENT` | `releaseguard-frontend` | Frontend deployment name |
| `BACKEND_CONTAINER` | `backend` | Backend container name |
| `FRONTEND_CONTAINER` | `frontend` | Frontend container name |
| `API_URL` | _(empty)_ | Optional. Backend URL for deployment metadata recording |

## Security

- No hardcoded secrets or AWS credentials
- GitHub OIDC for AWS authentication (no long-lived keys)
- Input validation on all API endpoints via Pydantic
- CORS configured for frontend origin only
- ECR image scanning enabled
- Kubernetes secrets for sensitive configuration

See [docs/security.md](docs/security.md) for details.

## Project Structure

```
releaseguard/
├── frontend/              # Next.js application
│   ├── app/               # App router pages
│   │   ├── page.tsx       # Dashboard
│   │   ├── deployments/   # Deployment history & detail
│   │   ├── environments/  # Environment status
│   │   ├── rollback/      # Rollback log
│   │   └── settings/      # Settings page
│   ├── components/        # Reusable UI components
│   ├── e2e/               # Playwright tests
│   ├── lib/               # Utilities and API client
│   └── types/             # TypeScript definitions
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── core/          # Config and constants
│   │   └── db/            # Database session and seed
│   └── tests/             # Backend tests
├── infra/terraform/       # AWS infrastructure
├── .github/workflows/     # CI/CD pipelines
│   ├── ci.yml             # Tests and checks
│   └── deploy.yml         # Kubernetes deployment
└── docs/                  # Documentation
```

## Interview Talking Points

- **Full-stack architecture**: Decoupled frontend/backend with clear API contracts
- **Database design**: UUID primary keys, proper indexing, async SQLAlchemy
- **API design**: RESTful with Pydantic validation, filtering, pagination
- **Docker**: Multi-stage builds, health checks, service orchestration
- **CI/CD**: GitHub Actions with parallel jobs, Docker build validation
- **Cloud**: AWS ECR for image registry, GitHub OIDC for authentication (no static keys)
- **Kubernetes**: Self-managed cluster deployment via kubectl, rolling updates, readiness probes
- **Security**: Input validation, CORS, no hardcoded secrets, ECR image scanning

## Resume Bullet

> Built and deployed ReleaseGuard, a production-style DevOps dashboard using Next.js, FastAPI, PostgreSQL, Docker, GitHub Actions, AWS ECR, and self-managed Kubernetes to track deployments, monitor service health, and document rollback decisions.

## Known Limitations

- No real-time WebSocket updates (polling-based architecture)
- No user authentication (designed as an internal tool)
- Rollback is logging-only (no destructive automation by design)
- No HTTPS in local development (use reverse proxy for production)

## Future Improvements

- WebSocket support for real-time deployment updates
- JWT authentication with role-based access
- GitHub webhook integration for automatic deployment recording
- Deployment comparison view (before/after)
- Slack/Teams notification integration
- Cost monitoring dashboard
- Playwright visual regression testing

## License

MIT
