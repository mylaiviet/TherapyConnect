# KareMatch Lightsail Deployment Script (PowerShell)
# Automates Docker build, push, and deployment to AWS Lightsail

$ErrorActionPreference = "Stop"

# Configuration
$SERVICE_NAME = "karematch"
$IMAGE_NAME = "karematch"
$IMAGE_TAG = "latest"
$AWS_REGION = "us-east-1"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "KareMatch Lightsail Deployment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Build Docker image
Write-Host "[1/4] Building Docker image..." -ForegroundColor Yellow
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Test image locally
Write-Host "[2/4] Testing Docker image locally..." -ForegroundColor Yellow
$CONTAINER_ID = docker run -d `
    -p 5001:5000 `
    -e NODE_ENV=production `
    -e PORT=5000 `
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" `
    -e SESSION_SECRET="test-secret" `
    -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" `
    "${IMAGE_NAME}:${IMAGE_TAG}"

Write-Host "Container started: $CONTAINER_ID"
Write-Host "Waiting 5 seconds for startup..."
Start-Sleep -Seconds 5

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed (HTTP $($response.StatusCode))" -ForegroundColor Red
        docker logs $CONTAINER_ID
        docker stop $CONTAINER_ID | Out-Null
        exit 1
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID | Out-Null
    exit 1
}

# Cleanup test container
docker stop $CONTAINER_ID | Out-Null
docker rm $CONTAINER_ID | Out-Null
Write-Host ""

# Step 3: Push to Lightsail
Write-Host "[3/4] Pushing image to AWS Lightsail..." -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME"
Write-Host "Region: $AWS_REGION"
Write-Host ""

& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lightsail push-container-image `
    --service-name $SERVICE_NAME `
    --label $IMAGE_TAG `
    --image "${IMAGE_NAME}:${IMAGE_TAG}" `
    --region $AWS_REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image pushed to Lightsail" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push image to Lightsail" -ForegroundColor Red
    Write-Host "Make sure:"
    Write-Host "  1. AWS CLI is configured (aws configure)"
    Write-Host "  2. You have Lightsail permissions"
    Write-Host "  3. Service name 'karematch' exists in Lightsail"
    exit 1
}
Write-Host ""

# Step 4: Deploy new version
Write-Host "[4/4] Deploying to Lightsail..." -ForegroundColor Yellow
Write-Host "Please complete these manual steps in Lightsail console:" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/$SERVICE_NAME"
Write-Host ""
Write-Host "2. Update environment variables (if not already set):"
Write-Host "   USE_PARAMETER_STORE=true"
Write-Host "   AWS_REGION=us-east-1"
Write-Host "   NODE_ENV=production"
Write-Host "   PORT=5000"
Write-Host ""
Write-Host "3. Update DATABASE_URL:"
Write-Host "   postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify"
Write-Host ""
Write-Host "4. Update Health Check settings:"
Write-Host "   - Path: /health"
Write-Host "   - Timeout: 10 seconds"
Write-Host "   - Interval: 10 seconds"
Write-Host ""
Write-Host "5. Click 'Save and deploy'"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment preparation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor deployment at:"
Write-Host "https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/$SERVICE_NAME/deployments"
