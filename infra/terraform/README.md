# Terraform Infrastructure

This directory contains Terraform configuration for deploying ReleaseGuard to AWS.

## Resources Created

- **VPC** with public/private subnets
- **ECR** repositories for backend and frontend images
- **ECS Fargate** cluster with backend and frontend services
- **RDS PostgreSQL** database
- **CloudWatch** log groups
- **Security Groups** for ECS and RDS

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Terraform >= 1.0 installed
3. A domain name (optional, for ALB)

## Usage

```bash
cd infra/terraform

# Initialize
terraform init

# Plan
terraform plan -var="db_password=YOUR_PASSWORD"

# Apply
terraform apply -var="db_password=YOUR_PASSWORD"

# Destroy (when done)
terraform destroy -var="db_password=YOUR_PASSWORD"
```

## Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `project_name` | Project name | `releaseguard` |
| `db_name` | Database name | `releaseguard` |
| `db_username` | Database username | `releaseguard` |
| `db_password` | Database password | (required) |

## Cost Estimate

This configuration uses:
- `db.t3.micro` (~$12/month)
- Fargate tasks (~$10-15/month per task)
- NAT Gateway (~$32/month)

**Estimated total: ~$65-80/month**

> **Warning:** Remember to run `terraform destroy` when done to avoid ongoing charges.
