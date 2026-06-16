# ReleaseGuard GitHub Actions Deployment Procedure

A complete step-by-step guide to deploy ReleaseGuard using GitHub Actions, AWS ECR, AWS ECS Fargate, Terraform, and GitHub OIDC.

---

## 1. Deployment Overview

```
Local development
  → Git push to main
  → GitHub Actions CI (tests + build)
  → GitHub Actions Deploy
  → AWS OIDC authentication
  → Docker images built & pushed to ECR
  → ECS Fargate service updated
  → Health check verification
  → Deployment metadata recorded in ReleaseGuard
```

| Step | What Happens |
|------|-------------|
| **GitHub Actions CI** | Runs backend tests, frontend lint/type-check, validates Docker builds |
| **GitHub OIDC** | Authenticates to AWS without long-lived credentials |
| **AWS ECR** | Stores Docker images (backend + frontend) |
| **AWS ECS Fargate** | Runs containers serverlessly with auto-scaling |
| **Health Check** | Verifies the new deployment is serving traffic |
| **Deployment Record** | Posts metadata back to ReleaseGuard via API |

---

## 2. Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] AWS account with appropriate permissions
- [ ] AWS CLI installed and configured locally (`aws configure`)
- [ ] Terraform >= 1.0 installed
- [ ] Docker and Docker Compose installed
- [ ] Git installed
- [ ] Project tests passing locally
- [ ] Selected AWS region (default: `us-east-1`)

---

## 3. Local Verification Before Deployment

Deployment should not start until all local checks pass.

### Start the full stack

```bash
docker compose up --build
```

Verify all three containers are running:
- `releaseguard-db-1` (PostgreSQL) - healthy
- `releaseguard-backend-1` (FastAPI) - running
- `releaseguard-frontend-1` (Next.js) - running

Seed demo data:

```bash
curl -X POST http://localhost:8000/api/seed
```

### Backend tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

Expected: 15/15 tests pass.

### Frontend checks

```bash
cd frontend
npm install
npm run lint
npm run type-check
npm run build
```

Expected: 0 errors, clean build.

### Stop containers

```bash
docker compose down
```

---

## 4. GitHub Repository Setup

### Option A: Create via GitHub MCP (automated)

If GitHub MCP is available, the repository can be created automatically. See the final report for MCP results.

### Option B: Manual setup

```bash
# Initialize git (if not already)
cd E:\github\releaseguard
git init

# Stage all files
git add .

# Create initial commit
git commit -m "feat: ReleaseGuard - DevOps deployment monitoring dashboard"

# Set default branch
git branch -M main

# Add remote (replace with your repository URL)
git remote add origin https://github.com/<YOUR_USERNAME>/releaseguard.git

# Push
git push -u origin main
```

### .gitignore verification

Confirm `.gitignore` excludes:
- `node_modules/`
- `venv/`, `backend/venv/`
- `.env`, `.env.local`, `.env.production`
- `__pycache__/`, `*.pyc`
- `.next/`, `out/`, `dist/`
- `*.tfstate`, `.terraform/`
- `playwright-report/`, `test-results/`
- `*.tsbuildinfo`

---

## 5. AWS Infrastructure Setup with Terraform

### What Terraform creates

| Resource | Purpose |
|----------|---------|
| VPC | Isolated network for all services |
| Public/Private subnets | Frontend in public, database in private |
| NAT Gateway | Outbound internet for private subnets |
| ECR repositories | Docker image storage (backend + frontend) |
| ECS Fargate cluster | Container orchestration |
| ECS services | Backend and frontend task definitions |
| RDS PostgreSQL | Managed database with encryption |
| CloudWatch log groups | Container and application logs |
| Security groups | Network access control |

### Setup commands

```bash
cd infra/terraform

# Format HCL files
terraform fmt

# Initialize (downloads AWS provider)
terraform init

# Validate configuration
terraform validate

# Preview changes (review carefully)
terraform plan -var="db_password=YOUR_SECURE_PASSWORD"
```

> **Cost Warning**: `terraform plan` does not create resources. `terraform apply` WILL create billable AWS resources. Review the plan output before applying. Estimated monthly cost for this project is approximately **$65-75/month** (db.t3.micro RDS, single NAT Gateway, minimal ECS tasks).

### Apply infrastructure

```bash
terraform apply -var="db_password=YOUR_SECURE_PASSWORD"
```

### Capture outputs

After apply, capture the outputs for GitHub Actions configuration:

```bash
terraform output
```

You will need:
- `ecr_backend_url`
- `ecr_frontend_url`
- `ecs_cluster_name`
- `rds_endpoint`

---

## 6. GitHub OIDC Setup for AWS

GitHub Actions authenticates to AWS using OIDC (OpenID Connect), not permanent access keys.

### Create OIDC Identity Provider in AWS

```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
```

### Create IAM Role with trust policy

Create a file `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<YOUR_AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_USERNAME>/releaseguard:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Replace:
- `<YOUR_AWS_ACCOUNT_ID>` with your 12-digit AWS account ID
- `<YOUR_GITHUB_USERNAME>` with your GitHub username

Create the role:

```bash
aws iam create-role \
  --role-name releaseguard-github-actions-role \
  --assume-role-policy-document file://trust-policy.json
```

### Attach policies to the role

```bash
# ECR access
aws iam attach-role-policy \
  --role-name releaseguard-github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

# ECS access
aws iam attach-role-policy \
  --role-name releaseguard-github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
```

### Get the Role ARN

```bash
aws iam get-role --role-name releaseguard-github-actions-role --query 'Role.Arn' --output text
```

The output will look like:
```
arn:aws:iam::123456789012:role/releaseguard-github-actions-role
```

---

## 7. Required GitHub Secrets and Variables

### GitHub Secret

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/releaseguard-github-actions-role` | IAM role ARN for OIDC |

### GitHub Variables

| Variable Name | Default | Description |
|---------------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS deployment region |
| `ECR_REPOSITORY` | `releaseguard` | ECR repository prefix (images: `releaseguard-backend`, `releaseguard-frontend`) |
| `ECS_CLUSTER` | `releaseguard` | ECS cluster name |
| `ECS_SERVICE` | `releaseguard-service` | ECS service name |
| `API_URL` | `http://localhost:8000` | Backend URL for deployment metadata recording |

### How to add in GitHub

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** to add `AWS_ROLE_ARN`
4. Click the **Variables** tab > **New repository variable** to add each variable

---

## 8. GitHub Actions Workflow Explanation

### CI Workflow (`.github/workflows/ci.yml`)

Triggered on: **push to main/develop** and **pull requests to main**

| Job | What It Does |
|-----|-------------|
| `backend-tests` | Installs Python 3.12, runs `pytest tests/ -v` with SQLite (fast, no DB needed) |
| `frontend-lint` | Installs Node.js 20, runs `npm ci`, lint, and TypeScript type-check |
| `docker-build` | Builds both Docker images to verify Dockerfiles work (depends on both test jobs) |

### Deploy Workflow (`.github/workflows/deploy.yml`)

Triggered on: **push to main only**

| Job | What It Does |
|-----|-------------|
| `build-and-push` | Authenticates via OIDC, logs into ECR, builds Docker images, pushes with commit SHA tag and `latest` tag |
| `deploy` | Updates ECS service with `--force-new-deployment`, waits for stability, records deployment metadata via API |

---

## 9. How to Trigger Deployment

### Push to main branch

```bash
git add .
git commit -m "Prepare ReleaseGuard deployment"
git push origin main
```

This triggers both workflows:
1. **CI** runs tests and lint checks
2. **Deploy** builds and pushes Docker images, then deploys to ECS

### Monitor the deployment

1. **GitHub**: Go to repository > **Actions** tab > Click the latest workflow run
2. **AWS Console**: ECS > Cluster > Service > Deployments tab
3. **CloudWatch**: Check logs for the ECS task
4. **ReleaseGuard Dashboard**: Deployment History should show the new deployment

---

## 10. Deployment Verification

After the workflow completes:

### Checklist

- [ ] GitHub Actions workflow shows green checkmarks
- [ ] ECR repositories contain the new images (`releaseguard-backend` and `releaseguard-frontend`)
- [ ] ECS service shows running task count >= 1
- [ ] ECS service deployment shows `PRIMARY` status
- [ ] Backend `/health` endpoint returns `{"status": "healthy", "database": "connected"}`
- [ ] Frontend opens successfully in browser
- [ ] ReleaseGuard dashboard loads and shows data
- [ ] Deployment metadata appears in Deployment History

### Verification commands

```bash
# Check ECR images
aws ecr describe-images --repository-name releaseguard-backend --region us-east-1

# Check ECS service status
aws ecs describe-services --cluster releaseguard --services releaseguard-service

# Health check
curl https://<YOUR_ALB_DNS>/health

# API check
curl https://<YOUR_ALB_DNS>/api/status/summary
```

---

## 11. Seed Demo Data

For local development or demo purposes:

```bash
curl -X POST http://localhost:8000/api/seed
```

Or against your deployed backend:

```bash
curl -X POST https://<YOUR_BACKEND_URL>/api/seed
```

> **Warning**: This is for demo/development only. Do not run on production data you want to keep. The seed endpoint overwrites existing data with demo deployments, environments, and rollback logs.

---

## 12. Troubleshooting

### GitHub Actions cannot assume AWS role

**Error**: `Not authorized to perform sts:AssumeRoleWithWebIdentity`

**Fix**:
- Ensure `AWS_ROLE_ARN` secret is set correctly
- Verify the OIDC provider exists in AWS
- Check the trust policy `sub` field matches `repo:<OWNER>/releaseguard:ref:refs/heads/main`
- Ensure the workflow has `permissions: id-token: write`

### Missing `id-token: write` permission

**Fix**: Add to `deploy.yml`:

```yaml
permissions:
  id-token: write
  contents: read
```

### ECR repository not found

**Error**: `RepositoryNotFoundException`

**Fix**:
- Run `terraform apply` first to create ECR repositories
- Verify `ECR_REPOSITORY` variable matches Terraform's `project_name` (default: `releaseguard`)
- The workflow creates images named `releaseguard-backend` and `releaseguard-frontend`

### ECS service not found

**Error**: `ServiceNotFoundException`

**Fix**:
- Run `terraform apply` first to create ECS cluster and service
- Verify `ECS_CLUSTER` and `ECS_SERVICE` variables match Terraform outputs

### Docker build fails

**Fix**:
- Check Dockerfile syntax in `backend/Dockerfile` and `frontend/Dockerfile`
- Ensure `package-lock.json` exists in `frontend/` (required for `npm ci`)
- Verify all source files are committed

### Frontend cannot reach backend

**Fix**:
- Check ECS task security groups allow traffic between frontend and backend
- Verify the frontend's `NEXT_PUBLIC_API_URL` environment variable points to the correct backend URL
- Check ALB target groups are healthy

### Backend cannot connect to database

**Fix**:
- Verify RDS security group allows traffic from ECS tasks on port 5432
- Check `DATABASE_URL` environment variable uses the RDS endpoint
- Ensure RDS is in a subnet accessible from ECS tasks

### Health check fails

**Fix**:
- Check ECS task logs in CloudWatch
- Verify the `/health` endpoint returns 200
- Ensure the container port (8000 for backend) matches the ECS task definition

### `package-lock.json` missing

**Error**: `npm ERR! code ENOENT` during CI

**Fix**:

```bash
cd frontend
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

---

## 13. Cleanup to Avoid AWS Costs

> **Warning**: Running resources incur AWS charges even when not in use.

### Destroy all infrastructure

```bash
cd infra/terraform
terraform destroy -var="db_password=YOUR_SECURE_PASSWORD"
```

### What gets destroyed

- VPC and all subnets
- ECS cluster and services
- ECR repositories and images
- RDS database instance
- NAT Gateway
- Security groups
- CloudWatch log groups

### Estimated costs if not destroyed

| Resource | Approximate Monthly Cost |
|----------|------------------------|
| RDS db.t3.micro | $15 |
| NAT Gateway | $32 |
| ECS Fargate (minimal) | $10-15 |
| CloudWatch logs | $1-5 |
| ECR storage | $1-2 |
| **Total** | **~$60-70/month** |

---

## 14. Final Resume/GitHub Checklist

- [x] README.md complete with tech stack, setup, architecture
- [x] Screenshots directory created (`docs/screenshots/`)
- [x] GitHub Actions CI badge in README
- [x] Deployment procedure linked from README
- [x] Architecture docs (`docs/architecture.md`)
- [x] CI/CD docs (`docs/ci-cd-flow.md`)
- [x] AWS deployment docs (`docs/aws-deployment.md`)
- [x] Security docs (`docs/security.md`)
- [x] No secrets committed (`.gitignore` covers `.env`, `*.tfstate`, `venv/`, `node_modules/`)
- [x] App tested locally (Docker Compose)
- [x] CI passing (15/15 backend tests, frontend lint clean, type-check clean, build clean)
- [x] Deployment workflow configured (`deploy.yml`)
- [ ] Screenshots captured (after data is visible in the dashboard)
- [ ] GitHub repository created and code pushed
- [ ] Terraform infrastructure applied
- [ ] GitHub OIDC configured
- [ ] GitHub Secrets and Variables added
- [ ] First deployment triggered and verified
