# Alternative: Push to Docker Hub, then deploy from there
# This bypasses the lightsailctl plugin issue entirely

$ErrorActionPreference = "Stop"

Write-Host "=== Alternative Deployment: Docker Hub ===" -ForegroundColor Blue
Write-Host ""
Write-Host "This method pushes your image to Docker Hub (public registry)" -ForegroundColor Yellow
Write-Host "Then Lightsail pulls from Docker Hub instead of needing lightsailctl" -ForegroundColor Yellow
Write-Host ""

# Configuration
$LOCAL_IMAGE = "karematch:latest"
$DOCKER_USERNAME = Read-Host "Enter your Docker Hub username (or press Ctrl+C to cancel)"

if ([string]::IsNullOrWhiteSpace($DOCKER_USERNAME)) {
    Write-Host "❌ Docker Hub username required" -ForegroundColor Red
    exit 1
}

$DOCKER_IMAGE = "$DOCKER_USERNAME/karematch:latest"

Write-Host ""
Write-Host "[1/4] Verifying local image..." -ForegroundColor Yellow
$images = docker images $LOCAL_IMAGE --format "{{.Repository}}:{{.Tag}}"
if ($images -like "*$LOCAL_IMAGE*") {
    Write-Host "✅ Found: $LOCAL_IMAGE" -ForegroundColor Green
} else {
    Write-Host "❌ Image not found: $LOCAL_IMAGE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Logging in to Docker Hub..." -ForegroundColor Yellow
Write-Host "Please enter your Docker Hub password when prompted" -ForegroundColor Gray
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Tagging image..." -ForegroundColor Yellow
docker tag $LOCAL_IMAGE $DOCKER_IMAGE
Write-Host "✅ Tagged as: $DOCKER_IMAGE" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Pushing to Docker Hub..." -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes..." -ForegroundColor Gray
docker push $DOCKER_IMAGE

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Image pushed successfully to Docker Hub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "IMAGE REFERENCE (copy this):" -ForegroundColor Yellow
    Write-Host $DOCKER_IMAGE -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Lightsail console → karematch → Deployments" -ForegroundColor White
    Write-Host "2. Click 'Modify your deployment'" -ForegroundColor White
    Write-Host "3. In the 'Image' field, enter:" -ForegroundColor White
    Write-Host "   $DOCKER_IMAGE" -ForegroundColor Yellow
    Write-Host "4. Click 'Save and deploy'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
