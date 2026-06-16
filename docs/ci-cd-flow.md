# CI/CD Flow

## Overview

ReleaseGuard uses GitHub Actions for continuous integration and deployment with a secure, modern approach.

| Workflow | File | Purpose |
|----------|------|---------|
| **CI** | `ci.yml` | Run tests, lint, type checks on every push/PR |
| **Deploy** | `deploy.yml` | Build images and deploy to Kubernetes on push to `main` |

---

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

---

## Deploy Workflow (`deploy.yml`)

Triggers on push to `main` only. Builds and deploys both backend and frontend together.

### How It Works

```
Push to main
  → Build backend Docker image
  → Build frontend Docker image
  → Push both to ECR (same repo, SHA tags)
  → Decode KUBE_CONFIG_B64 into ~/.kube/config
  → kubectl set image (backend + frontend)
  → Wait for rollout status
  → Show pods and services
```

### Jobs

#### 1. Build & Push to ECR
- Authenticates via GitHub OIDC → AWS IAM Role (no static keys)
- Logs into Amazon ECR
- Builds backend image, pushes as `backend-<commit-sha>` (immutable)
- Builds frontend image, pushes as `frontend-<commit-sha>` (immutable)
- **Both images go to the same ECR repository** (e.g., `infra-dev/backend-api`)
- Uses commit SHA tags only — compatible with ECR immutable tags

#### 2. Deploy to Kubernetes
- Decodes `KUBE_CONFIG_B64` secret into `~/.kube/config`
- Verifies cluster access (`kubectl get nodes`)
- Runs `kubectl set image` for both backend and frontend deployments
- Waits for rollout status (300s timeout)
- Shows all pods and services for verification
- Optionally records deployment metadata via `POST /api/deployments` (if `API_URL` is set)

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `KUBE_CONFIG_B64` | Base64-encoded kubeconfig for cluster access |

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `ap-south-1` | AWS region for ECR |
| `ECR_REPOSITORY` | `infra-dev/backend-api` | ECR repository (shared for both images) |
| `K8S_NAMESPACE` | `releaseguard` | Kubernetes namespace |
| `BACKEND_DEPLOYMENT` | `releaseguard-backend` | Backend deployment name |
| `FRONTEND_DEPLOYMENT` | `releaseguard-frontend` | Frontend deployment name |
| `BACKEND_CONTAINER` | `backend` | Backend container name |
| `FRONTEND_CONTAINER` | `frontend` | Frontend container name |
| `API_URL` | _(empty)_ | Optional. Backend URL for metadata recording |

### ECR Image Tags

Both images are pushed to the **same ECR repository** using commit SHA tags (immutable):

| Image | Tag Pattern | Example |
|-------|-------------|---------|
| Backend | `backend-<commit-sha>` | `backend-abc123def456` |
| Frontend | `frontend-<commit-sha>` | `frontend-abc123def456` |

> **Note:** Only commit SHA tags are used. The ECR repository has immutable tags enabled, so `latest` tags are not pushed.

---

## GitHub OIDC Setup

Instead of long-lived AWS access keys, ReleaseGuard uses OIDC federation:

1. Create an IAM OIDC provider for `token.actions.githubusercontent.com`
2. Create an IAM role with trust policy for GitHub Actions
3. Attach policies for ECR push
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

### Required IAM Policy

- `AmazonEC2ContainerRegistryPowerUser` (or custom ECR policy)

---

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
