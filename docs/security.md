# Security Practices

## Secrets Management

- **No hardcoded secrets** in source code
- `.env.example` provided as template (not `.env`)
- `.env` added to `.gitignore`
- GitHub Secrets used for CI/CD credentials
- AWS credentials via OIDC (no long-lived keys)

## Authentication & Authorization

- GitHub OIDC for AWS authentication
- IAM roles with least-privilege policies
- No user authentication in MVP (internal tool)

## Input Validation

- Pydantic models validate all API inputs
- Environment and status enums restrict valid values
- SQL injection prevented by SQLAlchemy ORM
- XSS prevented by React's default escaping

## CORS Configuration

- Origins configured explicitly (not `*`)
- Only frontend origin allowed in production
- Credentials enabled for session support

## Database Security

- RDS encryption at rest enabled
- VPC security groups restrict access
- Database in private subnet
- Strong passwords required

## Infrastructure Security

- ECR image scanning enabled
- CloudWatch logging for audit trail
- VPC isolation between services
- NAT Gateway for outbound traffic only

## Recommendations for Production

1. Add HTTPS via ALB + ACM certificate
2. Implement rate limiting
3. Add authentication (JWT/OAuth)
4. Enable AWS WAF
5. Set up CloudWatch alarms
6. Implement secrets rotation
