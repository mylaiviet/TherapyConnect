# TherapyConnect AWS Migration Plan
## Lightsail + RDS Architecture for Low-Volume HIPAA Deployment

**Date:** October 19, 2025  
**Version:** 1.0  
**Target Cost:** $22.50/month  
**AWS Activate Credits:** $1,000 (covers 44 months)  

---

## Executive Summary

Migrating TherapyConnect from Render.com + Neon Database to AWS using a cost-optimized architecture designed for low-volume (<100 users/month) HIPAA-compliant operations.

**Key Decisions:**
- Use AWS Lightsail Container Service instead of ECS Fargate (saves $30/mo)
- Single-AZ RDS instead of Multi-AZ (saves $22/mo)
- Parameter Store instead of Secrets Manager (saves $1.20/mo)
- No NAT Gateway required with Lightsail (saves $32/mo)

**Total Savings:** $85/month compared to standard AWS architecture

---

## Current State (Render + Neon)

### Architecture
- **Hosting:** Render.com ($7/mo)
- **Database:** Neon Serverless Postgres ($69/mo Scale plan with HIPAA)
- **Frontend:** Bundled with backend (Vite SSR)
- **SSL:** Render-managed
- **Deployment:** Git push to main branch
- **Total Cost:** $76/month

### Issues
- Neon requires Scale plan for HIPAA BAA
- Split infrastructure (Render + external DB)
- No AWS consolidation
- Monthly cost relatively high for low volume

---

## Target State (AWS Lightsail + RDS)

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ Route 53 (DNS)                                      │
│ yourdomain.com → CloudFront                         │
│ app.yourdomain.com → Lightsail Container            │
└────────────┬───────────────────────────┬────────────┘
             │                           │
    ┌────────▼────────┐         ┌────────▼────────────┐
    │   CloudFront    │         │ Lightsail Container │
    │   + S3 Bucket   │         │   Service           │
    │   (Static)      │         │   - 512MB RAM       │
    │                 │         │   - 0.25 vCPU       │
    └─────────────────┘         │   - Built-in LB     │
                                │   - Auto SSL        │
                                └────────┬────────────┘
                                         │
                                ┌────────▼────────────┐
                                │  RDS PostgreSQL 15  │
                                │  db.t4g.micro       │
                                │  - 1GB RAM          │
                                │  - 20GB storage     │
                                │  - Encrypted        │
                                │  - Auto backups     │
                                └─────────────────────┘
```

### Components

#### 1. AWS Lightsail Container Service
- **Purpose:** Host Dockerized Node.js/Express backend
- **Specs:** 512MB RAM, 0.25 vCPU (Nano plan)
- **Cost:** $7/month
- **Features:**
  - Built-in load balancer (included, no extra cost)
  - Automatic HTTPS/SSL certificates
  - Container registry included
  - Managed deployment (push image → auto-deploy)
  - Public endpoint with custom domain support
- **HIPAA:** ✅ Eligible with BAA

#### 2. Amazon RDS PostgreSQL
- **Instance:** db.t4g.micro (ARM-based, cheaper)
- **Storage:** 20GB GP3 (encrypted at rest)
- **Backups:** 7-day automated backups
- **Multi-AZ:** No (Single-AZ for cost savings)
- **Cost:** $12/month
- **Features:**
  - Encryption at rest (required for HIPAA)
  - Encryption in transit (SSL required)
  - Automated backups
  - Point-in-time recovery
- **HIPAA:** ✅ Eligible with BAA

#### 3. S3 + CloudFront
- **Purpose:** Serve static frontend (React/Vite build)
- **S3 Bucket:** Private bucket with CloudFront OAI
- **CloudFront:** CDN with HTTPS, custom domain
- **Cost:** ~$1/month (storage + requests)
- **HIPAA:** ✅ Eligible with BAA (though no PHI in frontend)

#### 4. AWS Systems Manager Parameter Store
- **Purpose:** Store secrets (DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET)
- **Type:** SecureString (encrypted with KMS)
- **Cost:** FREE (<10,000 API calls/month)
- **Alternative:** Secrets Manager ($0.40/secret/month = $1.20/mo)
- **HIPAA:** ✅ Eligible with BAA

#### 5. Amazon CloudWatch Logs
- **Purpose:** Application logs, error tracking
- **Retention:** 30 days
- **Cost:** ~$2/month (5GB ingestion)
- **HIPAA:** ✅ Eligible with BAA

#### 6. Route 53
- **Purpose:** DNS management
- **Cost:** $0.50/month per hosted zone
- **Features:** Custom domain routing
- **HIPAA:** Not applicable (no PHI)

---

## Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| Lightsail Container | 512MB RAM, 0.25 vCPU | $7.00 |
| RDS PostgreSQL | db.t4g.micro, 20GB | $12.00 |
| S3 + CloudFront | <1GB storage, 10k requests | $1.00 |
| CloudWatch Logs | 5GB ingestion | $2.00 |
| Route 53 | 1 hosted zone | $0.50 |
| Parameter Store | 3 secrets, <10k calls | $0.00 |
| **TOTAL** | | **$22.50/month** |

### AWS Activate Credit Utilization
- **Total Credits:** $1,000
- **Monthly Burn:** $22.50
- **Coverage Duration:** 44 months (3.7 years)
- **Credit Expiration:** 24 months
- **Credits Used Before Expiry:** $540
- **Credits Wasted:** $460 (unless you scale up)

### Comparison with Original Plan

| Component | ECS Stack | Lightsail Stack | Savings |
|-----------|-----------|-----------------|---------|
| Compute | ECS Fargate: $37 | Lightsail: $7 | **$30** |
| Database | RDS Multi-AZ: $44 | RDS Single-AZ: $12 | **$32** |
| Load Balancer | ALB: $19 | Built-in: $0 | **$19** |
| NAT Gateway | $32 | Not needed: $0 | **$32** |
| Secrets | Secrets Mgr: $1.20 | Param Store: $0 | **$1.20** |
| Other | $5 | $3.50 | **$1.50** |
| **TOTAL** | **$138/mo** | **$22.50/mo** | **$115.50** |

---

## Migration Phases

### Phase 0: Pre-Migration (Week 1)
**Owner:** DevOps/Developer  
**Duration:** 3-5 hours

**Tasks:**
1. ✅ Sign AWS Business Associate Agreement (BAA)
   - AWS Console → Artifact → Agreements → Accept BAA
   - Required for HIPAA compliance
   
2. ✅ Create AWS Account Structure
   - Set up billing alerts ($30, $50, $100)
   - Apply AWS Activate credits
   - Enable MFA on root account
   
3. ✅ Register Domain (if not owned)
   - Purchase domain via Route 53 or external registrar
   - Create hosted zone in Route 53
   
4. ✅ Document Current System
   - Export Neon database schema
   - Document environment variables
   - List all current integrations
   
5. ✅ Create `aws-migration` Git Branch
   ```bash
   git checkout -b render-deployment  # Freeze current
   git push origin render-deployment
   git checkout main
   git checkout -b aws-migration      # New work
   git push origin aws-migration
   ```

**Deliverables:**
- AWS account with BAA signed
- Git branch structure set up
- Domain registered and DNS configured

---

### Phase 1: Containerization (Week 1-2)
**Owner:** Developer  
**Duration:** 4-6 hours

**Tasks:**
1. ✅ Create Dockerfile
   - Multi-stage build (builder + runtime)
   - Build frontend (Vite)
   - Build backend (TypeScript → JS)
   - Production-ready Node.js image
   
2. ✅ Create .dockerignore
   - Exclude node_modules, .git, etc.
   
3. ✅ Create docker-compose.yml
   - Local development setup
   - PostgreSQL container for testing
   
4. ✅ Update Application Code
   - Add `/health` endpoint for health checks
   - Create `server/lib/secrets.ts` for Parameter Store integration
   - Update `server/db.ts` for RDS SSL configuration
   - Update `server/routes.ts` for production session store
   
5. ✅ Test Locally
   ```bash
   docker-compose up --build
   # Test: http://localhost:5000/health
   # Test: Full application functionality
   ```

**Deliverables:**
- Working Docker container
- Application code updated for AWS
- Local testing passed

**Files Created:**
- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`
- `server/lib/secrets.ts`
- Updated `server/db.ts`
- Updated `server/index.ts`
- Updated `server/routes.ts`

---

### Phase 2: Infrastructure Setup (Week 2)
**Owner:** DevOps/Developer  
**Duration:** 3-4 hours

**Tasks:**

#### 2.1: Create RDS Database
```bash
# AWS Console → RDS → Create Database
# OR use AWS CLI:
aws rds create-db-instance \
  --db-instance-identifier therapyconnect-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --no-multi-az \
  --publicly-accessible \
  --vpc-security-group-ids <SECURITY_GROUP_ID>
```

**Configuration:**
- Engine: PostgreSQL 15.4
- Instance: db.t4g.micro
- Storage: 20GB GP3, encrypted
- Backups: 7 days
- Public access: Yes (temporary, for setup)
- Security group: Allow 5432 from your IP + Lightsail

**Cost:** $12/month

#### 2.2: Configure Security Group
```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name therapyconnect-rds-sg \
  --description "RDS access for TherapyConnect"

# Allow PostgreSQL from Lightsail (update after Lightsail created)
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp \
  --port 5432 \
  --cidr <LIGHTSAIL_IP>/32
```

#### 2.3: Store Secrets in Parameter Store
```bash
# Generate secure encryption key (32 bytes)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 48)

# Store in Parameter Store
aws ssm put-parameter \
  --name "/therapyconnect/database-url" \
  --value "postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/therapyconnect?sslmode=require" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/therapyconnect/encryption-key" \
  --value "$ENCRYPTION_KEY" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/therapyconnect/session-secret" \
  --value "$SESSION_SECRET" \
  --type "SecureString"
```

#### 2.4: Initialize Database Schema
```bash
# Connect to RDS and run migrations
export DATABASE_URL="postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/therapyconnect?sslmode=require"

# Push schema to RDS
npm run db:push

# Seed data (optional)
npm run db:seed
```

**Deliverables:**
- RDS instance running
- Security group configured
- Secrets stored in Parameter Store
- Database schema initialized

---

### Phase 3: Deploy Backend (Week 2)
**Owner:** Developer  
**Duration:** 2-3 hours

**Tasks:**

#### 3.1: Create Lightsail Container Service
```bash
# Create container service
aws lightsail create-container-service \
  --service-name therapyconnect \
  --power nano \
  --scale 1

# Wait for service to be active
aws lightsail get-container-services \
  --service-name therapyconnect
```

**Configuration:**
- Power: Nano (512MB RAM, 0.25 vCPU)
- Scale: 1 container
- Cost: $7/month

#### 3.2: Build and Push Container Image
```bash
# Build Docker image
docker build -t therapyconnect:latest .

# Push to Lightsail
aws lightsail push-container-image \
  --service-name therapyconnect \
  --label therapyconnect \
  --image therapyconnect:latest
```

#### 3.3: Create Deployment Configuration
Create `lightsail-deployment.json`:
```json
{
  "serviceName": "therapyconnect",
  "containers": {
    "app": {
      "image": ":therapyconnect.latest",
      "ports": {
        "5000": "HTTP"
      },
      "environment": {
        "NODE_ENV": "production",
        "PORT": "5000",
        "AWS_REGION": "us-east-1"
      }
    }
  },
  "publicEndpoint": {
    "containerName": "app",
    "containerPort": 5000,
    "healthCheck": {
      "path": "/health",
      "intervalSeconds": 30
    }
  }
}
```

#### 3.4: Deploy Container
```bash
# Deploy to Lightsail
aws lightsail create-container-service-deployment \
  --cli-input-json file://lightsail-deployment.json

# Wait for deployment to complete
aws lightsail get-container-services \
  --service-name therapyconnect
```

#### 3.5: Configure IAM Permissions
Create IAM role for Lightsail to access Parameter Store:
```bash
# Create IAM policy
aws iam create-policy \
  --policy-name LightsailParameterStoreAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/therapyconnect/*"
    }]
  }'

# Attach to Lightsail service role
# (This may require manual configuration in AWS Console)
```

#### 3.6: Enable Custom Domain
```bash
# Enable HTTPS on Lightsail
aws lightsail create-container-service-deployment \
  --service-name therapyconnect \
  --public-endpoint '{"containerName":"app","containerPort":5000,"healthCheck":{"path":"/health"}}'

# Get Lightsail endpoint
aws lightsail get-container-services \
  --service-name therapyconnect \
  --query 'containerServices[0].url'
```

**Deliverables:**
- Lightsail container service running
- Application deployed and accessible
- Health check passing
- Custom domain configured

---

### Phase 4: Deploy Frontend (Week 2)
**Owner:** Developer  
**Duration:** 1-2 hours

**Tasks:**

#### 4.1: Create S3 Bucket for Frontend
```bash
# Create S3 bucket
aws s3 mb s3://therapyconnect-frontend

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket therapyconnect-frontend \
  --versioning-configuration Status=Enabled

# Block public access (CloudFront will access via OAI)
aws s3api put-public-access-block \
  --bucket therapyconnect-frontend \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### 4.2: Create CloudFront Distribution
```bash
# Create CloudFront Origin Access Identity
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference=therapyconnect-$(date +%s),Comment="TherapyConnect S3 access"

# Create CloudFront distribution (use AWS Console for easier setup)
# OR use CLI with distribution config JSON
```

**CloudFront Configuration:**
- Origin: S3 bucket with OAI
- Default root object: `index.html`
- Error pages: 404 → `/index.html` (for SPA routing)
- SSL: Use ACM certificate
- Custom domain: yourdomain.com

#### 4.3: Request SSL Certificate
```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Add DNS validation records to Route 53
# (AWS will provide CNAME records to add)
```

#### 4.4: Build and Deploy Frontend
```bash
# Build Vite frontend
npm run build

# Sync to S3
aws s3 sync dist/public/ s3://therapyconnect-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

#### 4.5: Configure DNS
```bash
# Create Route 53 records
# A record for apex domain → CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "<CLOUDFRONT_DOMAIN>",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# CNAME for app subdomain → Lightsail
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<LIGHTSAIL_ENDPOINT>"}]
      }
    }]
  }'
```

**Deliverables:**
- S3 bucket with frontend assets
- CloudFront distribution serving frontend
- SSL certificates issued and configured
- Custom domain pointing to CloudFront and Lightsail

---

### Phase 5: Data Migration (Week 3)
**Owner:** Developer  
**Duration:** 2-3 hours

**Tasks:**

#### 5.1: Export Data from Neon
```bash
# Dump production database
pg_dump $NEON_DATABASE_URL > neon_production_backup.sql

# Verify backup
grep -c "COPY" neon_production_backup.sql
```

#### 5.2: Import Data to RDS
```bash
# Import to RDS
psql $RDS_DATABASE_URL < neon_production_backup.sql

# Verify data
psql $RDS_DATABASE_URL -c "SELECT COUNT(*) FROM therapists;"
psql $RDS_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

#### 5.3: Test Application with Production Data
```bash
# Update local .env to point to RDS
export DATABASE_URL="<RDS_URL>"

# Run application locally
npm run dev

# Test critical flows:
# - User login
# - Therapist search
# - Appointment booking
# - Chatbot conversation
```

#### 5.4: Backup Strategy
```bash
# RDS automated backups are already enabled (7 days)
# Create manual snapshot before migration
aws rds create-db-snapshot \
  --db-instance-identifier therapyconnect-db \
  --db-snapshot-identifier therapyconnect-pre-migration-$(date +%Y%m%d)
```

**Deliverables:**
- Production data exported from Neon
- Data imported to RDS
- Application tested with production data
- Backup snapshots created

---

### Phase 6: Testing & Validation (Week 3)
**Owner:** Developer + QA  
**Duration:** 4-6 hours

**Test Checklist:**

#### Functional Testing
- [ ] User Registration
  - Create new therapist account
  - Verify email validation
  - Check password hashing
  
- [ ] User Login
  - Login with correct credentials
  - Login with wrong credentials (should fail)
  - Session persistence across page reloads
  
- [ ] Therapist Profile
  - Create profile with all fields
  - Update profile
  - Submit for review
  - Verify photo upload works
  
- [ ] Therapist Search
  - Search by city
  - Search by ZIP code
  - Filter by specialties
  - Filter by insurance
  - Verify proximity filtering works
  
- [ ] Appointment Booking
  - View available time slots
  - Book appointment (instant confirmation)
  - Book appointment (request mode)
  - Cancel appointment
  - View appointment details
  
- [ ] Chatbot
  - Start new conversation
  - Complete full matching flow
  - Test crisis detection (use test keywords)
  - Verify therapist recommendations
  - Test human escalation
  
- [ ] Admin Functions
  - Login as admin
  - View pending therapists
  - Approve therapist
  - Reject therapist

#### Performance Testing
- [ ] Health check responds in <100ms
- [ ] API endpoints respond in <500ms
- [ ] Database queries execute in <200ms
- [ ] Frontend loads in <2 seconds

#### Security Testing
- [ ] HTTPS enforced on all endpoints
- [ ] Session cookies have secure flag
- [ ] No PHI in application logs
- [ ] Database connections use SSL
- [ ] Secrets loaded from Parameter Store
- [ ] No credentials in code or containers

#### HIPAA Compliance Testing
- [ ] PHI encrypted at rest (RDS)
- [ ] PHI encrypted in transit (SSL)
- [ ] Appointment data (names, emails) stored securely
- [ ] Chatbot PHI tokenization works
- [ ] Audit logs captured in CloudWatch
- [ ] Session expiration works (7 days)

**Deliverables:**
- Test results documented
- All critical issues resolved
- Performance benchmarks recorded

---

### Phase 7: Production Cutover (Week 4)
**Owner:** DevOps/Developer  
**Duration:** 2-3 hours

**Pre-Cutover Checklist:**
- [ ] AWS BAA signed
- [ ] All tests passing
- [ ] Production data migrated
- [ ] DNS records prepared
- [ ] Monitoring configured
- [ ] Backup strategy verified
- [ ] Rollback plan documented

**Cutover Steps:**

#### 7.1: Final Data Sync
```bash
# 15 minutes before cutover: Final incremental sync
pg_dump $NEON_DATABASE_URL --data-only > final_sync.sql
psql $RDS_DATABASE_URL < final_sync.sql
```

#### 7.2: Update DNS (Low-traffic window recommended)
```bash
# Lower TTL 24 hours before cutover
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"app.yourdomain.com","Type":"CNAME","TTL":60,"ResourceRecords":[{"Value":"<OLD_ENDPOINT>"}]}}]}'

# At cutover time: Point to Lightsail
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"app.yourdomain.com","Type":"CNAME","TTL":300,"ResourceRecords":[{"Value":"<LIGHTSAIL_ENDPOINT>"}]}}]}'
```

#### 7.3: Monitor for 1 Hour
```bash
# Watch CloudWatch logs
aws logs tail /aws/lightsail/therapyconnect --follow

# Monitor health checks
watch -n 10 'curl -s https://app.yourdomain.com/health | jq'

# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lightsail \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=ServiceName,Value=therapyconnect \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

#### 7.4: Verify Production Functionality
- [ ] Login works
- [ ] Search works
- [ ] Appointments work
- [ ] Chatbot works
- [ ] No errors in logs

#### 7.5: Update Render Deployment (Keep as Backup)
```bash
# Change Render branch to render-deployment (frozen)
# Keep Render service running for 7 days as fallback
# DNS can be reverted if issues found
```

**Deliverables:**
- Production running on AWS
- Monitoring active
- Old infrastructure kept as backup

---

### Phase 8: Cleanup & Documentation (Week 4)
**Owner:** Developer  
**Duration:** 2-3 hours

**Tasks:**

#### 8.1: Update Documentation
- [ ] Update README.md with AWS deployment instructions
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create runbook for common operations
- [ ] Document rollback procedures

#### 8.2: Remove Old Infrastructure (After 7 days)
```bash
# Pause Render service (don't delete yet)
# Keep Neon database for 30 days as backup

# After 30 days of stable AWS operation:
# - Delete Render service
# - Delete Neon database
# - Cancel Neon subscription
```

#### 8.3: Set Up Monitoring Alerts
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name therapyconnect-high-error-rate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/Lightsail \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create billing alert
aws cloudwatch put-metric-alarm \
  --alarm-name therapyconnect-budget-alert \
  --alarm-description "Alert when spend > $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

#### 8.4: Merge to Main Branch
```bash
# After successful production deployment
git checkout main
git merge aws-migration
git push origin main

# Keep render-deployment branch as reference
# Keep aws-migration branch for historical reference
```

**Deliverables:**
- Complete documentation
- Monitoring alerts configured
- Old infrastructure cleaned up
- Git branches organized

---

## Deployment Scripts

### Script 1: `scripts/build-and-push.sh`
```bash
#!/bin/bash
set -e

echo "Building Docker image..."
docker build -t therapyconnect:latest .

echo "Pushing to Lightsail..."
aws lightsail push-container-image \
  --service-name therapyconnect \
  --label therapyconnect \
  --image therapyconnect:latest

echo "Image pushed successfully!"
```

### Script 2: `scripts/deploy-backend.sh`
```bash
#!/bin/bash
set -e

SERVICE_NAME="therapyconnect"

# Build and push image
./scripts/build-and-push.sh

# Deploy to Lightsail
echo "Deploying to Lightsail..."
aws lightsail create-container-service-deployment \
  --cli-input-json file://lightsail-deployment.json

# Wait for deployment
echo "Waiting for deployment to complete..."
aws lightsail get-container-services \
  --service-name $SERVICE_NAME \
  --query 'containerServices[0].state' \
  --output text

echo "Deployment complete!"
```

### Script 3: `scripts/deploy-frontend.sh`
```bash
#!/bin/bash
set -e

BUCKET_NAME="therapyconnect-frontend"
DISTRIBUTION_ID="<YOUR_CLOUDFRONT_ID>"

# Build frontend
echo "Building frontend..."
npm run build

# Sync to S3
echo "Syncing to S3..."
aws s3 sync dist/public/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=31536000"

# Invalidate CloudFront
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Frontend deployment complete!"
```

### Script 4: `scripts/deploy-all.sh`
```bash
#!/bin/bash
set -e

echo "===== DEPLOYING THERAPYCONNECT TO AWS ====="

# Deploy backend
echo ""
echo "Step 1: Deploying backend to Lightsail..."
./scripts/deploy-backend.sh

# Deploy frontend
echo ""
echo "Step 2: Deploying frontend to S3/CloudFront..."
./scripts/deploy-frontend.sh

echo ""
echo "===== DEPLOYMENT COMPLETE ====="
echo "Backend: https://app.yourdomain.com"
echo "Frontend: https://yourdomain.com"
```

---

## Environment Variables

### Development (.env)
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/therapyconnect
SESSION_SECRET=dev-secret-change-me
ENCRYPTION_KEY=dev-encryption-key-32-characters
```

### Production (AWS Parameter Store)
```bash
# Stored in AWS Systems Manager Parameter Store
/therapyconnect/database-url      # RDS connection string
/therapyconnect/encryption-key    # 32-byte encryption key
/therapyconnect/session-secret    # Session secret

# Set in Lightsail environment
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
```

---

## Rollback Plan

### Scenario 1: Deployment Failure (During Cutover)

**Symptoms:**
- Health checks failing
- 500 errors
- Database connection errors

**Rollback Steps:**
1. Revert DNS to Render endpoint (1 minute)
2. Verify Render still working
3. Investigate AWS issue
4. Fix and redeploy

**Commands:**
```bash
# Revert DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://rollback-dns.json

# Verify Render
curl https://app.yourdomain.com/health
```

### Scenario 2: Data Corruption

**Symptoms:**
- Missing data
- Incorrect data
- Query errors

**Rollback Steps:**
1. Stop writes to RDS
2. Restore from RDS snapshot
3. Re-import from Neon backup
4. Verify data integrity

**Commands:**
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier therapyconnect-db-restored \
  --db-snapshot-identifier therapyconnect-pre-migration-20251019

# Point application to restored DB
aws ssm put-parameter \
  --name "/therapyconnect/database-url" \
  --value "<RESTORED_DB_URL>" \
  --overwrite
```

### Scenario 3: Complete AWS Failure

**Symptoms:**
- AWS account suspended
- Region outage
- Total service failure

**Rollback Steps:**
1. Point DNS back to Render (still running)
2. Re-enable Neon database
3. Verify Render working
4. Investigate AWS issue

**Recovery Time:**
- DNS propagation: 5-10 minutes
- Total rollback time: 15 minutes

---

## Monitoring & Alerts

### CloudWatch Dashboards

Create custom dashboard:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name therapyconnect \
  --dashboard-body file://cloudwatch-dashboard.json
```

**Metrics to Monitor:**
- Lightsail CPU utilization
- Lightsail memory utilization
- RDS CPU utilization
- RDS database connections
- RDS free storage space
- HTTP 5xx error rate
- API response time
- Health check status

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | >60% | >80% |
| Memory Usage | >70% | >85% |
| Error Rate | >2% | >5% |
| Response Time | >500ms avg | >1000ms avg |
| RDS Connections | >50 | >80 |
| RDS Storage | <20% free | <10% free |

### On-Call Runbook

#### High Error Rate
1. Check CloudWatch logs for errors
2. Check RDS connectivity
3. Verify secrets in Parameter Store
4. Check application health endpoint
5. Restart container if needed

#### High Latency
1. Check RDS performance metrics
2. Check for slow queries
3. Check network connectivity
4. Scale up Lightsail if needed

#### Database Full
1. Check storage usage
2. Delete old logs/backups
3. Increase storage allocation
4. Optimize database

---

## HIPAA Compliance Checklist

### Technical Safeguards
- [x] Encryption at rest (RDS)
- [x] Encryption in transit (SSL/TLS)
- [x] Access controls (IAM, security groups)
- [x] Audit logging (CloudWatch)
- [x] Automatic logoff (session expiration)
- [x] Emergency access procedure (documented)

### Administrative Safeguards
- [x] BAA signed with AWS
- [x] Risk assessment performed
- [x] Security policies documented
- [x] Workforce training (documented)
- [x] Incident response plan

### Physical Safeguards
- [x] AWS data center physical security (inherited)
- [x] Workstation security (developer responsibility)
- [x] Device/media controls (no local PHI storage)

### PHI Handling
- [x] Appointments table: names, emails, phones (need encryption)
- [x] Chatbot tokens: encrypted with AES-256-GCM
- [x] Session data: encrypted in PostgreSQL
- [x] Logs: No PHI in application logs

### Audit Controls
- [x] CloudWatch logs: 30-day retention
- [x] RDS query logs: enabled
- [x] CloudTrail: enabled for all AWS API calls
- [x] Access logs: ALB logs (not needed with Lightsail)

### Breach Notification
- [ ] Incident response procedure documented
- [ ] Breach notification contacts identified
- [ ] 60-day notification timeline understood

---

## Cost Optimization Opportunities

### Current: $22.50/month

### If Traffic Increases (>500 users/month):

**Option 1: Scale Lightsail**
- Upgrade to Micro (1GB RAM): $10/mo → **$25.50/mo**
- Upgrade to Small (2GB RAM): $20/mo → **$35.50/mo**

**Option 2: Migrate to ECS**
- Switch to ECS Fargate + ALB + VPC
- Cost: $115/mo
- Benefits: Auto-scaling, better monitoring, enterprise-grade

### If Traffic Decreases:

**Option 1: Downgrade RDS**
- Use db.t4g.micro Serverless v2: $8/mo → **$18.50/mo**
- Scale to zero during non-peak hours

**Option 2: Combine Services**
- Run PostgreSQL in same Lightsail container
- Risk: Single point of failure
- Savings: $12/mo → **$10.50/mo total**

---

## Success Metrics

### Technical Metrics
- [ ] 99.9% uptime (allow 43 minutes downtime/month)
- [ ] <500ms average API response time
- [ ] <2 second frontend load time
- [ ] Zero PHI breaches
- [ ] <$30/month infrastructure cost

### Business Metrics
- [ ] Zero user complaints about performance
- [ ] Successful HIPAA audit readiness
- [ ] <1 hour to deploy updates
- [ ] AWS Activate credits lasting >24 months

### Migration Metrics
- [ ] Zero data loss during migration
- [ ] <1 hour total downtime
- [ ] All tests passing post-migration
- [ ] Documentation complete

---

## Future Enhancements

### Year 1 (Post-Migration)
- Add Redis cache for session storage
- Implement automated database backups to S3
- Add application performance monitoring (APM)
- Set up staging environment
- Implement blue-green deployments

### Year 2 (Scale-Up Phase)
- Migrate to ECS Fargate for auto-scaling
- Add WAF (Web Application Firewall)
- Implement Multi-AZ RDS
- Add read replicas for analytics
- Set up disaster recovery in second region

### Year 3 (Enterprise Phase)
- Implement microservices architecture
- Add API Gateway
- Implement event-driven architecture (SQS/EventBridge)
- Add machine learning for therapist matching
- Implement real-time chat (WebSockets)

---

## Contact & Support

### AWS Support
- AWS Support: Support Center in AWS Console
- AWS Health Dashboard: Check for service issues
- AWS Forums: https://forums.aws.amazon.com

### TherapyConnect Team
- Lead Developer: [Your Name]
- DevOps: [Your Name]
- Project Manager: [Your Name]

### Escalation Path
1. Check CloudWatch logs
2. Review this runbook
3. Check AWS Health Dashboard
4. Contact AWS Support (if BAA-related)
5. Rollback if critical (see Rollback Plan)

---

## Appendix

### A. Useful AWS CLI Commands

```bash
# Check Lightsail service status
aws lightsail get-container-services --service-name therapyconnect

# View logs
aws logs tail /aws/lightsail/therapyconnect --follow

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier therapyconnect-db \
  --query 'DBInstances[0].Endpoint.Address'

# List S3 bucket contents
aws s3 ls s3://therapyconnect-frontend/

# Check CloudFront distribution
aws cloudfront get-distribution --id <DISTRIBUTION_ID>

# Get Parameter Store secrets
aws ssm get-parameter \
  --name "/therapyconnect/database-url" \
  --with-decryption
```

### B. PostgreSQL Useful Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('therapyconnect'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '1 second'
ORDER BY duration DESC;
```

### C. Docker Commands

```bash
# Build image
docker build -t therapyconnect:latest .

# Run locally
docker run -p 5000:5000 --env-file .env therapyconnect:latest

# View logs
docker logs <container_id>

# Execute commands in container
docker exec -it <container_id> /bin/sh

# Clean up
docker system prune -a
```

### D. Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature aws-migration

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Merge to aws-migration
git checkout aws-migration
git merge feature/new-feature

# Deploy to production
./scripts/deploy-all.sh
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-19 | Migration Team | Initial document |

**Next Review Date:** 2025-11-19  
**Document Owner:** Lead Developer  
**Approvers:** Technical Lead, Project Manager

---

**END OF DOCUMENT**
