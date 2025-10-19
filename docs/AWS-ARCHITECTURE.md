# AWS Architecture for KareMatch

Technical architecture documentation for KareMatch AWS deployment.

## Architecture Overview

KareMatch uses a modern, serverless-first architecture on AWS designed for:
- **High Availability**: Multi-AZ deployment across 2 availability zones
- **Scalability**: Auto-scaling ECS Fargate tasks based on load
- **Security**: HIPAA-compliant with encryption at rest and in transit
- **Cost Efficiency**: Pay-per-use pricing with Fargate and CloudFront

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────┬──────────────────────────┬──────────────────────────┘
             │                          │
             │                          │
        ┌────▼────┐              ┌──────▼─────┐
        │CloudFront│              │    ALB     │
        │   (CDN)  │              │  (HTTPS)   │
        └────┬────┘              └──────┬─────┘
             │                          │
        ┌────▼────┐                     │
        │   S3    │                     │
        │Frontend │                     │
        └─────────┘              ┌──────▼─────────┐
                                 │  VPC 10.0.0.0/16│
                                 │                 │
      ┌──────────────────────────┼────────────────┼──────────────┐
      │  Public Subnets          │   Private      │  Database    │
      │  (ALB only)              │   Subnets      │  Subnets     │
      │                          │   (ECS Tasks)  │  (RDS Only)  │
      │  ┌─────────────┐         │ ┌────────────┐ │ ┌──────────┐│
      │  │   10.0.1/24 │◄────────┼─┤ 10.0.11/24 │ │ │10.0.21/24││
      │  │   10.0.2/24 │         │ │ 10.0.12/24 │ │ │10.0.22/24││
      │  └─────────────┘         │ │            │ │ │          ││
      │        │                 │ │  ┌──────┐  │ │ │┌────────┐││
      │        │                 │ │  │ ECS  │  │ │ ││  RDS   │││
      │   ┌────▼────┐            │ │  │Fargate│ │ │ ││Postgres│││
      │   │NAT GW   │            │ │  └───┬──┘  │ │ │└───┬────┘││
      │   │Internet │◄───────────┼─┼──────┘     │ │ │    │     ││
      │   │Gateway  │            │ └────────────┘ │ └────┼─────┘│
      └─────────┬──────────────────────────────────┴──────┼──────┘
                │                                          │
          ┌─────▼─────────┐                     ┌─────────▼────────┐
          │AWS Services   │                     │Secrets Manager   │
          │(ECR, Secrets) │                     │(DB Credentials)  │
          └───────────────┘                     └──────────────────┘
```

---

## Components

### 1. Networking (VPC)

**VPC**: `10.0.0.0/16`
- **Public Subnets**: `10.0.1.0/24`, `10.0.2.0/24` (2 AZs)
  - Application Load Balancer
  - NAT Gateways

- **Private Subnets**: `10.0.11.0/24`, `10.0.12.0/24` (2 AZs)
  - ECS Fargate tasks
  - No direct internet access
  - Outbound via NAT Gateway

- **Database Subnets**: `10.0.21.0/24`, `10.0.22.0/24` (2 AZs)
  - RDS PostgreSQL
  - Completely isolated (no internet access)

**Internet Gateway**: Provides internet access to public subnets

**NAT Gateways**: Allow private subnets to access internet (for package updates, AWS APIs)
- Deployed in each public subnet (high availability)

**VPC Flow Logs**: All network traffic logged to CloudWatch (HIPAA requirement)

---

### 2. Compute (ECS Fargate)

**ECS Cluster**: `karematch-cluster`
- Serverless container orchestration
- No EC2 instances to manage

**ECS Service**: `karematch-backend-service`
- Desired count: 2 tasks (configurable)
- Launch type: Fargate
- Network mode: `awsvpc` (each task gets own ENI)
- Deployment: Rolling update (100% minimum healthy, 200% maximum)
- Circuit breaker: Enabled (auto-rollback on failed deployments)

**Task Definition**:
- CPU: 512 units (0.5 vCPU)
- Memory: 1024 MB (1 GB)
- Container: Node.js 20 application
- Health check: `GET /health` every 30s
- Logging: CloudWatch Logs (`/aws/ecs/karematch`)

**Auto Scaling**:
- Target CPU: 70%
- Target Memory: 80%
- Min tasks: 1
- Max tasks: 4

**Secrets Injection**:
- DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET loaded from AWS Secrets Manager
- Environment variables: NODE_ENV, PORT, AWS_REGION, AWS_SECRET_NAME

---

### 3. Database (RDS PostgreSQL)

**RDS Instance**: `karematch-db`
- Engine: PostgreSQL 15.4
- Instance class: `db.t4g.micro` (upgradeable to `db.t4g.small`)
- Storage: 20 GB gp3 (auto-scaling up to 100 GB)
- Multi-AZ: Enabled in production (automatic failover)
- Encryption: AES-256 encryption at rest (HIPAA requirement)
- SSL/TLS: Forced connections (rds.force_ssl=1)

**Backups**:
- Automated backups: 7-day retention
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sunday 04:00-05:00 UTC
- Final snapshot: Enabled on deletion (production only)

**Performance Insights**: Enabled in production (7-day retention)

**Parameter Group** (custom):
- `rds.force_ssl = 1` (enforce SSL)
- `log_connections = 1` (audit)
- `log_disconnections = 1` (audit)
- `log_min_duration_statement = 10000` (slow query log, 10s+)

**Connection**:
- Endpoint: `karematch-db.xxx.us-east-1.rds.amazonaws.com:5432`
- Database: `karematch`
- Access: Private subnets only (ECS tasks)
- Security group: Allows port 5432 from ECS tasks only

---

### 4. Load Balancing (ALB)

**Application Load Balancer**: `karematch-alb`
- Scheme: Internet-facing
- Subnets: Public subnets across 2 AZs
- Security: Allows HTTP (80) and HTTPS (443) from internet

**Target Group**: `karematch-tg`
- Protocol: HTTP
- Port: 5000 (container port)
- Target type: IP (for Fargate)
- Health check: `GET /health` every 30s
  - Healthy threshold: 2 consecutive successes
  - Unhealthy threshold: 3 consecutive failures
- Stickiness: Enabled (24-hour cookie)
- Deregistration delay: 30 seconds

**Listeners**:
1. **HTTPS (443)** - Primary (if certificate provided)
   - SSL Policy: `ELBSecurityPolicy-TLS-1-2-2017-01` (HIPAA-compliant)
   - Forward to target group

2. **HTTP (80)** - Redirect to HTTPS or forward (development)
   - If certificate exists: 301 redirect to HTTPS
   - Otherwise: Forward to target group

**Access Logs**: Enabled (S3 bucket) for audit trail

---

### 5. Content Delivery (S3 + CloudFront)

**S3 Bucket**: `karematch-frontend-{suffix}`
- Purpose: Static frontend hosting
- Access: Private (CloudFront access only via OAI)
- Encryption: AES-256 server-side encryption
- Versioning: Enabled
- Lifecycle: Delete old versions after 90 days

**CloudFront Distribution**:
- Origin: S3 bucket
- Price class: PriceClass_100 (US, Canada, Europe)
- Default root object: `index.html`
- HTTPS: Required (redirect HTTP to HTTPS)
- Compression: Enabled (gzip, brotli)
- Caching:
  - Static assets (JS, CSS, images): 1 year TTL
  - HTML, JSON: No caching (max-age=0)
- Error handling: 404/403 → /index.html (SPA routing)
- Custom domain: Supported (if ACM certificate provided)

**Origin Access Identity (OAI)**:
- Restricts S3 access to CloudFront only
- Prevents direct S3 URL access

---

### 6. Container Registry (ECR)

**ECR Repository**: `karematch-backend`
- Image tag mutability: Mutable (allows :latest)
- Encryption: AES-256
- Image scanning: Enabled on push (vulnerability detection)

**Lifecycle Policy**:
- Keep last 10 tagged images
- Delete untagged images after 7 days

**Repository Policy**:
- ECS task execution role can pull images

---

### 7. Secrets Management (AWS Secrets Manager)

**App Secrets**: `karematch-app-secrets-{suffix}`
- Contents (JSON):
  ```json
  {
    "DATABASE_URL": "postgresql://...",
    "ENCRYPTION_KEY": "...",
    "SESSION_SECRET": "...",
    "AWS_REGION": "us-east-1"
  }
  ```
- Encryption: AWS KMS (default key)
- Rotation: Manual (automatic rotation can be enabled)
- Access: ECS task execution role only

**Database Password**: `karematch-db-password-{suffix}`
- Contents: Master database credentials
- Rotation: Can be automated with Lambda function

---

### 8. IAM Roles and Policies

**ECS Task Execution Role**: `karematch-ecs-task-execution-role`
- Purpose: Pull images, read secrets, write logs
- Policies:
  - `AmazonECSTaskExecutionRolePolicy` (AWS managed)
  - Custom: Read from Secrets Manager
  - Custom: Decrypt with KMS

**ECS Task Role**: `karematch-ecs-task-role`
- Purpose: Application runtime permissions
- Policies:
  - Read from Secrets Manager (for secret refresh)
  - Write to CloudWatch Logs
  - (Optional) RDS IAM authentication

**VPC Flow Log Role**: `karematch-vpc-flow-log-role`
- Purpose: Write VPC flow logs
- Policies: CloudWatch Logs write access

---

### 9. Monitoring & Logging (CloudWatch)

**Log Groups**:
- `/aws/ecs/karematch` - ECS container logs (30-day retention)
- `/aws/vpc/karematch-flow-log` - VPC flow logs (30-day retention)

**Metrics**:
- ECS: CPU, memory, task count
- RDS: CPU, memory, storage, connections
- ALB: Request count, response time, error rates
- Custom: Application errors, failed logins

**Dashboards**: `karematch-dashboard`
- ECS resource utilization
- RDS performance metrics
- ALB performance (response time, errors)
- Recent application logs

**Alarms**:
- RDS CPU > 80%
- RDS free memory < 256 MB
- RDS free storage < 2 GB
- ALB response time > 1 second
- ALB healthy host count < 1
- ECS running tasks = 0
- ALB 5XX errors > 10 (5 min window)

---

## Security Architecture

### Network Security

1. **Security Groups** (Stateful firewalls):
   - **ALB SG**: Allow 80, 443 from internet
   - **ECS SG**: Allow 5000 from ALB only
   - **RDS SG**: Allow 5432 from ECS only

2. **Network ACLs**: Default (allow all)

3. **Private Subnets**: ECS and RDS have no direct internet access

4. **VPC Flow Logs**: All network traffic logged for audit

### Data Security

1. **Encryption at Rest**:
   - RDS: AES-256 encryption
   - S3: AES-256 server-side encryption
   - ECR: AES-256 encryption
   - Secrets Manager: AWS KMS encryption

2. **Encryption in Transit**:
   - ALB → Internet: HTTPS (TLS 1.2+)
   - ECS → RDS: SSL/TLS (enforced)
   - CloudFront → Browser: HTTPS

3. **Secrets Management**:
   - No secrets in code or environment variables
   - All secrets in AWS Secrets Manager
   - Rotation supported

### Access Control

1. **IAM Roles**: Least privilege access
2. **No Public Access**: RDS and ECS in private subnets
3. **MFA**: Recommended for AWS console access
4. **CloudTrail**: (Optional) API call audit logging

---

## High Availability & Disaster Recovery

### High Availability

1. **Multi-AZ Deployment**:
   - Public subnets: 2 AZs
   - Private subnets: 2 AZs
   - Database subnets: 2 AZs
   - RDS: Multi-AZ with automatic failover
   - ALB: Distributed across 2 AZs

2. **Auto Scaling**:
   - ECS tasks scale based on CPU/memory
   - Min: 1, Max: 4 tasks

3. **Load Balancing**:
   - ALB distributes traffic across healthy tasks
   - Health checks remove unhealthy tasks

### Disaster Recovery

1. **RDS Backups**:
   - Automated daily backups (7-day retention)
   - Manual snapshots on demand
   - Point-in-time recovery

2. **S3 Versioning**:
   - Previous versions retained for 90 days
   - Accidental deletions can be recovered

3. **Infrastructure as Code**:
   - Terraform state backed up
   - Entire infrastructure can be recreated

**RTO (Recovery Time Objective)**: < 1 hour
**RPO (Recovery Point Objective)**: < 24 hours (daily backups)

---

## Cost Breakdown

See [AWS-DEPLOYMENT.md](./AWS-DEPLOYMENT.md#cost-optimization) for detailed cost estimates.

**Major Cost Centers**:
1. NAT Gateway (~$35/month) - Consider VPC endpoints
2. ECS Fargate (~$25-50/month) - Scales with usage
3. RDS (~$15-60/month) - Depends on instance size
4. ALB (~$20/month) - Fixed cost

---

## Compliance

### HIPAA Compliance

KareMatch architecture is designed to be HIPAA-compliant:

✅ **Encryption at Rest**: All data stores encrypted (RDS, S3, ECR)
✅ **Encryption in Transit**: TLS 1.2+ for all connections
✅ **Access Logging**: VPC Flow Logs, CloudTrail (optional)
✅ **Audit Logging**: Database connection logs
✅ **Access Control**: Least privilege IAM roles
✅ **Network Isolation**: Private subnets for sensitive resources
✅ **Automated Backups**: 7-day retention
✅ **Secrets Management**: No hardcoded credentials

**Required Additional Steps for Full HIPAA Compliance**:
1. Sign AWS Business Associate Agreement (BAA)
2. Enable AWS CloudTrail for API audit logging
3. Implement log retention for 6 years
4. Set up monitoring and alerting for security events
5. Regular security assessments and penetration testing

---

## Scalability

### Horizontal Scaling

- **ECS Tasks**: Auto-scale from 1 to 4 tasks
- **RDS**: Can be scaled vertically (larger instance)
- **CloudFront**: Global CDN, unlimited scale

### Vertical Scaling

Increase resources as needed:
```hcl
# terraform/variables.tf
variable "ecs_task_cpu" {
  default = 1024  # From 512 to 1024 (1 vCPU)
}

variable "ecs_task_memory" {
  default = 2048  # From 1024 to 2048 (2 GB)
}

variable "db_instance_class" {
  default = "db.t4g.small"  # From db.t4g.micro
}
```

### Performance Targets

- **API Response Time**: < 500ms (p95)
- **Page Load Time**: < 2s (first contentful paint)
- **Database Query Time**: < 100ms (p95)
- **Health Check**: < 100ms

---

## Maintenance Windows

- **RDS Maintenance**: Sunday 04:00-05:00 UTC
- **RDS Backups**: Daily 03:00-04:00 UTC
- **ECS Deployments**: Zero-downtime rolling updates

---

## References

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS HIPAA Compliance](https://aws.amazon.com/compliance/hipaa-compliance/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
