# KareMatch Lightsail Deployment Guide

**Quick Start Guide for Deploying to AWS Lightsail**

Generated: 2025-10-19
Status: Phase 1 Complete - Ready for Deployment

---

## 🚀 **OPTION 1: Automated Deployment (Recommended)**

### Prerequisites
- Docker installed and running
- AWS CLI configured with Lightsail permissions
- Lightsail service "karematch" already created

### Run Deployment Script

**Windows (PowerShell):**
```powershell
.\scripts\deploy-to-lightsail.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/deploy-to-lightsail.sh
./scripts/deploy-to-lightsail.sh
```

The script will:
1. ✅ Build Docker image
2. ✅ Test image locally (health check)
3. ✅ Push image to Lightsail registry
4. ⏸️  Pause with instructions for manual console steps

---

## 🖱️ **OPTION 2: Manual Deployment**

### Step 1: Build Docker Image (5 min)

```bash
# Build the image
docker build -t karematch:latest .

# Verify build
docker images karematch
```

**Expected output:**
```
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
karematch    latest    2f532b6272be   2 minutes ago   185MB
```

---

### Step 2: Test Image Locally (2 min)

```bash
# Run test container
docker run -d \
  --name karematch-test \
  -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e SESSION_SECRET="test" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  karematch:latest

# Wait 5 seconds
sleep 5

# Test health endpoint
curl http://localhost:5001/health

# Should return JSON with "status": "healthy"

# Cleanup
docker stop karematch-test
docker rm karematch-test
```

---

### Step 3: Push to Lightsail Registry (5 min)

```bash
# Push image to Lightsail
aws lightsail push-container-image \
  --service-name karematch \
  --label latest \
  --image karematch:latest \
  --region us-east-1
```

**Expected output:**
```
Image "karematch:latest" registered.
Refer to this image as ":karematch.latest" in deployments.
```

**⚠️ IMPORTANT:** Note the image reference `:karematch.latest` - you'll need this!

---

### Step 4: Update Lightsail Configuration (10 min)

#### A. Using AWS CLI (Faster)

```bash
# Get the latest image reference from Step 3
IMAGE_REF=":karematch.latest"  # Use the value from push-container-image output

# Create deployment
aws lightsail create-container-service-deployment \
  --service-name karematch \
  --region us-east-1 \
  --containers '{
    "karematch": {
      "image": "'"$IMAGE_REF"'",
      "environment": {
        "USE_PARAMETER_STORE": "true",
        "AWS_REGION": "us-east-1",
        "NODE_ENV": "production",
        "PORT": "5000",
        "DATABASE_URL": "postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify",
        "SESSION_SECRET": "ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg",
        "ENCRYPTION_KEY": "pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM="
      },
      "ports": {
        "5000": "HTTP"
      }
    }
  }' \
  --public-endpoint '{
    "containerName": "karematch",
    "containerPort": 5000,
    "healthCheck": {
      "path": "/health",
      "intervalSeconds": 10,
      "timeoutSeconds": 10,
      "healthyThreshold": 2,
      "unhealthyThreshold": 3
    }
  }'
```

#### B. Using Lightsail Console (If CLI fails)

1. **Go to Lightsail Console:**
   ```
   https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch
   ```

2. **Click "Deployments" tab → "Modify your deployment"**

3. **Update Container Image:**
   - Container name: `karematch`
   - Image: `:karematch.latest` (from Step 3 output)

4. **Set Environment Variables:**
   Click "Add environment variable" for each:

   | Key | Value |
   |-----|-------|
   | USE_PARAMETER_STORE | true |
   | AWS_REGION | us-east-1 |
   | NODE_ENV | production |
   | PORT | 5000 |
   | DATABASE_URL | `postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify` |
   | SESSION_SECRET | `ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg` |
   | ENCRYPTION_KEY | `pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=` |

5. **Configure Public Endpoint:**
   - Container: `karematch`
   - Port: `5000`
   - Protocol: `HTTP`

6. **Update Health Check:**
   - Path: `/health`
   - Success codes: `200-299`
   - Timeout: `10 seconds`
   - Interval: `10 seconds`
   - Healthy threshold: `2`
   - Unhealthy threshold: `3`

7. **Click "Save and deploy"**

---

### Step 5: Monitor Deployment (10-15 min)

#### Watch Deployment Progress

```bash
# Monitor deployment status
aws lightsail get-container-service-deployments \
  --service-name karematch \
  --region us-east-1 \
  --query 'deployments[0].state'
```

**Deployment states:**
- `ACTIVATING` → Deploying containers
- `ACTIVE` → Deployment successful ✅
- `FAILED` → Deployment failed ❌

#### View Logs

**In Console:**
1. Go to Lightsail Console → Container Services → karematch
2. Click "Deployments" tab
3. Click "Open log" for the latest deployment

**Expected startup logs:**
```
=== KareMatch Container Starting ===
NODE_ENV: production
PORT: 5000
AWS_REGION: us-east-1
USE_PARAMETER_STORE: true
Has DATABASE_URL: true
Has SESSION_SECRET: true
Has ENCRYPTION_KEY: true

Loading secrets...
Fetching secrets from AWS Systems Manager Parameter Store
✅ Successfully loaded secrets from Parameter Store
✅ Secrets loaded
✅ Health endpoint registered
✅ Routes registered
✅ Static files configured
serving on port 5000
```

**If using Parameter Store (alternative to env vars):**
```
Fetching secrets from AWS Systems Manager Parameter Store
✅ Successfully loaded secrets from Parameter Store
Initializing database connection...
AWS Environment: true
✅ Database connection initialized
Initializing PostgreSQL session store...
✅ Session store initialized
```

---

### Step 6: Verify Deployment (2 min)

#### Get Public URL

```bash
# Get service endpoint
aws lightsail get-container-services \
  --service-name karematch \
  --region us-east-1 \
  --query 'containerServices[0].url' \
  --output text
```

#### Test Health Endpoint

```bash
# Replace with your actual URL
LIGHTSAIL_URL="https://karematch.xxxx.us-east-1.cs.amazonlightsail.com"

# Test health endpoint
curl $LIGHTSAIL_URL/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T20:30:45.123Z",
  "uptime": 42.5,
  "environment": "production",
  "memory": {
    "heapUsed": "87MB",
    "heapTotal": "120MB",
    "percentage": "23%"
  }
}
```

#### Test Application

```bash
# Test therapist listing
curl $LIGHTSAIL_URL/api/therapists

# Should return JSON array (empty or with therapists)
```

---

## ✅ **Success Criteria**

Deployment is successful when:

- [ ] Container status shows "Running" (green checkmark)
- [ ] Health check returns HTTP 200 with `"status": "healthy"`
- [ ] Logs show "serving on port 5000"
- [ ] Public URL is accessible
- [ ] API endpoints respond correctly
- [ ] Memory usage < 80% (check health endpoint)
- [ ] No error messages in logs

---

## 🚨 **Troubleshooting**

### Issue: Deployment keeps getting canceled

**Symptoms:**
- Logs show "Creating...", "Started 1 new node" (3x), then "Canceled"
- No application logs visible

**Solution:**
1. Check health check path is exactly `/health` (case-sensitive)
2. Verify health check timeout is 10 seconds (not 2)
3. Ensure DATABASE_URL has `?sslmode=no-verify` at the end
4. Check environment variables are set correctly (especially USE_PARAMETER_STORE)

### Issue: Container crashes on startup

**Symptoms:**
- Logs show error messages
- Container exits immediately

**Check logs for these patterns:**

1. **"Failed to load secrets from Parameter Store"**
   - IAM role doesn't have SSM permissions
   - Parameter names incorrect
   - Wrong AWS region

2. **"DATABASE_URL environment variable is not set"**
   - Environment variable not set in Lightsail
   - Parameter Store fetch failed

3. **"password authentication failed"**
   - DATABASE_URL password incorrect
   - Missing URL encoding (%21 for !)

4. **"self-signed certificate in certificate chain"**
   - DATABASE_URL still has `?sslmode=require`
   - Should be `?sslmode=no-verify`

### Issue: Health check fails

**Symptoms:**
- Logs show "serving on port 5000"
- But deployment still fails

**Solution:**
1. Verify health check path: `/health` (not `/api/health`)
2. Increase health check timeout to 10 seconds
3. Increase health check interval to 10 seconds
4. Wait for database connection to initialize (can take 5-10s)

### Issue: Memory usage too high

**Symptoms:**
- Memory percentage > 90%
- Container OOM kills

**Solution:**
1. Check health endpoint `/health` for memory stats
2. If consistently > 80%, upgrade to Lightsail Micro (1GB RAM)
3. Monitor for memory leaks in application code

---

## 🔄 **Rollback Procedure**

If deployment fails:

1. **Revert to previous deployment:**
   ```bash
   aws lightsail get-container-service-deployments \
     --service-name karematch \
     --region us-east-1

   # Find previous successful deployment version
   # Redeploy that version via console
   ```

2. **Check RDS connections:**
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';
   ```

   If > 50 connections, kill zombie connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'postgres'
   AND state = 'idle'
   AND state_change < NOW() - INTERVAL '5 minutes';
   ```

3. **Review logs and fix issues**

4. **Rebuild and redeploy**

---

## 📊 **Monitoring**

### CloudWatch Logs

Lightsail automatically sends logs to CloudWatch:

```bash
# View logs
aws logs tail /aws/lightsail/containers/karematch/karematch \
  --follow \
  --region us-east-1
```

### Metrics to Watch

- **Memory Usage**: Should stay < 80% (384MB / 512MB)
- **CPU Usage**: Should stay < 50% on average
- **Health Check Failures**: Should be 0
- **Request Latency**: Should be < 1 second

### Alerts (Optional)

Set up CloudWatch alarms for:
- Memory usage > 80%
- Health check failures > 2
- Container restarts > 1 per hour

---

## 🎯 **Next Steps After Successful Deployment**

1. **Test all user flows:**
   - Sign up / Login
   - Browse therapists
   - Book appointment
   - Chatbot functionality

2. **Run database migrations:**
   ```bash
   # If not already done
   export DATABASE_URL="postgresql://postgres:Welcome2ppmsi!@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify"
   npm run db:push
   ```

3. **Seed test data (optional):**
   ```bash
   npm run db:seed
   ```

4. **Move to Phase 2:**
   - Set up CloudWatch monitoring
   - Implement database migration automation
   - Add performance optimizations
   - Security hardening

5. **Update DNS:**
   - Point your domain to Lightsail public URL
   - Configure SSL certificate

---

## 📝 **Deployment Checklist**

Use this to track your deployment:

- [ ] Phase 1 code changes committed to GitHub
- [ ] Docker image built successfully
- [ ] Docker image tested locally
- [ ] Image pushed to Lightsail registry
- [ ] Environment variables configured in Lightsail
- [ ] Health check settings updated
- [ ] Deployment initiated ("Save and deploy")
- [ ] Deployment status = ACTIVE
- [ ] Health endpoint returns 200 OK
- [ ] Application accessible via public URL
- [ ] All API endpoints working
- [ ] Logs show no errors
- [ ] Memory usage < 80%
- [ ] Database schema initialized (db:push)
- [ ] Test data seeded (optional)
- [ ] User flows tested
- [ ] DNS updated (if applicable)

---

## 🆘 **Need Help?**

**Common Commands:**

```bash
# Check deployment status
aws lightsail get-container-services --service-name karematch --region us-east-1

# View recent logs
aws logs tail /aws/lightsail/containers/karematch/karematch --region us-east-1

# Describe container service
aws lightsail get-container-service-deployments --service-name karematch --region us-east-1

# Force new deployment (if stuck)
aws lightsail create-container-service-deployment \
  --service-name karematch \
  --region us-east-1 \
  --cli-input-json file://lightsail-container-config.json
```

**Review Documentation:**
- DEPLOYMENT-CHECKLIST.md - Comprehensive task list
- AWS-MIGRATION-PLAN.md - Full migration plan
- DEPLOYMENT.md - Infrastructure details

---

**Deployment Guide Version:** 1.0
**Last Updated:** 2025-10-19
**Phase:** 1 - Production Ready
