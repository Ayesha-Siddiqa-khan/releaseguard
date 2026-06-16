# ReleaseGuard

**DevOps Deployment Monitoring Dashboard**

[![CI](https://github.com/yourusername/releaseguard/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/releaseguard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A production-style DevOps dashboard for tracking deployments, monitoring service health, and documenting rollback decisions.

**Live Demo:** [https://releaseguard.example.com](https://releaseguard.example.com)

---

## What This Project Demonstrates

Built and deployed ReleaseGuard, a production-style DevOps dashboard using Next.js, FastAPI, PostgreSQL, Docker, GitHub Actions, AWS ECR/ECS, and Terraform-ready infrastructure to track deployments, monitor service health, and document rollback decisions.

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
- **AWS Ready** — Terraform infrastructure for ECR, ECS Fargate, and RDS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Lucide Icons |
| Backend | FastAPI, Python 3.12, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS ECR, ECS Fargate, RDS |
| IaC | Terraform |
| E2E Testing | Playwright |

## Architecture

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

### Continuous Integration

On every push and pull request:
1. Backend tests run with pytest (SQLite for fast isolation)
2. Frontend lint and TypeScript type checks
3. Docker build validation

### Continuous Deployment

On push to `main`:
1. Docker images built and tagged with commit SHA
2. Images pushed to AWS ECR
3. ECS service updated with new task definition
4. Health check verification
5. Deployment metadata recorded via API

See [docs/ci-cd-flow.md](docs/ci-cd-flow.md) for detailed setup.

## AWS Deployment

See [docs/aws-deployment.md](docs/aws-deployment.md) for full guide.

See [docs/github-actions-deployment-procedure.md](docs/github-actions-deployment-procedure.md) for the complete step-by-step deployment procedure covering Terraform, GitHub OIDC, ECR, ECS, and CI/CD pipeline setup.

**Quick version:**

```bash
# Set up infrastructure
cd infra/terraform
terraform apply -var="db_password=YOUR_PASSWORD"

# Configure GitHub secrets (AWS_ROLE_ARN)
# Push to main to trigger deployment
```

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |

**Required GitHub Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `ECR_REPOSITORY` | `releaseguard` | ECR repository prefix |
| `ECS_CLUSTER` | `releaseguard` | ECS cluster name |
| `ECS_SERVICE` | `releaseguard-service` | ECS service name |

## Security

- No hardcoded secrets or AWS credentials
- GitHub OIDC for AWS authentication (no long-lived keys)
- Input validation on all API endpoints via Pydantic
- CORS configured for frontend origin only
- Database in private subnet with encryption at rest
- ECR image scanning enabled

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
└── docs/                  # Documentation
```

## Interview Talking Points

- **Full-stack architecture**: Decoupled frontend/backend with clear API contracts
- **Database design**: UUID primary keys, proper indexing, async SQLAlchemy
- **API design**: RESTful with Pydantic validation, filtering, pagination
- **Docker**: Multi-stage builds, health checks, service orchestration
- **CI/CD**: GitHub Actions with parallel jobs, Docker build validation
- **AWS**: ECR + ECS Fargate with OIDC authentication (no static keys)
- **IaC**: Terraform with VPC, ECS, RDS, CloudWatch
- **Security**: Input validation, CORS, encryption, no hardcoded secrets
- **Observability**: Health endpoints, structured logging, status tracking

## Resume Bullet

> Built and deployed ReleaseGuard, a production-style DevOps dashboard using Next.js, FastAPI, PostgreSQL, Docker, GitHub Actions, AWS ECR/ECS, and Terraform-ready infrastructure to track deployments, monitor service health, and document rollback decisions.

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
