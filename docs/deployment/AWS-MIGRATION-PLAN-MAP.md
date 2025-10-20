# AWS Migration Plan - Complete Mapping

**Document Purpose:** This maps out my complete understanding of the AWS migration plan before implementation begins.

---

## 🎯 Migration Objectives

### Primary Goals
1. Migrate from Render.com + Neon Database → Full AWS infrastructure
2. Maintain HIPAA compliance throughout migration
3. Enable parallel running of Render (production) and AWS (testing)
4. Achieve zero downtime during cutover
5. Improve security with AWS Secrets Manager, encryption, and VPC isolation

### Target Architecture
- **Compute:** ECS Fargate (containerized Node.js app)
- **Database:** RDS PostgreSQL 15 Multi-AZ with encryption
- **Frontend:** S3 + CloudFront CDN
- **Load Balancer:** Application Load Balancer (ALB) with HTTPS
- **Secrets:** AWS Secrets Manager (DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET)
- **Networking:** VPC with public/private subnets, NAT Gateway
- **Registry:** ECR for Docker images
- **Infrastructure:** Terraform for IaC

---

## 📋 Implementation Plan Overview

### Phase Structure
```
SETUP → DOCKER → APP CODE → TERRAFORM → SCRIPTS → CONFIG → DOCS → TESTING → DEPLOY
```

### Branch Strategy
- **main:** Continues deploying to Render (production)
- **aws-migration:** All AWS work happens here (testing)
- **No merge until AWS proven stable**

---

## 🔧 STEP 1: Create Docker Container

### Files to Create

#### 1.1 Dockerfile
**Location:** `C:\KareMatch\Dockerfile`

**Purpose:** Multi-stage build for production container

**Structure:**
```dockerfile
Stage 1: Builder
- Base: node:20-alpine
- Install build dependencies (python3, make, g++, curl)
- Copy package files
- npm ci (install all dependencies)
- Copy source code
- Run npm run build (Vite frontend + esbuild backend)

Stage 2: Runtime
- Base: node:20-alpine
- Install curl for health checks
- Create non-root user (nodejs:nodejs)
- Copy package files
- npm ci --only=production
- Copy built artifacts from builder
- Copy runtime files (server/, shared/)
- Switch to nodejs user
- Expose port 5000
- Health check: curl http://localhost:5000/health
- CMD: node dist/index.js
```

**Key Features:**
- Multi-stage reduces image size
- Non-root user for security
- Health check for ECS monitoring
- Production-only dependencies in final image

#### 1.2 .dockerignore
**Location:** `C:\KareMatch\.dockerignore`

**Purpose:** Exclude unnecessary files from Docker build

**Exclusions:**
- node_modules, client/node_modules
- .git, .gitignore
- .env files (secrets come from Secrets Manager)
- dist/, client/dist (built in container)
- *.md, docs/, tests/
- IDE files (.vscode, .idea)
- Local data files (data/, *.json, cookies.txt)
- Infrastructure files (terraform/, scripts/, render.yaml)

#### 1.3 docker-compose.yml
**Location:** `C:\KareMatch\docker-compose.yml`

**Purpose:** Local development testing with PostgreSQL

**Services:**
```yaml
postgres:
  - Image: postgres:15-alpine
  - Port: 5432
  - Volume: postgres_data
  - Health check: pg_isready

app:
  - Build from Dockerfile
  - Port: 5000
  - Environment: NODE_ENV=production, DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET
  - Depends on postgres health
  - Health check: curl /health
```

**Use Case:** Test Docker build locally before pushing to AWS

---

## 💻 STEP 2: Update Application Code

### Files to Modify/Create

#### 2.1 server/lib/secrets.ts (NEW FILE)
**Location:** `C:\KareMatch\server\lib\secrets.ts`

**Purpose:** AWS Secrets Manager integration

**Functions:**
1. `getSecretsManagerClient()`
   - Only active if NODE_ENV=production && AWS_REGION set
   - Returns SecretsManagerClient or null

2. `getSecret(secretName: string)`
   - Check in-memory cache first
   - If production: fetch from Secrets Manager
   - If development: fall back to process.env
   - Cache result to minimize API calls

3. `loadApplicationSecrets()`
   - Load DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET
   - Return object with all secrets
   - Used during app startup

4. `clearSecretCache()`
   - For testing/forcing refresh

**Security Features:**
- In-memory cache (reduce API calls)
- Graceful fallback to env vars
- Only runs in production with AWS_REGION

#### 2.2 server/index.ts (MODIFY)
**Location:** `C:\KareMatch\server\index.ts`

**Changes:**
1. Import `loadApplicationSecrets` from `./lib/secrets`

2. Add health endpoint (BEFORE other middleware):
   ```typescript
   app.get("/health", (_req, res) => {
     res.status(200).json({
       status: "healthy",
       timestamp: Date.now(),
       environment: process.env.NODE_ENV || "development",
       uptime: process.uptime(),
     });
   });
   ```

3. Load secrets on startup (in async IIFE):
   ```typescript
   if (process.env.NODE_ENV === "production" && process.env.AWS_REGION) {
     const secrets = await loadApplicationSecrets();
     process.env.DATABASE_URL = secrets.databaseUrl;
     process.env.ENCRYPTION_KEY = secrets.encryptionKey;
     process.env.SESSION_SECRET = secrets.sessionSecret;
   }
   ```

4. Update trust proxy comment to mention AWS ALB

**Why:**
- /health endpoint for ALB health checks
- Secrets Manager integration for production
- Backward compatible with Render (fallback to env vars)

#### 2.3 server/db.ts (MODIFY)
**Location:** `C:\KareMatch\server\db.ts`

**Changes:**
Add RDS-specific connection configuration:
```typescript
const connectionConfig: postgres.Options<any> = {
  max: 10,                    // Connection pool size
  idle_timeout: 20,           // Close idle connections
  connect_timeout: 10,        // Connection timeout
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }  // Enforce SSL in production
    : false,                          // No SSL in development
  onnotice: () => {},         // Suppress notices
};

const client = postgres(process.env.DATABASE_URL, connectionConfig);
```

**Why:**
- RDS requires SSL with certificate validation
- Connection pooling for performance
- Development still works without SSL

#### 2.4 server/routes.ts (MODIFY)
**Location:** `C:\KareMatch\server\routes.ts`

**Changes:**
Update session store SSL configuration:
```typescript
const sessionStore = process.env.NODE_ENV === "production"
  ? new PgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true }  // Change from false to true
      },
      tableName: 'session',
      createTableIfMissing: true,
    })
  : undefined;
```

**Why:**
- AWS RDS certificates are trusted by default
- Enforces SSL validation for HIPAA compliance

---

## 🏗️ STEP 3: Create Terraform Infrastructure

### Directory Structure
```
terraform/
├── main.tf                 # Provider, backend, data sources
├── variables.tf            # Input variables
├── vpc.tf                  # VPC, subnets, NAT, IGW
├── security-groups.tf      # ALB, ECS, RDS security groups
├── rds.tf                  # PostgreSQL database
├── secrets.tf              # Secrets Manager secrets
├── ecr.tf                  # Container registry
├── ecs.tf                  # ECS cluster, task definition, service
├── alb.tf                  # Application Load Balancer
├── s3-cloudfront.tf        # Frontend hosting
├── iam.tf                  # IAM roles and policies
├── cloudwatch.tf           # Logging configuration
└── outputs.tf              # Output values
```

### 3.1 main.tf
**Purpose:** Core Terraform configuration

**Contents:**
- Terraform version: >= 1.0
- AWS provider: ~> 5.0
- Random provider: ~> 3.5
- Backend configuration (S3 + DynamoDB for state locking) - commented out initially
- AWS provider with region and default tags (Project, Environment, ManagedBy, Compliance)
- Data sources: aws_availability_zones, aws_caller_identity

### 3.2 variables.tf
**Purpose:** Define all configurable parameters

**Variables:**
- aws_region (default: us-east-1)
- environment (default: production)
- project_name (default: karematch)
- domain_name (optional)
- vpc_cidr (default: 10.0.0.0/16)
- public_subnet_cidrs (default: [10.0.1.0/24, 10.0.2.0/24])
- private_subnet_cidrs (default: [10.0.10.0/24, 10.0.11.0/24])
- db_instance_class (default: db.t3.medium)
- db_allocated_storage (default: 100 GB)
- db_name (default: karematch)
- db_username (default: postgres)
- db_password (sensitive, required)
- db_backup_retention_days (default: 30)
- ecs_task_cpu (default: 512)
- ecs_task_memory (default: 1024 MB)
- ecs_desired_count (default: 2)
- container_port (default: 5000)
- log_retention_days (default: 30)
- acm_certificate_arn (optional)
- additional_tags (map, default: {})

### 3.3 vpc.tf
**Purpose:** Network infrastructure

**Resources:**
1. **VPC** (10.0.0.0/16)
   - DNS hostnames enabled
   - DNS support enabled

2. **Internet Gateway**
   - Attached to VPC

3. **Public Subnets** (2 subnets in different AZs)
   - 10.0.1.0/24, 10.0.2.0/24
   - map_public_ip_on_launch = true
   - For ALB and NAT Gateway

4. **Private Subnets** (2 subnets in different AZs)
   - 10.0.10.0/24, 10.0.11.0/24
   - No public IPs
   - For ECS and RDS

5. **Elastic IP**
   - For NAT Gateway

6. **NAT Gateway**
   - In first public subnet
   - Allows private subnets to access internet (for pulling images)

7. **Public Route Table**
   - Route to Internet Gateway (0.0.0.0/0)
   - Associated with public subnets

8. **Private Route Table**
   - Route to NAT Gateway (0.0.0.0/0)
   - Associated with private subnets

9. **VPC Flow Logs**
   - Log all traffic to CloudWatch
   - IAM role for flow logs
   - CloudWatch log group

**Security:** Private subnets have no direct internet access

### 3.4 security-groups.tf
**Purpose:** Firewall rules (least-privilege)

**Security Groups:**

1. **ALB Security Group**
   - Ingress: Port 80 (HTTP) from 0.0.0.0/0 → redirect to HTTPS
   - Ingress: Port 443 (HTTPS) from 0.0.0.0/0
   - Egress: All traffic

2. **ECS Tasks Security Group**
   - Ingress: Port 5000 from ALB security group ONLY
   - Egress: All traffic (for database, external APIs)

3. **RDS Security Group**
   - Ingress: Port 5432 from ECS security group ONLY
   - Egress: All traffic
   - **Result:** Database only accessible from ECS tasks

4. **VPC Endpoints Security Group** (optional)
   - Ingress: Port 443 from private subnets
   - For ECR, Secrets Manager endpoints

**HIPAA Compliance:** No public access to database or application containers

### 3.5 rds.tf
**Purpose:** PostgreSQL database with HIPAA compliance

**Resources:**

1. **DB Subnet Group**
   - Uses both private subnets
   - Required for Multi-AZ

2. **DB Parameter Group** (postgres15)
   - log_connections = 1
   - log_disconnections = 1
   - log_duration = 1
   - log_statement = all
   - rds.force_ssl = 1 (HIPAA requirement)

3. **RDS Instance**
   - Engine: postgres 15.4
   - Instance class: db.t3.medium
   - Storage: 100 GB GP3, encrypted
   - Max storage: 200 GB (auto-scaling)
   - Multi-AZ: true (HIPAA requirement)
   - Backup retention: 30 days (HIPAA requirement)
   - Backup window: 03:00-04:00 UTC
   - Maintenance window: mon:04:00-mon:05:00 UTC
   - Encryption: KMS key
   - Performance Insights: enabled
   - Enhanced Monitoring: enabled (60s interval)
   - CloudWatch logs: postgresql, upgrade
   - Deletion protection: true
   - Final snapshot: enabled
   - Not publicly accessible

4. **KMS Key for Encryption**
   - Key rotation enabled
   - For RDS encryption at rest

5. **IAM Role for Enhanced Monitoring**
   - Allows RDS to publish metrics to CloudWatch

6. **CloudWatch Alarms**
   - High CPU (> 80%)
   - Low storage (< 10 GB)

**HIPAA Features:**
- Encryption at rest (KMS)
- Encryption in transit (SSL required)
- Multi-AZ for redundancy
- 30-day backups
- Audit logging
- No public access

### 3.6 secrets.tf
**Purpose:** Secure secret storage

**Resources:**

1. **Random Passwords**
   - ENCRYPTION_KEY: 32 bytes (for AES-256)
   - SESSION_SECRET: 64 bytes

2. **Secrets in Secrets Manager**
   - DATABASE_URL (constructed from RDS endpoint)
   - ENCRYPTION_KEY (random generated)
   - SESSION_SECRET (random generated)

3. **KMS Key for Secrets Manager**
   - Separate from RDS key
   - Key rotation enabled

4. **Secret Versions**
   - Initial values set
   - lifecycle.ignore_changes for manual updates

**Format:**
```
DATABASE_URL=postgresql://username:password@endpoint:5432/dbname?sslmode=require
ENCRYPTION_KEY=<random-32-bytes>
SESSION_SECRET=<random-64-bytes>
```

### 3.7 ecr.tf
**Purpose:** Docker image registry

**Resources:**

1. **ECR Repository**
   - Name: karematch
   - Image tag mutability: MUTABLE
   - Scan on push: enabled (security vulnerability scanning)
   - Encryption: KMS

2. **KMS Key for ECR**
   - Key rotation enabled

3. **Lifecycle Policy**
   - Keep last 10 images
   - Delete older images automatically

4. **Repository Policy**
   - Allow ECS tasks to pull images
   - Permissions: GetDownloadUrlForLayer, BatchGetImage, BatchCheckLayerAvailability

### 3.8 ecs.tf
**Purpose:** Container orchestration

**Resources:**

1. **ECS Cluster**
   - Name: karematch-cluster
   - Container Insights: enabled

2. **CloudWatch Log Group**
   - Path: /ecs/karematch
   - Retention: 30 days

3. **ECS Task Definition**
   - Launch type: FARGATE
   - Network mode: awsvpc
   - CPU: 512 (0.5 vCPU)
   - Memory: 1024 MB
   - Execution role: pull ECR, write CloudWatch, read Secrets Manager
   - Task role: read Secrets Manager

   **Container Definition:**
   - Image: ECR repository URL:latest
   - Port: 5000
   - Environment variables:
     * NODE_ENV=production
     * PORT=5000
     * AWS_REGION=us-east-1
   - Secrets (from Secrets Manager):
     * DATABASE_URL
     * ENCRYPTION_KEY
     * SESSION_SECRET
   - Logging: CloudWatch
   - Health check: curl http://localhost:5000/health (interval: 30s, timeout: 5s, retries: 3, start period: 60s)

4. **ECS Service**
   - Desired count: 2 tasks
   - Launch type: FARGATE
   - Network: private subnets, ECS security group, no public IP
   - Load balancer: ALB target group on port 5000
   - Deployment: 100% min healthy, 200% max
   - Deployment circuit breaker: enabled with rollback
   - Health check grace period: 60s
   - Force new deployment on task definition change

5. **Auto Scaling**
   - Target: 2-10 tasks
   - CPU-based: scale at 70% CPU
   - Memory-based: scale at 80% memory
   - Scale-in cooldown: 300s
   - Scale-out cooldown: 60s

### 3.9 alb.tf
**Purpose:** Load balancer with HTTPS

**Resources:**

1. **Application Load Balancer**
   - Scheme: internet-facing
   - Subnets: public subnets
   - Security group: ALB security group
   - Access logs: optional S3 bucket

2. **Target Group**
   - Port: 5000
   - Protocol: HTTP
   - Target type: ip (for Fargate)
   - Health check:
     * Path: /health
     * Interval: 30s
     * Timeout: 5s
     * Healthy threshold: 2
     * Unhealthy threshold: 3
     * Matcher: 200

3. **HTTP Listener (Port 80)**
   - Action: Redirect to HTTPS (port 443)
   - Status code: 301

4. **HTTPS Listener (Port 443)**
   - Action: Forward to target group
   - SSL policy: ELBSecurityPolicy-TLS-1-2-2017-01
   - Certificate: ACM certificate (if provided)
   - **Note:** If no certificate, needs manual ACM setup or self-signed cert

### 3.10 s3-cloudfront.tf
**Purpose:** Frontend hosting and CDN

**Resources:**

1. **S3 Bucket**
   - Name: karematch-frontend-<account-id>
   - Public access: BLOCKED
   - Versioning: enabled
   - Encryption: AES256
   - Lifecycle rules: delete old versions after 90 days

2. **S3 Bucket Policy**
   - Allow CloudFront OAI to read objects
   - Deny all other access

3. **CloudFront Origin Access Identity**
   - For secure S3 access

4. **CloudFront Distribution**
   - Origin: S3 bucket via OAI
   - Viewer protocol: redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD, OPTIONS
   - Compress objects: true
   - Default root object: index.html
   - Custom error responses:
     * 404 → /index.html (for SPA routing)
     * 403 → /index.html (for SPA routing)
   - Price class: PriceClass_100 (US, Canada, Europe)
   - SSL certificate: ACM (if provided) or CloudFront default
   - Logging: optional S3 bucket

5. **S3 Bucket for Logs** (optional)
   - CloudFront access logs
   - ALB access logs

### 3.11 iam.tf
**Purpose:** IAM roles and policies

**Roles:**

1. **ECS Task Execution Role**
   - Trust: ecs-tasks.amazonaws.com
   - Managed policy: AmazonECSTaskExecutionRolePolicy
   - Custom policy:
     * Pull from ECR
     * Write to CloudWatch Logs
     * Read from Secrets Manager (all 3 secrets)

2. **ECS Task Role**
   - Trust: ecs-tasks.amazonaws.com
   - Custom policy:
     * Read from Secrets Manager (all 3 secrets)
     * Used by application code at runtime

3. **VPC Flow Logs Role**
   - Trust: vpc-flow-logs.amazonaws.com
   - Policy: Create/write CloudWatch log streams

4. **RDS Monitoring Role**
   - Trust: monitoring.rds.amazonaws.com
   - Managed policy: AmazonRDSEnhancedMonitoringRole

**Security:** Least-privilege access, separate execution and task roles

### 3.12 cloudwatch.tf
**Purpose:** Logging and monitoring

**Resources:**

1. **Log Groups**
   - /ecs/karematch (ECS tasks)
   - /aws/vpc/karematch (VPC Flow Logs)
   - Retention: 30 days

2. **Metric Alarms**
   - ECS CPU utilization (created in ecs.tf auto-scaling)
   - ECS memory utilization (created in ecs.tf auto-scaling)
   - RDS CPU utilization (created in rds.tf)
   - RDS storage space (created in rds.tf)

3. **Dashboard** (optional)
   - ECS metrics: CPU, memory, running tasks
   - ALB metrics: request count, target response time, HTTP errors
   - RDS metrics: CPU, connections, IOPS

### 3.13 outputs.tf
**Purpose:** Display important values after deployment

**Outputs:**
- vpc_id
- public_subnet_ids
- private_subnet_ids
- alb_dns_name (for accessing application)
- alb_zone_id (for Route53)
- cloudfront_domain_name (for frontend)
- cloudfront_distribution_id (for cache invalidation)
- rds_endpoint
- rds_port
- ecr_repository_url (for docker push)
- ecs_cluster_name
- ecs_service_name
- secrets_arns (DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET)

**Usage:** Copy values for deployment scripts and DNS configuration

---

## 📜 STEP 4: Create Deployment Scripts

### Directory Structure
```
scripts/
├── setup-infrastructure.sh   # Run Terraform, create infrastructure
├── build-and-push.sh          # Build Docker image, push to ECR
├── deploy-backend.sh          # Deploy new ECS task, update service
├── deploy-frontend.sh         # Build Vite, sync to S3, invalidate CloudFront
└── deploy-all.sh              # Full deployment (backend + frontend)
```

### 4.1 setup-infrastructure.sh
**Purpose:** Initialize AWS infrastructure

**Steps:**
```bash
#!/bin/bash
set -e  # Exit on error

# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan (show what will be created)
terraform plan -out=tfplan

# Prompt for confirmation
read -p "Apply this plan? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  exit 1
fi

# Apply infrastructure
terraform apply tfplan

# Extract outputs
export ALB_URL=$(terraform output -raw alb_dns_name)
export ECR_URL=$(terraform output -raw ecr_repository_url)
export CLOUDFRONT_URL=$(terraform output -raw cloudfront_domain_name)
export RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Display outputs
echo "===================================="
echo "Infrastructure Created Successfully!"
echo "===================================="
echo "ALB URL: http://$ALB_URL"
echo "CloudFront URL: https://$CLOUDFRONT_URL"
echo "ECR Repository: $ECR_URL"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo "===================================="

# Run database migrations
echo "Running database migrations..."
cd ..
DATABASE_URL="postgresql://postgres:$DB_PASSWORD@$RDS_ENDPOINT:5432/karematch?sslmode=require" npm run db:push

echo "Setup complete!"
```

**Usage:** Run once to create all AWS resources

### 4.2 build-and-push.sh
**Purpose:** Build Docker image and push to ECR

**Steps:**
```bash
#!/bin/bash
set -e

# Get ECR repository URL from Terraform
cd terraform
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform output -raw aws_region)
cd ..

# Generate image tag (git commit hash + timestamp)
IMAGE_TAG=$(git rev-parse --short HEAD)-$(date +%s)

echo "Building Docker image..."
docker build -t karematch:$IMAGE_TAG .
docker build -t karematch:latest .

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_URL

echo "Tagging images..."
docker tag karematch:$IMAGE_TAG $ECR_URL:$IMAGE_TAG
docker tag karematch:latest $ECR_URL:latest

echo "Pushing to ECR..."
docker push $ECR_URL:$IMAGE_TAG
docker push $ECR_URL:latest

echo "===================================="
echo "Image pushed successfully!"
echo "ECR Image: $ECR_URL:$IMAGE_TAG"
echo "ECR Image: $ECR_URL:latest"
echo "===================================="

# Return image URI for deployment
echo $ECR_URL:latest
```

**Usage:** Run whenever code changes need to be deployed

### 4.3 deploy-backend.sh
**Purpose:** Deploy new version to ECS

**Steps:**
```bash
#!/bin/bash
set -e

# Build and push image
IMAGE_URI=$(./scripts/build-and-push.sh)

# Get ECS details from Terraform
cd terraform
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
SERVICE_NAME=$(terraform output -raw ecs_service_name)
AWS_REGION=$(terraform output -raw aws_region)
cd ..

echo "Updating ECS service with new image..."
echo "Cluster: $CLUSTER_NAME"
echo "Service: $SERVICE_NAME"
echo "Image: $IMAGE_URI"

# Force new deployment (ECS will pull latest image)
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION

echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION

echo "===================================="
echo "Backend deployed successfully!"
echo "===================================="

# Show running tasks
aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --region $AWS_REGION
```

**Usage:** Run to deploy backend code changes

### 4.4 deploy-frontend.sh
**Purpose:** Build frontend and deploy to S3/CloudFront

**Steps:**
```bash
#!/bin/bash
set -e

# Build frontend
echo "Building frontend with Vite..."
npm run build

# Get S3 and CloudFront details from Terraform
cd terraform
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
AWS_REGION=$(terraform output -raw aws_region)
cd ..

echo "Syncing to S3 bucket: $S3_BUCKET"
aws s3 sync client/dist/ s3://$S3_BUCKET/ \
  --delete \
  --region $AWS_REGION \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# index.html should not be cached
aws s3 cp client/dist/index.html s3://$S3_BUCKET/index.html \
  --region $AWS_REGION \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*"

echo "===================================="
echo "Frontend deployed successfully!"
echo "CloudFront URL: https://$(cd terraform && terraform output -raw cloudfront_domain_name)"
echo "===================================="
```

**Usage:** Run to deploy frontend changes

### 4.5 deploy-all.sh
**Purpose:** Full deployment (backend + frontend)

**Steps:**
```bash
#!/bin/bash
set -e

echo "===================================="
echo "Full Deployment Starting"
echo "===================================="

# Deploy backend
echo "Step 1: Deploying backend..."
./scripts/deploy-backend.sh

# Deploy frontend
echo "Step 2: Deploying frontend..."
./scripts/deploy-frontend.sh

# Get URLs
cd terraform
ALB_URL=$(terraform output -raw alb_dns_name)
CLOUDFRONT_URL=$(terraform output -raw cloudfront_domain_name)
cd ..

echo "===================================="
echo "Deployment Complete!"
echo "===================================="
echo "Backend (ALB): http://$ALB_URL"
echo "Frontend (CloudFront): https://$CLOUDFRONT_URL"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Test application at CloudFront URL"
echo "2. Check ALB health checks: aws elbv2 describe-target-health"
echo "3. View ECS logs: aws logs tail /ecs/karematch --follow"
echo "4. If all looks good, update DNS to point to CloudFront"
```

**Usage:** Run for complete deployment

### Script Permissions
All scripts should be executable:
```bash
chmod +x scripts/*.sh
```

---

## ⚙️ STEP 5: Update Configuration

### 5.1 .env.aws.example
**Purpose:** Document AWS environment variables

**Location:** `C:\KareMatch\.env.aws.example`

**Contents:**
```bash
# AWS Production Environment Variables
# These are loaded from AWS Secrets Manager in production

NODE_ENV=production
AWS_REGION=us-east-1
PORT=5000

# Secrets (loaded from AWS Secrets Manager automatically)
# Do NOT set these in .env file for production
# DATABASE_URL=<loaded from Secrets Manager>
# ENCRYPTION_KEY=<loaded from Secrets Manager>
# SESSION_SECRET=<loaded from Secrets Manager>

# Local Development (use .env.local)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/karematch
# ENCRYPTION_KEY=test-encryption-key-32-bytes-long-12345
# SESSION_SECRET=test-session-secret-change-in-production
```

### 5.2 package.json Updates
**Purpose:** Add AWS deployment scripts

**Location:** `C:\KareMatch\package.json`

**Add to scripts section:**
```json
{
  "scripts": {
    "docker:build": "docker build -t karematch .",
    "docker:run": "docker run -p 5000:5000 --env-file .env karematch",
    "docker:compose:up": "docker-compose up",
    "docker:compose:down": "docker-compose down",
    "aws:setup": "bash scripts/setup-infrastructure.sh",
    "aws:build": "bash scripts/build-and-push.sh",
    "aws:deploy:backend": "bash scripts/deploy-backend.sh",
    "aws:deploy:frontend": "bash scripts/deploy-frontend.sh",
    "aws:deploy": "bash scripts/deploy-all.sh"
  }
}
```

**Usage Examples:**
```bash
npm run docker:build              # Test Docker build locally
npm run docker:compose:up         # Test with local PostgreSQL
npm run aws:setup                 # Create AWS infrastructure
npm run aws:deploy                # Full deployment to AWS
```

---

## 📚 STEP 6: Documentation

### 6.1 AWS-DEPLOYMENT.md
**Purpose:** Complete deployment guide

**Location:** `C:\KareMatch\docs/AWS-DEPLOYMENT.md`

**Sections:**
1. **Prerequisites**
   - AWS account with appropriate permissions
   - AWS CLI installed and configured
   - Terraform >= 1.0 installed
   - Docker installed
   - Node.js 20+ installed

2. **Initial Setup**
   - Configure AWS credentials
   - Clone repository
   - Checkout aws-migration branch
   - Install dependencies

3. **Infrastructure Setup**
   - Customize terraform/variables.tf
   - Run terraform init
   - Run terraform plan
   - Run terraform apply
   - Note down outputs

4. **Database Setup**
   - Run migrations: npm run db:push
   - Seed data: npm run db:seed
   - Verify connection

5. **Application Deployment**
   - Build Docker image
   - Push to ECR
   - Deploy to ECS
   - Deploy frontend to S3/CloudFront

6. **DNS Configuration**
   - Create CNAME for CloudFront distribution
   - Update ALB alias in Route53 (optional)

7. **Post-Deployment**
   - Test health endpoints
   - Check CloudWatch logs
   - Verify HTTPS works
   - Test application functionality

8. **Troubleshooting**
   - ECS tasks failing to start
   - Database connection errors
   - Secrets Manager access denied
   - CloudFront caching issues
   - SSL certificate problems

9. **Cost Estimates**
   - Monthly breakdown: ~$275/month
     * ECS Fargate (2 tasks): ~$30
     * RDS Multi-AZ db.t3.medium: ~$150
     * ALB: ~$20
     * NAT Gateway: ~$35
     * CloudFront: ~$10
     * S3/ECR/CloudWatch: ~$10
     * Data transfer: ~$20

10. **HIPAA Compliance Checklist**
    - ✓ Encryption at rest (RDS, S3)
    - ✓ Encryption in transit (SSL/TLS)
    - ✓ Audit logging (CloudTrail, VPC Flow Logs, RDS logs)
    - ✓ Access controls (IAM, security groups)
    - ✓ Automated backups (RDS 30 days)
    - ✓ Multi-AZ redundancy
    - ✓ No public database access
    - ✓ Secrets management (AWS Secrets Manager)

### 6.2 AWS-ARCHITECTURE.md
**Purpose:** System architecture documentation

**Location:** `C:\KareMatch\docs/AWS-ARCHITECTURE.md`

**Sections:**
1. **Architecture Diagram** (ASCII or link to diagram)
   ```
   Internet
      |
   CloudFront (CDN)
      |
   S3 (Frontend)

   Internet
      |
   Route53 (DNS)
      |
   ALB (Load Balancer)
      |
   ECS Fargate (2+ tasks)
      |
   RDS PostgreSQL (Multi-AZ)

   Secrets Manager → ECS (at startup)
   ECR → ECS (image pull)
   CloudWatch ← Everything (logs)
   ```

2. **Component Descriptions**
   - VPC and networking
   - Application Load Balancer
   - ECS Fargate tasks
   - RDS PostgreSQL database
   - S3 and CloudFront
   - Secrets Manager
   - IAM roles

3. **Network Flow**
   - User request flow
   - Internal communication
   - Database connections
   - Secrets loading

4. **Security Architecture**
   - Network isolation
   - Encryption layers
   - Access control
   - Audit logging

5. **High Availability**
   - Multi-AZ deployment
   - Auto-scaling
   - Health checks
   - Automated recovery

6. **Disaster Recovery**
   - RDS automated backups
   - Point-in-time recovery
   - Infrastructure as Code (Terraform)
   - Rollback procedures

### 6.3 README.md Updates
**Purpose:** Update main README with AWS information

**Location:** `C:\KareMatch\README.md`

**Add AWS Deployment Section:**
```markdown
## AWS Deployment

### Architecture
KareMatch is deployed on AWS using:
- ECS Fargate for containerized application
- RDS PostgreSQL for database
- CloudFront + S3 for frontend hosting
- Application Load Balancer for HTTPS
- AWS Secrets Manager for secret management

### Quick Start
```bash
# Deploy infrastructure
npm run aws:setup

# Deploy application
npm run aws:deploy
```

### Documentation
- [Complete AWS Deployment Guide](docs/AWS-DEPLOYMENT.md)
- [AWS Architecture Documentation](docs/AWS-ARCHITECTURE.md)

### Cost
Estimated monthly cost: ~$275 for production deployment

### HIPAA Compliance
AWS deployment includes:
- Encryption at rest and in transit
- Audit logging
- Multi-AZ redundancy
- Automated backups
- Private networking
```

---

## ✅ VALIDATION CHECKLIST

### Before Starting
- [x] aws-migration branch created
- [x] Git status clean on aws-migration
- [ ] AWS account access verified
- [ ] AWS CLI configured
- [ ] Terraform installed
- [ ] Docker installed

### After Each Step
- [ ] Docker builds successfully
- [ ] docker-compose.yml works locally
- [ ] Health endpoint responds
- [ ] Terraform validate passes
- [ ] Terraform plan succeeds
- [ ] All security groups follow least privilege
- [ ] RDS has encryption enabled
- [ ] Secrets Manager secrets created
- [ ] CloudWatch logging enabled
- [ ] HTTPS enforced on ALB
- [ ] CloudFront serves frontend correctly

---

## 🚨 CONSTRAINTS & IMPORTANT NOTES

### Must Preserve
- ✅ All business logic unchanged
- ✅ All Drizzle schema/queries identical
- ✅ All API routes preserved
- ✅ Session-based authentication maintained
- ✅ No changes to client-side code (except build process)

### Branch Rules
- ❌ DO NOT modify render.yaml on aws-migration
- ❌ DO NOT merge to main until AWS proven stable
- ❌ DO NOT touch render-deployment branch
- ✅ Keep main branch deploying to Render
- ✅ Test thoroughly on aws-migration
- ✅ Document all AWS-specific changes

### Security Requirements
- ✅ All secrets in Secrets Manager (never in code)
- ✅ Private subnets for ECS and RDS
- ✅ SSL/TLS everywhere
- ✅ Force HTTPS redirects
- ✅ Security groups: least privilege
- ✅ VPC Flow Logs enabled
- ✅ CloudTrail enabled
- ✅ RDS encryption + backups

### Testing Strategy
1. Test Docker build locally with docker-compose
2. Deploy to AWS on aws-migration branch
3. Test AWS deployment thoroughly
4. Run parallel with Render (both live)
5. Compare behavior, performance, costs
6. When stable, consider cutover

---

## 📊 Success Metrics

### Technical Validation
- [ ] Application builds in Docker successfully
- [ ] All tests pass in containerized environment
- [ ] Database migrations run successfully on RDS
- [ ] Health checks pass on ALB
- [ ] ECS tasks run without errors
- [ ] Frontend loads from CloudFront
- [ ] API calls work through ALB
- [ ] Session persistence works
- [ ] Authentication flows work
- [ ] All features functional

### Performance Validation
- [ ] Page load times acceptable (< 2s)
- [ ] API response times acceptable (< 500ms)
- [ ] Database query performance good
- [ ] Auto-scaling works correctly
- [ ] No memory leaks in containers

### Security Validation
- [ ] All secrets loaded from Secrets Manager
- [ ] Database not publicly accessible
- [ ] HTTPS enforced (no HTTP)
- [ ] Security groups properly configured
- [ ] CloudTrail logging active
- [ ] VPC Flow Logs active
- [ ] No secrets in code or logs

### Cost Validation
- [ ] Monthly costs within budget (~$275)
- [ ] No unexpected charges
- [ ] Resource utilization appropriate

---

## 🎯 End Goal

**Target State:**
- Render.com deployment (main branch) continues working
- AWS deployment (aws-migration branch) fully functional
- Both can run in parallel during testing period
- Ready to cutover to AWS when confident
- Full rollback capability if needed

**Success Criteria:**
- Zero production downtime
- All features working on AWS
- HIPAA compliance maintained
- Costs predictable and acceptable
- Team comfortable with AWS operations

---

**Document Status:** ✅ COMPLETE - Ready for implementation
**Last Updated:** 2025-10-19
**Next Step:** Review with team, then begin STEP 1 (Docker Container)
