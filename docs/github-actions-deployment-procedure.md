# ReleaseGuard Deployment Procedure

A complete step-by-step guide to deploy ReleaseGuard to a self-managed Kubernetes cluster using GitHub Actions and AWS ECR.

---

## 1. Deployment Overview

```
Push to main
  → GitHub Actions: build Docker images
  → Push to ECR (same repo, different tags)
  → SSH into Kubernetes control-plane
  → kubectl set image (backend + frontend)
  → kubectl rollout status (wait for readiness)
  → Pods running and ready
```

| Step | What Happens |
|------|-------------|
| **CI (`ci.yml`)** | Runs tests, lint, and type checks on every push/PR |
| **Deploy (`deploy.yml`)** | Builds images, pushes to ECR, deploys to Kubernetes |
| **OIDC** | Authenticates to AWS without long-lived credentials |
| **SSH + kubectl** | Connects to your K8s cluster and updates deployments |

### What You Need

- One existing ECR repository (e.g., `infra-dev/backend-api`)
- A self-managed Kubernetes cluster with SSH access
- GitHub OIDC configured for AWS

---

## 2. Prerequisites

- [ ] GitHub account
- [ ] AWS account with ECR access
- [ ] Existing ECR repository (e.g., `infra-dev/backend-api`)
- [ ] Self-managed Kubernetes cluster with SSH access
- [ ] `kubectl` installed on the Kubernetes control-plane node
- [ ] Docker and Docker Compose installed locally
- [ ] Git installed
- [ ] Selected AWS region (e.g., `ap-south-1`)
- [ ] Kubernetes namespace created (e.g., `releaseguard`)

---

## 3. Local Verification Before Deployment

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

### Create and push the repository

```bash
cd releaseguard
git add .
git commit -m "feat: ReleaseGuard - DevOps deployment monitoring dashboard"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/releaseguard.git
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

## 5. AWS Setup

### Your ECR repository

You already have one ECR repository for trial use. The workflow uses it for **both** backend and frontend images with different tags:

| Image | Tag |
|-------|-----|
| Backend | `backend-<commit-sha>` |
| Backend | `backend-latest` |
| Frontend | `frontend-<commit-sha>` |
| Frontend | `frontend-latest` |

### Verify your ECR repository exists

```bash
aws ecr describe-repositories --repository-names infra-dev/backend-api --region ap-south-1
```

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

### Attach ECR policy to the role

```bash
aws iam attach-role-policy \
  --role-name releaseguard-github-actions-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
```

### Get the Role ARN

```bash
aws iam get-role --role-name releaseguard-github-actions-role --query 'Role.Arn' --output text
```

Save this ARN — you will need it as `AWS_ROLE_ARN` in GitHub Secrets.

---

## 6. Kubernetes Cluster Setup

### SSH access to control-plane

GitHub Actions connects to your Kubernetes cluster via SSH. You need:

1. A control-plane node with `kubectl` installed and configured
2. SSH access from GitHub Actions to this node
3. The node must have network access to your ECR registry

### Create the Kubernetes namespace

```bash
kubectl create namespace releaseguard
```

### Create Kubernetes deployments

Create a file `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: releaseguard-backend
  namespace: releaseguard
  labels:
    app: releaseguard
    tier: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: releaseguard
      tier: backend
  template:
    metadata:
      labels:
        app: releaseguard
        tier: backend
    spec:
      containers:
        - name: backend
          image: <YOUR_ECR_REGISTRY>/infra-dev/backend-api:backend-latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: releaseguard-secrets
                  key: database-url
            - name: CORS_ORIGINS
              value: '["http://localhost:3000","http://releaseguard-frontend"]'
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 10
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: releaseguard-backend
  namespace: releaseguard
spec:
  selector:
    app: releaseguard
    tier: backend
  ports:
    - port: 8000
      targetPort: 8000
  type: ClusterIP
```

Create a file `k8s/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: releaseguard-frontend
  namespace: releaseguard
  labels:
    app: releaseguard
    tier: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: releaseguard
      tier: frontend
  template:
    metadata:
      labels:
        app: releaseguard
        tier: frontend
    spec:
      containers:
        - name: frontend
          image: <YOUR_ECR_REGISTRY>/infra-dev/backend-api:frontend-latest
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_API_URL
              value: "http://releaseguard-backend:8000"
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: releaseguard-frontend
  namespace: releaseguard
spec:
  selector:
    app: releaseguard
    tier: frontend
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer
```

### Apply the deployments

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

### Create secrets

```bash
kubectl create secret generic releaseguard-secrets \
  --namespace releaseguard \
  --from-literal=database-url='postgresql+asyncpg://releaseguard:releaseguard@postgres-host:5432/releaseguard'
```

---

## 7. Required GitHub Secrets and Variables

### GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `K8S_SSH_HOST` | SSH hostname or IP of the Kubernetes control-plane |
| `K8S_SSH_USER` | SSH username for the control-plane node |
| `K8S_SSH_PRIVATE_KEY` | SSH private key for authentication |

### GitHub Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `ap-south-1` | AWS region for ECR |
| `ECR_REPOSITORY` | `infra-dev/backend-api` | ECR repository name (shared for both images) |
| `K8S_NAMESPACE` | `releaseguard` | Kubernetes namespace |
| `BACKEND_DEPLOYMENT` | `releaseguard-backend` | Backend deployment name |
| `FRONTEND_DEPLOYMENT` | `releaseguard-frontend` | Frontend deployment name |
| `BACKEND_CONTAINER` | `backend` | Backend container name |
| `FRONTEND_CONTAINER` | `frontend` | Frontend container name |
| `API_URL` | _(empty)_ | Optional. Backend URL for metadata recording |

### How to add in GitHub

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** to add each secret
4. Click the **Variables** tab > **New repository variable** to add each variable

---

## 8. How to Trigger Deployment

### Push to main branch

```bash
git add .
git commit -m "Prepare ReleaseGuard deployment"
git push origin main
```

This triggers both workflows:
1. **CI (`ci.yml`)** — runs tests and lint checks
2. **Deploy (`deploy.yml`)** — builds images, pushes to ECR, deploys to K8s

### Monitor the deployment

1. **GitHub**: Go to repository > **Actions** tab > Click the latest workflow run
2. **Kubernetes**: SSH into the control-plane and run `kubectl get pods -n releaseguard`
3. **ReleaseGuard Dashboard**: If `API_URL` is configured, Deployment History shows the new deployment

---

## 9. Deployment Verification

### Checklist

- [ ] GitHub Actions workflow shows green checkmarks
- [ ] ECR repository contains 4 new image tags (`backend-<sha>`, `backend-latest`, `frontend-<sha>`, `frontend-latest`)
- [ ] Kubernetes pods are running and ready
- [ ] Backend `/health` endpoint returns healthy
- [ ] Frontend opens successfully in browser
- [ ] ReleaseGuard dashboard loads and shows data
- [ ] Deployment metadata appears in Deployment History (if `API_URL` configured)

### Verification commands

```bash
# Check ECR images
aws ecr describe-images --repository-name infra-dev/backend-api --region ap-south-1

# Check Kubernetes pods
kubectl get pods -n releaseguard
kubectl describe deployment releaseguard-backend -n releaseguard

# Health check (via port-forward)
kubectl port-forward -n releaseguard svc/releaseguard-backend 8000:8000
curl http://localhost:8000/health
```

---

## 10. Seed Demo Data

```bash
kubectl port-forward -n releaseguard svc/releaseguard-backend 8000:8000
curl -X POST http://localhost:8000/api/seed
```

> **Warning**: This is for demo/development only. Do not run on production data you want to keep.

---

## 11. Troubleshooting

### GitHub Actions cannot assume AWS role

**Error**: `Not authorized to perform sts:AssumeRoleWithWebIdentity`

**Fix**:
- Ensure `AWS_ROLE_ARN` secret is set correctly
- Verify the OIDC provider exists in AWS
- Check the trust policy `sub` field matches `repo:<OWNER>/releaseguard:ref:refs/heads/main`
- Ensure the workflow has `permissions: id-token: write`

### ECR repository not found

**Error**: `RepositoryNotFoundException`

**Fix**:
- Verify `ECR_REPOSITORY` variable matches your existing repository name
- Check the ECR region matches `AWS_REGION`

### SSH connection fails

**Error**: `ssh: connect to host ... Connection refused` or `Permission denied`

**Fix**:
- Verify `K8S_SSH_HOST`, `K8S_SSH_USER`, and `K8S_SSH_PRIVATE_KEY` secrets are correct
- Ensure the SSH key is added to `~/.ssh/authorized_keys` on the control-plane
- Check that port 22 is open on the control-plane node

### kubectl command fails

**Error**: `The connection to the server was refused`

**Fix**:
- Ensure `kubectl` is installed on the control-plane node
- Verify the kubeconfig is valid: `kubectl cluster-info`
- Check that the Kubernetes API server is running

### Rollout timeout

**Error**: `error: deployment "releaseguard-backend" exceeded its progress deadline`

**Fix**:
- Check pod events: `kubectl describe deployment releaseguard-backend -n releaseguard`
- Check pod logs: `kubectl logs -l tier=backend -n releaseguard`
- Verify the ECR image exists and is accessible from the cluster

### Frontend cannot reach backend

**Fix**:
- Verify `NEXT_PUBLIC_API_URL` in the frontend deployment matches the backend service name
- Check that the backend service exists: `kubectl get svc -n releaseguard`

### Backend cannot connect to database

**Fix**:
- Verify the `DATABASE_URL` secret is correct
- Check that the database is reachable from the cluster network

---

## 12. Cleanup

### Remove Kubernetes resources

```bash
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete namespace releaseguard
```

### Remove IAM role (if no longer needed)

```bash
aws iam detach-role-policy --role-name releaseguard-github-actions-role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
aws iam delete-role --role-name releaseguard-github-actions-role
```
