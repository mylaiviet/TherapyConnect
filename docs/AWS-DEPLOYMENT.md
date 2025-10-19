# AWS Deployment Guide for KareMatch

Complete guide for deploying KareMatch to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Cost Optimization](#cost-optimization)

---

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.x or later)
   ```bash
   # Install: https://aws.amazon.com/cli/
   aws --version
   ```

2. **Terraform** (v1.0 or later)
   ```bash
   # Install: https://www.terraform.io/downloads
   terraform --version
   ```

3. **Docker** (for local builds)
   ```bash
   docker --version
   ```

4. **Node.js** (v20 or later)
   ```bash
   node --version
   ```

### AWS Account Setup

1. **Create AWS Account** (if not already done)
   - Visit: https://aws.amazon.com/

2. **Configure AWS CLI**
   ```bash
   aws configure
   ```
   Provide:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (`json`)

3. **Verify AWS Access**
   ```bash
   aws sts get-caller-identity
   ```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/karematch.git
cd karematch
git checkout aws-migration
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.aws.example .env.aws
```

Edit `.env.aws` and set:
- `AWS_REGION` - Your AWS region
- `TF_VAR_domain_name` - (Optional) Custom domain
- `TF_VAR_acm_certificate_arn` - (Optional) SSL certificate ARN

---

## Infrastructure Deployment

### Option 1: Automated Setup (Recommended)

```bash
npm run aws:setup
```

This script will:
1. Initialize Terraform
2. Validate configuration
3. Plan infrastructure changes
4. Prompt for confirmation
5. Create all AWS resources

### Option 2: Manual Terraform Steps

```bash
cd terraform

# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Create infrastructure
terraform apply
```

### What Gets Created

The infrastructure setup creates:
- **VPC**: 2 public, 2 private, 2 database subnets across 2 AZs
- **RDS**: PostgreSQL database (encrypted, automated backups)
- **ECS**: Fargate cluster for containerized backend
- **ALB**: Application Load Balancer
- **ECR**: Docker image registry
- **S3**: Frontend hosting bucket
- **CloudFront**: CDN for frontend
- **Secrets Manager**: Application secrets storage
- **CloudWatch**: Logging and monitoring
- **IAM**: Least-privilege roles and policies

**Estimated Time**: 10-15 minutes

---

## Application Deployment

### Deploy Backend

#### 1. Build and Push Docker Image

```bash
npm run aws:build
```

This script:
- Logs into ECR
- Builds Docker image
- Tags image with timestamp
- Pushes to ECR

#### 2. Deploy to ECS

```bash
npm run aws:deploy:backend
```

This script:
- Triggers ECS service update
- Waits for deployment to stabilize
- Verifies health checks pass

**Estimated Time**: 3-5 minutes

### Deploy Frontend

```bash
npm run aws:deploy:frontend
```

This script:
- Builds frontend with Vite
- Uploads static files to S3
- Invalidates CloudFront cache
- Waits for invalidation to complete

**Estimated Time**: 2-3 minutes

### Full Deployment (Backend + Frontend)

```bash
npm run aws:deploy
```

Runs both backend and frontend deployments in sequence.

---

## Post-Deployment

### 1. Verify Deployment

#### Check Backend Health

```bash
# Get ALB URL from Terraform
cd terraform
terraform output alb_url

# Test health endpoint
curl https://your-alb-url.amazonaws.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T...",
  "uptime": 123.45,
  "environment": "production"
}
```

#### Check Frontend

Visit the CloudFront URL:
```bash
terraform output cloudfront_url
```

### 2. View Logs

```bash
# Follow ECS logs
aws logs tail /aws/ecs/karematch --follow

# View recent errors
aws logs filter-pattern ERROR /aws/ecs/karematch
```

### 3. Monitor Dashboard

Get dashboard URL:
```bash
cd terraform
terraform output cloudwatch_dashboard_url
```

### 4. Run Database Migrations

```bash
# SSH into ECS task or run via ECS Exec
aws ecs execute-command \
  --cluster karematch-cluster \
  --task TASK_ID \
  --container backend \
  --command "npm run db:push" \
  --interactive
```

Or run migrations from local machine with RDS endpoint:
```bash
export DATABASE_URL="postgresql://..."
npm run db:push
npm run db:seed
```

### 5. Custom Domain Setup (Optional)

If you have a custom domain:

1. **Create ACM Certificate** (in us-east-1 for CloudFront)
   ```bash
   aws acm request-certificate \
     --domain-name karematch.com \
     --domain-name www.karematch.com \
     --validation-method DNS
   ```

2. **Add DNS validation records** to your domain registrar

3. **Update Terraform variables**
   ```bash
   cd terraform
   terraform apply -var="domain_name=karematch.com" \
                   -var="acm_certificate_arn=arn:aws:acm:..."
   ```

4. **Update DNS** to point to CloudFront and ALB

---

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster karematch-cluster \
  --services karematch-backend-service

# Check task stopped reason
aws ecs describe-tasks \
  --cluster karematch-cluster \
  --tasks TASK_ID
```

Common issues:
- Secrets not accessible → Check IAM role permissions
- Image pull failed → Verify ECR login and image exists
- Health check failing → Check /health endpoint and container logs

### Database Connection Issues

```bash
# Test RDS connectivity from ECS task
aws ecs execute-command \
  --cluster karematch-cluster \
  --task TASK_ID \
  --container backend \
  --command "nc -zv RDS_ENDPOINT 5432" \
  --interactive
```

Check:
- Security group rules (ECS → RDS on port 5432)
- DATABASE_URL in Secrets Manager
- SSL mode configured correctly

### High Costs

See [Cost Optimization](#cost-optimization)

---

## Cost Optimization

### Estimated Monthly Costs

**Minimal Configuration** (~$50-100/month):
- RDS db.t4g.micro: ~$15
- ECS Fargate (2 tasks, 0.5 vCPU, 1GB each): ~$25
- ALB: ~$20
- CloudFront: ~$1 (first 1TB free)
- NAT Gateway: ~$35
- S3, CloudWatch, Secrets Manager: ~$5

**Production Configuration** (~$200-300/month):
- RDS db.t4g.small Multi-AZ: ~$60
- ECS Fargate (4 tasks, 1 vCPU, 2GB each): ~$100
- ALB: ~$20
- CloudFront: ~$10
- NAT Gateway (2 AZs): ~$70
- Other services: ~$20

### Cost Reduction Tips

1. **Use Single AZ for Development**
   ```hcl
   # terraform/variables.tf
   variable "environment" {
     default = "development"  # Disables Multi-AZ RDS
   }
   ```

2. **Reduce ECS Task Count**
   ```hcl
   variable "ecs_desired_count" {
     default = 1  # Instead of 2
   }
   ```

3. **Use Spot Instances** (for non-critical workloads)
   - Modify ECS service to use Fargate Spot

4. **Remove NAT Gateways** (if ECS doesn't need internet)
   - Use VPC endpoints for AWS services instead

5. **Enable S3 Lifecycle Policies**
   - Already configured to delete old object versions after 90 days

6. **Set CloudWatch Log Retention**
   - Already set to 30 days (configurable via `log_retention_days`)

---

## Maintenance

### Update Application

```bash
# After making code changes
git push origin aws-migration

# Rebuild and redeploy
npm run aws:deploy
```

### Update Infrastructure

```bash
cd terraform

# Edit .tf files

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Backup and Restore

RDS automated backups are enabled (7-day retention).

**Manual Snapshot**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier karematch-db \
  --db-snapshot-identifier karematch-manual-$(date +%Y%m%d)
```

**Restore from Snapshot**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier karematch-db-restored \
  --db-snapshot-identifier SNAPSHOT_ID
```

---

## Security Best Practices

1. **Rotate Secrets Regularly**
   - Enable automatic rotation in AWS Secrets Manager

2. **Review IAM Permissions**
   - Use `aws iam get-account-authorization-details` to audit

3. **Enable VPC Flow Logs**
   - Already enabled via Terraform

4. **Enable GuardDuty** (optional, additional cost)
   ```bash
   aws guardduty create-detector --enable
   ```

5. **Set Up CloudTrail** (optional, additional cost)
   - Track all API calls for audit compliance

---

## Support

For issues with:
- **AWS Infrastructure**: Check [AWS-ARCHITECTURE.md](./AWS-ARCHITECTURE.md)
- **Application Code**: See main [README.md](../README.md)
- **Deployment Scripts**: Review `scripts/` directory

**Need Help?**
- AWS Support: https://aws.amazon.com/support
- KareMatch Team: Create an issue in GitHub
