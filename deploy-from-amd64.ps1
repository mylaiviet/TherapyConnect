# Run this script on your AMD64 Windows machine
# PowerShell version

$ErrorActionPreference = "Stop"

Write-Host "=== KareMatch AMD64 Deployment Script ===" -ForegroundColor Blue
Write-Host ""

# Step 1: Clone/update repository
if (-not (Test-Path "TherapyConnect")) {
    Write-Host "[1/6] Cloning repository..." -ForegroundColor Yellow
    # Replace with your actual repo URL
    # git clone <YOUR_REPO_URL> TherapyConnect
    Write-Host "Please clone your repository first, then run this script from inside it" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[1/6] Using existing repository..." -ForegroundColor Yellow
    # Uncomment to auto-pull:
    # git pull origin aws-migration
}

# Step 2: Build Docker image
Write-Host ""
Write-Host "[2/6] Building Docker image for AMD64..." -ForegroundColor Yellow
docker build -t karematch:latest .

# Step 3: Test locally
Write-Host ""
Write-Host "[3/6] Testing Docker image..." -ForegroundColor Yellow
$CONTAINER_ID = docker run -d -p 5001:5000 `
    -e NODE_ENV=production `
    -e PORT=5000 `
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" `
    -e SESSION_SECRET="test" `
    -e ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==" `
    karematch:latest

Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing
    Write-Host "✅ Health check passed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
}

docker stop $CONTAINER_ID | Out-Null
docker rm $CONTAINER_ID | Out-Null

# Step 4: Login to ECR
Write-Host ""
Write-Host "[4/6] Logging into Amazon ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 051826703172.dkr.ecr.us-east-1.amazonaws.com

# Step 5: Tag and push to ECR
Write-Host ""
Write-Host "[5/6] Pushing image to ECR..." -ForegroundColor Yellow
docker tag karematch:latest 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest
docker push 051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest

# Step 6: Deploy to Lightsail
Write-Host ""
Write-Host "[6/6] Deploying to Lightsail..." -ForegroundColor Yellow

$deploymentJson = @"
{
    "containers": {
        "karematch": {
            "image": "051826703172.dkr.ecr.us-east-1.amazonaws.com/karematch:latest",
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
    },
    "publicEndpoint": {
        "containerName": "karematch",
        "containerPort": 5000,
        "healthCheck": {
            "path": "/health",
            "intervalSeconds": 10,
            "timeoutSeconds": 8,
            "healthyThreshold": 2,
            "unhealthyThreshold": 3
        }
    }
}
"@

$deploymentJson | Out-File -FilePath "deployment-temp.json" -Encoding UTF8

aws lightsail create-container-service-deployment `
    --service-name karematch `
    --region us-east-1 `
    --cli-input-json file://deployment-temp.json

Remove-Item "deployment-temp.json"

Write-Host ""
Write-Host "=== Deployment initiated! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor deployment:" -ForegroundColor Cyan
Write-Host "aws lightsail get-container-service-deployments --service-name karematch --region us-east-1 --query 'deployments[0].state'"
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "aws logs tail /aws/lightsail/containers/karematch/karematch --region us-east-1 --follow"
Write-Host ""
Write-Host "Test health endpoint (wait 2-3 minutes first):" -ForegroundColor Cyan
Write-Host "curl https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health"
