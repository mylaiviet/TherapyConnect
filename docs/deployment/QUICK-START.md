# Quick Start Guide - For New Claude Code Sessions

**Last Updated:** October 20, 2025
**Status:** ✅ Successfully deployed to AWS Lightsail (currently disabled to save costs)
**Application:** KareMatch - Mental health therapist matching platform

---

## Current Status

### AWS Services Status
- ✅ **Lightsail Container Service:** DISABLED (to save $7/month)
  - Service Name: `karematch`
  - Region: `us-east-1`
  - Public URL (when enabled): https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com

- ⏸️ **RDS Database:** STOPPED (to save ~$15-30/month)
  - Instance: `karematch-db`
  - Region: `us-east-1`
  - Endpoint: `karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com`

### Development Mode
🏠 **Currently developing LOCALLY using Docker** (no AWS costs)

---

## What Happened Previously

### Successful First Deployment
- ✅ Built Docker image locally
- ✅ Pushed to Docker Hub: `mylaiviet/karematch:latest`
- ✅ Deployed to AWS Lightsail
- ✅ Application ran successfully in production
- ✅ Health check passed: `/health` endpoint working

### Issues Resolved
See complete details in: [docs/issues/aws-lightsail-deployment-issues.md](docs/issues/aws-lightsail-deployment-issues.md)

**Major issues:**
1. ❌ `lightsailctl` plugin not working on Windows
   - ✅ **Solution:** Use Docker Hub instead
2. ❌ `USE_PARAMETER_STORE=true` causing IAM errors
   - ✅ **Solution:** Removed that env var, use direct environment variables
3. ❌ ECR registry confusion
   - ✅ **Solution:** Use Docker Hub registry

### Why Services Are Disabled
- User is still building/testing the application
- Decided to develop locally to save AWS costs (~$22-37/month → ~$2-3/month)
- Will re-enable when ready for production testing

---

## Local Development Workflow (Start Here!)

### Prerequisites Installed
- ✅ Docker Desktop (running)
- ✅ Node.js 20
- ✅ AWS CLI v2.31.18
- ✅ Git
- ✅ Docker Hub account: `mylaiviet`

### Quick Local Test

**1. Build Docker image:**
```powershell
cd C:\TherapyConnect
docker build -t karematch:latest .
```

**2. Run locally (with test database):**
```powershell
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
  -e SESSION_SECRET="test-secret-key" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name karematch-test \
  karematch:latest
```

**3. Test:**
```powershell
# Health check
curl http://localhost:5001/health

# API
curl http://localhost:5001/api/therapists

# Frontend - open in browser
start http://localhost:5001
```

**4. View logs:**
```powershell
docker logs -f karematch-test
```

**5. Stop and cleanup:**
```powershell
docker stop karematch-test
docker rm karematch-test
```

### Local Development with Database

**Option A: Use Docker Compose (Recommended)**

Create and start both app and database:
```powershell
docker-compose up --build
```

See full docker-compose.yml example in: [docs/LOCAL-DOCKER-WORKFLOW.md](docs/LOCAL-DOCKER-WORKFLOW.md)

**Option B: Run PostgreSQL locally**

```powershell
# Start PostgreSQL in Docker
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=karematch \
  --name postgres-local \
  postgres:15-alpine

# Then run app with local DB
docker run -d -p 5001:5000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/karematch" \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e SESSION_SECRET="test-secret" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name karematch-test \
  karematch:latest
```

**Option C: Use Production RDS (costs money!)**

Only do this if you need to test with real data:

```powershell
# 1. Start RDS in AWS Console first
# 2. Wait 2-3 minutes for it to start
# 3. Run app with production DB

docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e AWS_REGION=us-east-1 \
  -e DATABASE_URL="postgresql://postgres:Welcome2ppms!@karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require" \
  -e SESSION_SECRET="ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg" \
  -e ENCRYPTION_KEY="pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=" \
  --name karematch-test \
  karematch:latest
```

⚠️ **Remember to stop RDS again when done to save costs!**

---

## Deployment to AWS Workflow

**Only do this when ready to test in production or deploy for real users.**

### Step 1: Re-enable AWS Services

**Re-enable Lightsail:**
1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch
2. Click "Enable"
3. Wait 2-3 minutes

**Re-start RDS (if needed):**
1. Go to: https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
2. Select `karematch-db`
3. Actions → Start
4. Wait 2-3 minutes

### Step 2: Test Locally First

**ALWAYS test locally before deploying to AWS!**

```powershell
# Build
docker build -t karematch:latest .

# Test locally
docker run -d -p 5001:5000 --name test karematch:latest

# Verify it works
curl http://localhost:5001/health

# Cleanup
docker stop test && docker rm test
```

### Step 3: Push to Docker Hub

**Use the automated script:**
```powershell
cd C:\TherapyConnect
.\push-via-docker-hub.ps1
```

**What this does:**
1. Asks for Docker Hub username (enter: `mylaiviet`)
2. Prompts for Docker Hub password
3. Tags image: `mylaiviet/karematch:latest`
4. Pushes to Docker Hub
5. Shows you the image reference to use

**Manual method (if script fails):**
```powershell
# Login
docker login

# Tag for Docker Hub
docker tag karematch:latest mylaiviet/karematch:latest

# Push
docker push mylaiviet/karematch:latest
```

### Step 4: Update AWS Lightsail Deployment

**In AWS Console:**

1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch/deployments

2. Click "Modify your deployment"

3. Verify **Image** field shows:
   ```
   mylaiviet/karematch:latest
   ```

4. Verify **Environment Variables** (should already be set):
   ```
   NODE_ENV=production
   PORT=5000
   AWS_REGION=us-east-1
   DATABASE_URL=postgresql://postgres:Welcome2ppms!@karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require
   SESSION_SECRET=ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg
   ENCRYPTION_KEY=pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=
   ```

   ⚠️ **DO NOT set `USE_PARAMETER_STORE` - it causes crashes!**

5. Click "Save and deploy"

6. Wait 2-3 minutes for deployment

### Step 5: Verify Production

**Test production endpoints:**
```powershell
# Health check
curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health

# API
curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/api/therapists

# Frontend - open in browser
start https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com
```

**Check deployment logs:**
1. Lightsail Console → karematch → Deployments tab
2. Click "Open log" to see startup logs
3. Look for:
   - ✅ `=== KareMatch Container Starting ===`
   - ✅ `Server started on port 5000`
   - ❌ No error messages

### Step 6: Disable AWS Again (When Done Testing)

**To save costs, disable when not actively using:**

**Disable Lightsail:**
```
https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch
Click "Disable"
```

**Stop RDS:**
```
https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
Select karematch-db → Actions → Stop
```

---

## Important Files and Scripts

### Deployment Scripts (Use These!)

**⭐ Primary deployment script:**
- [push-via-docker-hub.ps1](push-via-docker-hub.ps1) - Push Docker image to Docker Hub

**Testing scripts:**
- [test-local.ps1](test-local.ps1) - Automated local Docker testing (if created)
- [quick-test.ps1](quick-test.ps1) - Quick rebuild and test (if created)

**Other scripts (reference only):**
- [fix-lightsail-path.ps1](fix-lightsail-path.ps1) - Attempted to fix lightsailctl plugin (didn't work)
- [deploy-to-lightsail.ps1](deploy-to-lightsail.ps1) - Attempted automated deployment (didn't work - use manual method)
- [deploy-from-amd64.ps1](deploy-from-amd64.ps1) - ECR-based deployment (didn't work - use Docker Hub)

### Documentation (Read These!)

**⭐ Essential reading:**
- [QUICK-START.md](QUICK-START.md) - This file! Quick reference for new sessions
- [docs/LOCAL-DOCKER-WORKFLOW.md](docs/LOCAL-DOCKER-WORKFLOW.md) - Complete local development guide
- [docs/issues/aws-lightsail-deployment-issues.md](docs/issues/aws-lightsail-deployment-issues.md) - What went wrong and how we fixed it

**Reference documentation:**
- [LIGHTSAIL-DEPLOYMENT-GUIDE.md](LIGHTSAIL-DEPLOYMENT-GUIDE.md) - Step-by-step deployment walkthrough
- [IAM-PERMISSIONS-NEEDED.md](IAM-PERMISSIONS-NEEDED.md) - AWS IAM setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Original deployment notes (outdated)

### Configuration Files

- [Dockerfile](Dockerfile) - Docker image definition
- [.dockerignore](.dockerignore) - Files excluded from Docker image
- [docker-compose.yml](docker-compose.yml) - Multi-container setup (if it exists)
- [package.json](package.json) - Node.js dependencies and scripts

---

## AWS Configuration Reference

### Lightsail Container Service

**Service:** karematch
**Region:** us-east-1
**Power:** Nano (512 MB RAM, 0.25 vCPU)
**Scale:** 1 node
**Cost:** $7/month (when enabled)
**Public Domain:** https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com

**Container Config:**
- **Name:** karematch
- **Image:** mylaiviet/karematch:latest (from Docker Hub)
- **Port:** 5000 (HTTP)
- **Launch command:** launch.sh
- **Health check:** /health (every 30s)

**Environment Variables:**
```env
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
DATABASE_URL=postgresql://postgres:Welcome2ppms!@karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require
SESSION_SECRET=ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg
ENCRYPTION_KEY=pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=
```

⚠️ **DO NOT ADD:** `USE_PARAMETER_STORE=true` (causes crashes!)

### RDS Database

**Instance:** karematch-db
**Engine:** PostgreSQL 15
**Region:** us-east-1
**Endpoint:** karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com:5432
**Database:** postgres
**Username:** postgres
**Password:** Welcome2ppms!
**Cost:** ~$15-30/month (when running)

### IAM User

**User:** cli-deployment-user (aka lightsail-app-user)
**Access Key:** Configured in AWS CLI
**Permissions:** `lightsail:*` (full Lightsail access)

---

## Common Commands Cheat Sheet

### Docker Commands

```powershell
# Build image
docker build -t karematch:latest .

# Run locally on port 5001
docker run -d -p 5001:5000 --name test karematch:latest

# View logs
docker logs -f test

# Stop container
docker stop test

# Remove container
docker rm test

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List images
docker images

# Remove image
docker rmi karematch:latest

# Clean up everything
docker system prune -a
```

### Testing Commands

```powershell
# Test health endpoint
curl http://localhost:5001/health

# Test API
curl http://localhost:5001/api/therapists

# Test with query params
curl "http://localhost:5001/api/therapists?city=Minneapolis"

# Open browser
start http://localhost:5001
```

### AWS CLI Commands (if needed)

```powershell
# Check Lightsail services
aws lightsail get-container-services --region us-east-1

# Check RDS status
aws rds describe-db-instances --db-instance-identifier karematch-db --region us-east-1

# View Lightsail logs (when enabled)
aws logs tail /aws/lightsail/containers/karematch/karematch --region us-east-1 --follow
```

### Git Commands

```powershell
# Commit changes
git add .
git commit -m "Your commit message"
git push origin main

# Check status
git status

# View history
git log --oneline

# Create branch
git checkout -b feature/new-feature
```

---

## What NOT to Do (Lessons Learned)

❌ **Don't use lightsailctl plugin on Windows** - it doesn't work reliably
   → Use Docker Hub instead

❌ **Don't set USE_PARAMETER_STORE=true** unless you've set up:
   - IAM role for Lightsail service
   - Parameters in AWS Systems Manager
   - `ssm:GetParameter` permissions

❌ **Don't deploy to AWS without testing locally first**
   → Always test locally, saves time and money

❌ **Don't leave AWS services running when not using them**
   → Disable Lightsail and stop RDS to save ~$20-35/month

❌ **Don't push to AWS for every code change**
   → Iterate locally, only deploy when ready for production testing

---

## Troubleshooting Quick Reference

### Issue: Docker build fails

```powershell
# Clear cache and rebuild
docker build --no-cache -t karematch:latest .
```

### Issue: Container exits immediately

```powershell
# Check logs
docker logs karematch-test

# Run interactively to see output
docker run -it --rm karematch:latest
```

### Issue: Can't connect to database

**From local Docker container:**
- Use `host.docker.internal` (NOT `localhost`)
- Example: `postgresql://user:pass@host.docker.internal:5432/db`

**From AWS:**
- Use RDS endpoint: `karematch-db.cm1ksggm0c00.us-east-1.rds.amazonaws.com`
- Make sure RDS is started (not stopped)

### Issue: Port 5001 already in use

```powershell
# Find what's using the port
netstat -ano | findstr :5001

# Kill the process
taskkill /F /PID <process-id>

# Or use a different port
docker run -p 5002:5000 karematch:latest
```

### Issue: Changes not showing up

```powershell
# Make sure you rebuilt the image!
docker build -t karematch:latest .

# Remove old container and start new one
docker stop test && docker rm test
docker run -d -p 5001:5000 --name test karematch:latest
```

---

## Project Structure Reference

```
C:\TherapyConnect/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   └── components/
│   └── package.json
├── server/                  # Express backend
│   ├── index.ts
│   ├── routes.ts
│   └── services/
├── shared/                  # Shared types/schema
│   └── schema.ts
├── docs/                    # Documentation
│   ├── issues/
│   │   └── aws-lightsail-deployment-issues.md
│   └── LOCAL-DOCKER-WORKFLOW.md
├── dist/                    # Built files (generated)
│   ├── public/              # Built frontend
│   └── index.js             # Built backend
├── Dockerfile               # Docker image definition
├── .dockerignore            # Files excluded from Docker
├── package.json             # Root package.json
├── push-via-docker-hub.ps1  # Deployment script ⭐
├── QUICK-START.md           # This file! ⭐
└── README.md                # Project README
```

---

## Cost Tracking

### Current Monthly Costs

**With services DISABLED (current state):**
- Lightsail: $0/month ✅
- RDS (stopped): ~$2-3/month (storage only)
- **Total: ~$2-3/month**

**With services ENABLED (when testing/production):**
- Lightsail Nano: $7/month
- RDS db.t3.micro: ~$15-30/month
- Data transfer: ~$0-5/month (first 500GB free)
- **Total: ~$22-37/month**

**Daily cost when enabled:** ~$0.73-$1.23/day

### Cost Optimization Tips

✅ **Disable Lightsail when not actively testing** (saves $7/month)
✅ **Stop RDS when not needed** (saves ~$15-30/month)
✅ **Develop locally** (saves everything!)
✅ **Only enable AWS for production testing/demos**
✅ **Use Free Tier if eligible** (first 12 months - free RDS hours)

---

## Next Session Checklist

**When you (Claude Code) start a new session, check this:**

1. **Read this file first** (QUICK-START.md)
2. **Ask user what they want to do:**
   - Develop locally? → Follow local development workflow
   - Deploy to AWS? → Check if services are enabled first
   - Fix a bug? → Test locally first
   - Add a feature? → Develop and test locally

3. **Before any AWS deployment:**
   - ✅ Confirm services are enabled
   - ✅ Test locally first
   - ✅ Push to Docker Hub
   - ✅ Update Lightsail deployment
   - ✅ Verify in production
   - ✅ Consider disabling again if just testing

4. **Reference documentation:**
   - [docs/LOCAL-DOCKER-WORKFLOW.md](docs/LOCAL-DOCKER-WORKFLOW.md) - for local development
   - [docs/issues/aws-lightsail-deployment-issues.md](docs/issues/aws-lightsail-deployment-issues.md) - for troubleshooting

---

## Success Criteria

**Local Development:**
- ✅ Docker image builds without errors
- ✅ Container starts successfully
- ✅ Health endpoint returns 200 OK
- ✅ No errors in logs
- ✅ Memory usage < 250 MB
- ✅ API endpoints respond correctly

**Production Deployment:**
- ✅ Lightsail deployment shows "Active"
- ✅ Health check passes in AWS
- ✅ Public URL accessible
- ✅ All API endpoints working
- ✅ Frontend loads correctly
- ✅ Database connectivity confirmed

---

## Contact Information

**Docker Hub Account:** mylaiviet
**AWS Account:** 051826703172 (us-east-1)
**GitHub:** (not used for deployment, only code storage)

---

## Version History

- **v1.0** (2025-10-20): Initial successful deployment to AWS Lightsail
  - Resolved lightsailctl plugin issues
  - Resolved USE_PARAMETER_STORE configuration issue
  - Documented complete workflow
  - Services disabled to save costs during development

---

**Last Deployment:**
- **Date:** October 20, 2025
- **Status:** ✅ Successful
- **Image:** mylaiviet/karematch:latest
- **Health Check:** ✅ Passing
- **Current State:** Disabled (development mode)

---

## Quick Links

**AWS Console:**
- Lightsail: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/karematch
- RDS: https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
- IAM: https://console.aws.amazon.com/iam/home#/users/cli-deployment-user

**Docker Hub:**
- Repository: https://hub.docker.com/r/mylaiviet/karematch

**Production URL (when enabled):**
- https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com

---

**END OF QUICK START GUIDE**

**Remember:** Always develop and test locally first! Only enable AWS when ready for production testing or deployment. This saves money and speeds up development. 🚀
