# CI/CD Flow

## Overview

ReleaseGuard uses GitHub Actions for continuous integration and deployment with a secure, modern approach.

## CI Workflow (`ci.yml`)

Triggers on push to `main`/`develop` and pull requests to `main`.

### Jobs

#### 1. Backend Tests
- Sets up Python 3.12
- Installs dependencies from `requirements.txt`
- Runs pytest with SQLite (fast, isolated, no external dependencies)

#### 2. Frontend Lint & Type Check
- Sets up Node.js 20
- Installs dependencies with `npm ci`
- Runs ESLint for code quality
- Runs TypeScript type checking (`tsc --noEmit`)

#### 3. Docker Build
- Depends on both backend and frontend jobs passing
- Builds backend Docker image
- Builds frontend Docker image
- Validates both build successfully (catches Dockerfile issues early)

### Job Dependency Graph

```
backend-tests ─┐
                ├─▶ docker-build
frontend-lint ─┘
```

## Deploy Workflow (`deploy.yml`)

Triggers on push to `main` only.

### Jobs

#### 1. Build & Push to ECR
- Authenticates via GitHub OIDC → AWS IAM Role (no static keys)
- Logs into Amazon ECR
- Builds backend image, tags with commit SHA + `latest`
- Builds frontend image, tags with commit SHA + `latest`
- Pushes both images to ECR

#### 2. Deploy to ECS
- Updates ECS service with `--force-new-deployment`
- Waits for service stability
- Records deployment metadata via `POST /api/deployments`

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `ECR_REPOSITORY` | `releaseguard` | ECR repository prefix |
| `ECS_CLUSTER` | `releaseguard` | ECS cluster name |
| `ECS_SERVICE` | `releaseguard-service` | ECS service name |
| `API_URL` | `http://localhost:8000` | Backend URL for metadata recording |

## GitHub OIDC Setup

Instead of long-lived AWS access keys, ReleaseGuard uses OIDC federation:

1. Create an IAM OIDC provider for `token.actions.githubusercontent.com`
2. Create an IAM role with trust policy for GitHub Actions
3. Attach policies for ECR push and ECS deploy
4. Store the role ARN in GitHub Secrets

### Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
        }
      }
    }
  ]
}
```

### Required IAM Policies

- `AmazonEC2ContainerRegistryPowerUser` (or custom ECR policy)
- `AmazonECS_FullAccess` (or custom ECS policy)

## Local Development

For local development without CI/CD:

```bash
# Backend tests
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v

# Frontend checks
cd frontend
npm install
npm run lint
npm run type-check

# Full stack
docker compose up --build
```
