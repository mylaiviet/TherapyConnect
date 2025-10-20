# Local Docker Development & Testing Workflow

This guide shows how to build, test, and iterate on your application locally using Docker before deploying to AWS Lightsail.

---

## Overview

**Workflow:**
```
1. Code changes → 2. Build Docker image → 3. Test locally → 4. Push to Docker Hub → 5. Deploy to AWS
```

**Benefits:**
- ✅ Catch issues early (before deploying to production)
- ✅ Faster iteration (no waiting for cloud deployments)
- ✅ Free testing (no AWS charges while developing)
- ✅ Exact production environment locally
- ✅ Test with different configurations easily

---

## Prerequisites

**Required Software:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (installed and running)
- Code editor (VS Code, etc.)
- Git (for version control)

**Optional:**
- Docker Compose (for multi-container testing with database)
- PostgreSQL client (for database testing)

---

## Quick Start (TL;DR)

```powershell
# 1. Build Docker image
docker build -t karematch:latest .

# 2. Run locally on port 5001
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
  -e SESSION_SECRET="test-secret-key" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name karematch-test \
  karematch:latest

# 3. Test
curl http://localhost:5001/health

# 4. View logs
docker logs karematch-test

# 5. Stop and cleanup
docker stop karematch-test
docker rm karematch-test
```

---

## Step-by-Step Workflow

### Step 1: Make Code Changes

**Edit your application code:**
```bash
# Example: Edit server code
code server/routes.ts

# Example: Edit client code
code client/src/App.tsx
```

**Tip:** Keep changes small and testable

### Step 2: Build Docker Image

**Build the image:**
```powershell
docker build -t karematch:latest .
```

**What this does:**
- Reads `Dockerfile` in project root
- Installs dependencies (`npm ci`)
- Builds application (`npm run build`)
- Creates optimized production image
- Tags it as `karematch:latest`

**Build output you'll see:**
```
[+] Building 45.2s (18/18) FINISHED
 => [internal] load build definition
 => [builder 1/7] FROM docker.io/library/node:20-alpine
 => [builder 4/7] COPY package*.json ./
 => [builder 5/7] RUN npm ci
 => [builder 6/7] COPY . .
 => [builder 7/7] RUN npm run build
 => exporting to image
 => => naming to docker.io/library/karematch:latest
```

**Time:** 30-60 seconds for subsequent builds (Docker caches layers)

**Common Build Errors:**

**Error:** `npm ERR! code ENOENT`
**Fix:** Make sure `package.json` and `package-lock.json` exist

**Error:** `TypeScript compilation failed`
**Fix:** Fix TypeScript errors in your code first

**Error:** `COPY failed: no source files`
**Fix:** Check `.dockerignore` isn't excluding required files

### Step 3: Test Locally

#### Option A: Quick Test (Production Mode)

**Run container with production settings:**
```powershell
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://postgres:Welcome2ppms!@host.docker.internal:5432/postgres" \
  -e SESSION_SECRET="ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg" \
  -e ENCRYPTION_KEY="pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=" \
  --name karematch-test \
  karematch:latest
```

**Explanation:**
- `-d` - Run in background (detached)
- `-p 5001:5000` - Map container port 5000 to host port 5001
- `-e` - Set environment variables
- `--name` - Give container a friendly name
- `host.docker.internal` - Special DNS name to access host machine from container

**Test the application:**
```powershell
# Health check
curl http://localhost:5001/health

# API endpoints
curl http://localhost:5001/api/therapists

# Frontend
# Open browser: http://localhost:5001
```

**View logs in real-time:**
```powershell
docker logs -f karematch-test
```

**Stop container:**
```powershell
docker stop karematch-test
docker rm karematch-test
```

#### Option B: Interactive Test (See All Output)

**Run container in foreground:**
```powershell
docker run -it --rm -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
  -e SESSION_SECRET="test-secret" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  karematch:latest
```

**Explanation:**
- `-it` - Interactive mode with terminal
- `--rm` - Automatically remove container when stopped
- Logs appear directly in terminal

**Stop:** Press `Ctrl+C`

#### Option C: Test with Docker Compose (Recommended for Full Stack)

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5001:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://postgres:postgres@db:5432/karematch
      SESSION_SECRET: local-dev-secret-key
      ENCRYPTION_KEY: dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==
    depends_on:
      - db
    networks:
      - karematch-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: karematch
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - karematch-network

networks:
  karematch-network:
    driver: bridge

volumes:
  postgres-data:
```

**Start everything:**
```powershell
docker-compose up --build
```

**Stop everything:**
```powershell
docker-compose down
```

**Cleanup (including database):**
```powershell
docker-compose down -v
```

### Step 4: Verify Locally

**Check container is running:**
```powershell
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
abc123def456   karematch:latest   Up 2 minutes   0.0.0.0:5001->5000/tcp   karematch-test
```

**Check health endpoint:**
```powershell
curl http://localhost:5001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-20T05:30:00.000Z",
  "uptime": 120.5,
  "environment": "production",
  "memory": {
    "heapUsed": "28MB",
    "heapTotal": "32MB",
    "percentage": "7%"
  }
}
```

**Test API endpoints:**
```powershell
# Get therapists
curl http://localhost:5001/api/therapists

# Get specific therapist
curl http://localhost:5001/api/therapists/fde2e9df-f9ab-4dd7-9a10-5af22553bd73

# Test chat endpoint
curl -X POST http://localhost:5001/api/chat/start -H "Content-Type: application/json"
```

**Test frontend:**
```
Open browser: http://localhost:5001
```

**Check container logs for errors:**
```powershell
docker logs karematch-test
```

**Look for:**
- ✅ `=== KareMatch Container Starting ===`
- ✅ `Server started on port 5000`
- ✅ No error messages
- ✅ Database connection successful

### Step 5: Debug Issues Locally

**Enter running container (if needed):**
```powershell
docker exec -it karematch-test sh
```

**Inside container, you can:**
```bash
# Check environment
env | grep NODE_ENV

# Check files
ls -la /app/dist

# Check processes
ps aux

# Check network
netstat -tulpn

# Exit container
exit
```

**Check container resource usage:**
```powershell
docker stats karematch-test
```

**Inspect container configuration:**
```powershell
docker inspect karematch-test
```

### Step 6: Iterate and Rebuild

**Make code changes → Rebuild → Test again:**

```powershell
# Stop old container
docker stop karematch-test
docker rm karematch-test

# Rebuild image
docker build -t karematch:latest .

# Run new container
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="..." \
  -e SESSION_SECRET="..." \
  -e ENCRYPTION_KEY="..." \
  --name karematch-test \
  karematch:latest

# Test again
curl http://localhost:5001/health
```

**Or use this one-liner:**
```powershell
docker stop karematch-test; docker rm karematch-test; docker build -t karematch:latest . && docker run -d -p 5001:5000 -e NODE_ENV=production -e PORT=5000 -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" -e SESSION_SECRET="test" -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" --name karematch-test karematch:latest && docker logs -f karematch-test
```

### Step 7: Push to Docker Hub (When Ready)

**Once local testing is successful:**

```powershell
# Tag for Docker Hub
docker tag karematch:latest mylaiviet/karematch:latest

# Login to Docker Hub
docker login

# Push to Docker Hub
docker push mylaiviet/karematch:latest
```

**Or use the script:**
```powershell
.\push-via-docker-hub.ps1
```

### Step 8: Deploy to AWS Lightsail

**After successful Docker Hub push:**

1. Go to Lightsail console
2. Click "Modify your deployment"
3. Image is already set to `mylaiviet/karematch:latest`
4. Click "Save and deploy"
5. Wait 2-3 minutes
6. Test production: `https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health`

---

## Testing Scenarios

### Scenario 1: Test Without Database

**Use mock/test credentials:**
```powershell
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://test:test@invalid:5432/test" \
  -e SESSION_SECRET="test-secret" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name karematch-test \
  karematch:latest
```

**Application should start but database operations will fail**
**Good for testing:** Frontend, static endpoints, health checks

### Scenario 2: Test With Local PostgreSQL

**If you have PostgreSQL running on your machine:**

```powershell
docker run -d -p 5001:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="postgresql://postgres:yourpassword@host.docker.internal:5432/yourdb" \
  -e SESSION_SECRET="test-secret" \
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" \
  --name karematch-test \
  karematch:latest
```

**Good for testing:** Full application functionality, database queries, data persistence

### Scenario 3: Test With Docker Compose (Database + App)

**Use the docker-compose.yml from Step 3, Option C**

**Start both:**
```powershell
docker-compose up
```

**Run database migrations (if needed):**
```powershell
docker-compose exec app npm run db:push
```

**Good for testing:** Complete application stack, realistic production environment

### Scenario 4: Test Production Configuration

**Use exact production environment variables:**

```powershell
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

**Good for testing:**
- Exact production behavior
- Production database connectivity
- SSL connections
- Real data (⚠️ be careful!)

**⚠️ Warning:** This connects to production database - don't modify data!

### Scenario 5: Test Different Versions

**Build and test multiple versions:**

```powershell
# Build version 1
git checkout feature-branch-1
docker build -t karematch:v1 .

# Build version 2
git checkout feature-branch-2
docker build -t karematch:v2 .

# Test version 1
docker run -d -p 5001:5000 --name test-v1 karematch:v1
curl http://localhost:5001/health

# Test version 2
docker run -d -p 5002:5000 --name test-v2 karematch:v2
curl http://localhost:5002/health

# Compare behavior
```

---

## Automated Testing Scripts

### Create: `test-local.ps1`

```powershell
# Local Docker Test Script
param(
    [string]$Port = "5001",
    [switch]$SkipBuild,
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

Write-Host "=== Local Docker Test ===" -ForegroundColor Blue
Write-Host ""

# Configuration
$IMAGE = "karematch:latest"
$CONTAINER = "karematch-test"

# Step 1: Build (unless skipped)
if (-not $SkipBuild) {
    Write-Host "[1/4] Building Docker image..." -ForegroundColor Yellow
    docker build -t $IMAGE .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "[1/4] Skipping build (using existing image)" -ForegroundColor Gray
}

# Step 2: Stop old container if exists
Write-Host ""
Write-Host "[2/4] Cleaning up old container..." -ForegroundColor Yellow
docker stop $CONTAINER 2>$null
docker rm $CONTAINER 2>$null
Write-Host "✅ Cleanup complete" -ForegroundColor Green

# Step 3: Start container
Write-Host ""
Write-Host "[3/4] Starting container..." -ForegroundColor Yellow

$runArgs = @(
    "-p", "${Port}:5000",
    "-e", "NODE_ENV=production",
    "-e", "PORT=5000",
    "-e", "DATABASE_URL=postgresql://test:test@host.docker.internal:5432/test",
    "-e", "SESSION_SECRET=test-secret-key",
    "-e", "ENCRYPTION_KEY=dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==",
    "--name", $CONTAINER
)

if ($Detached) {
    $runArgs = @("-d") + $runArgs
}

docker run @runArgs $IMAGE

if ($Detached) {
    Start-Sleep -Seconds 3

    # Step 4: Test
    Write-Host ""
    Write-Host "[4/4] Testing..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:${Port}/health" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Container is running!" -ForegroundColor Green
        Write-Host "  Health: http://localhost:${Port}/health" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:${Port}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View logs: docker logs -f $CONTAINER" -ForegroundColor Gray
        Write-Host "Stop: docker stop $CONTAINER" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Health check failed - container may still be starting" -ForegroundColor Yellow
        Write-Host "Check logs: docker logs $CONTAINER" -ForegroundColor Gray
    }
}
```

**Usage:**
```powershell
# Build and test (detached)
.\test-local.ps1 -Detached

# Test on different port
.\test-local.ps1 -Port 8080 -Detached

# Skip build (use existing image)
.\test-local.ps1 -SkipBuild -Detached

# Interactive mode (logs in terminal)
.\test-local.ps1
```

### Create: `quick-test.ps1`

```powershell
# Quick Rebuild and Test
$ErrorActionPreference = "Stop"

Write-Host "Stopping old container..." -ForegroundColor Yellow
docker stop karematch-test 2>$null; docker rm karematch-test 2>$null

Write-Host "Building..." -ForegroundColor Yellow
docker build -t karematch:latest . -q

Write-Host "Starting..." -ForegroundColor Yellow
docker run -d -p 5001:5000 `
  -e NODE_ENV=production `
  -e PORT=5000 `
  -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" `
  -e SESSION_SECRET="test" `
  -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" `
  --name karematch-test `
  karematch:latest

Start-Sleep 3
curl http://localhost:5001/health

Write-Host "`nLogs:" -ForegroundColor Cyan
docker logs karematch-test
```

**Usage:**
```powershell
.\quick-test.ps1
```

---

## Common Issues and Solutions

### Issue: "Port already in use"

**Error:**
```
Error: bind: address already in use
```

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :5001

# Kill the process
taskkill /F /PID <process-id>

# Or use a different port
docker run -p 5002:5000 ...
```

### Issue: "Cannot connect to database"

**Error in logs:**
```
Error: connect ECONNREFUSED host.docker.internal:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```powershell
   # Windows
   Get-Service postgresql*

   # Or check port
   netstat -ano | findstr :5432
   ```

2. **Use correct host:**
   - From container: `host.docker.internal`
   - NOT: `localhost` (refers to container, not host)

3. **Check firewall:**
   - Allow PostgreSQL port 5432
   - Allow Docker to access network

### Issue: "Image build fails"

**Error:**
```
npm ERR! code E404
```

**Solutions:**

1. **Clear npm cache:**
   ```powershell
   docker build --no-cache -t karematch:latest .
   ```

2. **Check .dockerignore:**
   - Make sure `package.json` isn't excluded
   - Make sure `node_modules/` IS excluded

3. **Check Dockerfile:**
   - Verify all paths are correct
   - Verify build commands work locally

### Issue: "Container exits immediately"

**Check exit code:**
```powershell
docker ps -a
# Look for STATUS: Exited (1) or similar
```

**Check logs:**
```powershell
docker logs karematch-test
```

**Common causes:**
- Application crash on startup
- Missing environment variables
- Port conflict
- Database connection failure

**Solution:**
- Fix errors shown in logs
- Run in interactive mode to see output:
  ```powershell
  docker run -it --rm karematch:latest
  ```

### Issue: "Changes not reflecting"

**Cause:** Docker cached old image layers

**Solutions:**

1. **Force rebuild:**
   ```powershell
   docker build --no-cache -t karematch:latest .
   ```

2. **Make sure you rebuilt:**
   ```powershell
   # This is required after code changes!
   docker build -t karematch:latest .
   ```

3. **Check you're running the new image:**
   ```powershell
   docker images karematch
   # Check the IMAGE ID changed
   ```

---

## Best Practices

### Development Workflow

1. ✅ **Always test locally before deploying**
   - Build → Test → Fix → Repeat
   - Deploy to AWS only when local test passes

2. ✅ **Use consistent environment variables**
   - Keep a `.env.local` file (gitignored) with test values
   - Use same variable names as production

3. ✅ **Tag images with versions**
   ```powershell
   docker build -t karematch:latest .
   docker tag karematch:latest karematch:v1.2.3
   ```

4. ✅ **Clean up old images regularly**
   ```powershell
   # Remove unused images
   docker image prune

   # Remove all stopped containers
   docker container prune

   # Remove all unused resources
   docker system prune -a
   ```

5. ✅ **Use Docker Compose for complex setups**
   - Easier to manage multiple services
   - Reproducible environment
   - One command to start/stop everything

### Testing Checklist

Before deploying to AWS, verify locally:

- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads in browser
- [ ] API endpoints return correct data
- [ ] Database connections work
- [ ] Environment variables are read correctly
- [ ] No errors in container logs
- [ ] Memory usage is reasonable
- [ ] Application responds within acceptable time

### Performance Testing

**Check resource usage:**
```powershell
docker stats karematch-test
```

**Expected for Nano (512 MB):**
- Memory: < 250 MB
- CPU: < 50% (during normal load)

**If exceeding limits:**
- Check for memory leaks
- Optimize queries
- Consider larger instance

---

## Complete Example Workflow

**Real-world example: Adding a new feature**

```powershell
# Day 1: Start feature development
git checkout -b feature/new-therapist-search

# Make code changes
code server/routes.ts

# Test locally (first time - slow)
docker build -t karematch:latest .
docker run -d -p 5001:5000 -e NODE_ENV=production -e PORT=5000 --name test karematch:latest
curl http://localhost:5001/health
docker logs test

# Found a bug! Fix it
code server/routes.ts

# Test again (faster - cached layers)
docker stop test && docker rm test
docker build -t karematch:latest .
docker run -d -p 5001:5000 -e NODE_ENV=production -e PORT=5000 --name test karematch:latest
curl http://localhost:5001/api/therapists
# Works! ✅

# Cleanup
docker stop test && docker rm test

# Commit
git add .
git commit -m "Add new therapist search feature"
git push origin feature/new-therapist-search

# Day 2: Ready to deploy
git checkout main
git merge feature/new-therapist-search

# Final test locally
docker build -t karematch:latest .
docker run -d -p 5001:5000 --name final-test karematch:latest
curl http://localhost:5001/health
# Perfect! ✅

# Push to Docker Hub
.\push-via-docker-hub.ps1
# Pushed to mylaiviet/karematch:latest

# Deploy to AWS Lightsail (via console)
# Image: mylaiviet/karematch:latest
# Save and deploy

# Wait 3 minutes...

# Test production
curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health
# Works! ✅

# Cleanup
docker stop final-test && docker rm final-test

# Celebrate! 🎉
```

---

## Summary

**Yes, you can and SHOULD build and test locally before deploying to AWS!**

**Recommended workflow:**
1. Make code changes
2. Build Docker image locally
3. Run and test locally on port 5001
4. Fix any issues and iterate
5. When working perfectly, push to Docker Hub
6. Deploy to AWS Lightsail
7. Verify in production

**Key commands to remember:**
```powershell
# Build
docker build -t karematch:latest .

# Test
docker run -d -p 5001:5000 --name test karematch:latest
curl http://localhost:5001/health

# Debug
docker logs test

# Cleanup
docker stop test && docker rm test

# Deploy
.\push-via-docker-hub.ps1
```

This workflow saves time, money, and prevents production issues! 🚀

---

**Related Documentation:**
- [LIGHTSAIL-DEPLOYMENT-GUIDE.md](../LIGHTSAIL-DEPLOYMENT-GUIDE.md) - AWS deployment steps
- [docs/issues/aws-lightsail-deployment-issues.md](../docs/issues/aws-lightsail-deployment-issues.md) - Troubleshooting
- [push-via-docker-hub.ps1](../push-via-docker-hub.ps1) - Deployment script
