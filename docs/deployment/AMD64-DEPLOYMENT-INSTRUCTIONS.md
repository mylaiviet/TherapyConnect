# AMD64 Machine Deployment Instructions

## Quick Start

### On your AMD64 machine:

**Linux/Mac:**
```bash
# 1. Clone the repository
git clone <YOUR_REPO_URL>
cd TherapyConnect
git checkout aws-migration

# 2. Copy and run the deployment script
chmod +x deploy-from-amd64.sh
./deploy-from-amd64.sh
```

**Windows:**
```powershell
# 1. Clone the repository
git clone <YOUR_REPO_URL>
cd TherapyConnect
git checkout aws-migration

# 2. Run the deployment script
.\deploy-from-amd64.ps1
```

---

## What the Script Does

1. ✅ Builds Docker image (AMD64 architecture)
2. ✅ Tests image locally with health check
3. ✅ Authenticates to Amazon ECR
4. ✅ Pushes image to ECR registry
5. ✅ Deploys to AWS Lightsail
6. ✅ Configures health checks and environment variables

**Total time:** 5-10 minutes

---

## Prerequisites

Make sure the AMD64 machine has:
- Docker installed and running
- AWS CLI installed and configured
- Git installed
- Access to your GitHub repository

---

## Manual Steps (if script fails)

### 1. Build Image
```bash
docker build -t karematch:latest .
```

### 2. Test Image
```bash
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e SESSION_SECRET="test" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name test \
  karematch:latest

# Wait 5 seconds
sleep 5

# Test health
curl http://localhost:5001/health

# Cleanup
docker stop test && docker rm test
```

### 3. Push to ECR
```bash
# Login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  051826703172.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag karematch:latest \
  051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest

docker push 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest
```

### 4. Deploy to Lightsail
```bash
aws lightsail create-container-service-deployment \
  --service-name karematch \
  --region us-east-1 \
  --cli-input-json file://ecr-deployment.json
```

---

## Monitor Deployment

### Check deployment status:
```bash
aws lightsail get-container-service-deployments \
  --service-name karematch \
  --region us-east-1 \
  --query 'deployments[0].state'
```

**States:**
- `ACTIVATING` - Deployment in progress
- `ACTIVE` - Deployment successful ✅
- `FAILED` - Deployment failed ❌

### View logs:
```bash
aws logs tail /aws/lightsail/containers/karematch/karematch \
  --region us-east-1 \
  --follow
```

### Test health endpoint:
```bash
curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-20T02:15:00.000Z",
  "uptime": 45.2,
  "environment": "production",
  "memory": {
    "heapUsed": "87MB",
    "heapTotal": "120MB",
    "percentage": "23%"
  }
}
```

---

## Success Criteria

Deployment is successful when:
- ✅ Deployment state = `ACTIVE`
- ✅ Health endpoint returns HTTP 200
- ✅ Logs show "serving on port 5000"
- ✅ Memory usage < 80%
- ✅ No error messages in logs

---

## Troubleshooting

### Image architecture wrong:
```bash
# Check architecture
docker inspect karematch:latest --format "{{.Architecture}}"
# Should return: amd64
```

### ECR push fails:
```bash
# Verify ECR login
aws ecr describe-repositories --region us-east-1
```

### Deployment fails:
```bash
# View detailed deployment info
aws lightsail get-container-service-deployments \
  --service-name karematch \
  --region us-east-1

# Check logs for errors
aws logs tail /aws/lightsail/containers/karematch/karematch \
  --region us-east-1 \
  --since 10m
```

---

## Repository Information

- **Branch:** aws-migration
- **ECR Repository:** 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch
- **Lightsail Service:** karematch
- **Public URL:** https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/
- **RDS Endpoint:** karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com

---

## After Successful Deployment

1. Test all user flows
2. Verify database connectivity
3. Run database migrations (if needed):
   ```bash
   export DATABASE_URL="postgresql://postgres:Welcome2ppmsi!@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify"
   npm run db:push
   ```
4. Monitor CloudWatch logs for any issues
5. Set up monitoring and alerts

---

**Generated:** 2025-10-19
**Phase:** 1 - Production Deployment
