# AWS Deployment Guide

## Architecture

```
GitHub Actions → AWS ECR → AWS ECS Fargate → PostgreSQL (RDS)
```

## Prerequisites

1. AWS account with appropriate permissions
2. GitHub repository with Actions enabled
3. Terraform installed (for infrastructure setup)

## Step 1: Set Up Infrastructure

```bash
cd infra/terraform
terraform init
terraform plan -var="db_password=YOUR_SECURE_PASSWORD"
terraform apply -var="db_password=YOUR_SECURE_PASSWORD"
```

This creates:
- VPC with networking
- ECR repositories
- ECS cluster and services
- RDS PostgreSQL instance
- CloudWatch log groups

## Step 2: Configure GitHub

### Repository Secrets

Add to GitHub repository → Settings → Secrets and variables → Actions:

| Name | Value |
|------|-------|
| `AWS_ROLE_ARN` | IAM role ARN from Terraform output |

### Repository Variables

Add to GitHub repository → Settings → Secrets and variables → Actions → Variables:

| Name | Value |
|------|-------|
| `AWS_REGION` | `us-east-1` |
| `ECR_REPOSITORY` | `releaseguard` |
| `ECS_CLUSTER` | `releaseguard-cluster` |
| `ECS_SERVICE` | `releaseguard-backend` or `releaseguard-frontend` |
| `API_URL` | Your ECS service URL |

## Step 3: Push to Deploy

```bash
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker images
3. Push to ECR
4. Deploy to ECS
5. Verify health

## Step 4: Verify

1. Check ECS console for running services
2. Access the frontend via the ECS service endpoint
3. Verify API at `/health`
4. Check CloudWatch logs for any errors

## Cleanup

**Important:** To avoid ongoing charges, destroy infrastructure when not in use:

```bash
cd infra/terraform
terraform destroy -var="db_password=YOUR_SECURE_PASSWORD"
```

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| RDS db.t3.micro | ~$12 |
| Fargate (2 tasks) | ~$20-30 |
| NAT Gateway | ~$32 |
| CloudWatch Logs | ~$1 |
| **Total** | **~$65-75** |

> **Tip:** For a resume project, run the infrastructure only when demonstrating, then destroy it.
