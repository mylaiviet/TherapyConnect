# Direct Push to Lightsail - Workaround for Plugin Discovery Issues
# This script calls lightsailctl.exe directly instead of through AWS CLI

$ErrorActionPreference = "Stop"

Write-Host "=== Direct Lightsail Image Push ===" -ForegroundColor Blue
Write-Host ""

# Configuration
$SERVICE_NAME = "karematch"
$IMAGE_NAME = "karematch:latest"
$REGION = "us-east-1"
$LIGHTSAILCTL = "C:\karematch\lightsailctl.exe"

# Verify lightsailctl.exe exists
if (-not (Test-Path $LIGHTSAILCTL)) {
    Write-Host "❌ lightsailctl.exe not found at: $LIGHTSAILCTL" -ForegroundColor Red
    exit 1
}

# Verify Docker image exists
Write-Host "[1/3] Verifying Docker image..." -ForegroundColor Yellow
$images = docker images $IMAGE_NAME --format "{{.Repository}}:{{.Tag}}"
if ($images -like "*$IMAGE_NAME*") {
    Write-Host "✅ Found image: $IMAGE_NAME" -ForegroundColor Green
} else {
    Write-Host "❌ Image not found: $IMAGE_NAME" -ForegroundColor Red
    Write-Host "Please run: docker build -t $IMAGE_NAME ." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Pushing image to Lightsail..." -ForegroundColor Yellow
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Cyan
Write-Host "Image: $IMAGE_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 3-5 minutes depending on your internet speed..." -ForegroundColor Gray
Write-Host ""

try {
    # Call lightsailctl directly with the push-container-image command
    # The AWS CLI delegates to this plugin anyway
    $env:AWS_DEFAULT_REGION = $REGION

    # Run the push command
    $output = & docker save $IMAGE_NAME | & $LIGHTSAILCTL push-image `
        --service-name $SERVICE_NAME `
        --label latest `
        --region $REGION 2>&1

    Write-Host $output

    # Look for the image reference in the output
    $imageRefMatch = $output | Select-String -Pattern ":$SERVICE_NAME\.latest\.\d+"

    if ($imageRefMatch) {
        $imageRef = $imageRefMatch.Matches[0].Value
        Write-Host ""
        Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "IMAGE REFERENCE (copy this):" -ForegroundColor Yellow
        Write-Host $imageRef -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "✅ Image appears to have been pushed" -ForegroundColor Green
        Write-Host "⚠️  Could not automatically extract image reference" -ForegroundColor Yellow
        Write-Host "Look for it in the output above - it will look like: :karematch.latest.X" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Failed to push image" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify AWS credentials are configured: aws sts get-caller-identity" -ForegroundColor Gray
    Write-Host "2. Verify IAM permissions include lightsail:*" -ForegroundColor Gray
    Write-Host "3. Verify Lightsail service exists: aws lightsail get-container-services --service-name $SERVICE_NAME --region $REGION" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[3/3] Next Steps" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now update the deployment in Lightsail Console:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/$SERVICE_NAME/deployments" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Click: 'Modify your deployment'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In the 'Image' field, replace the ECR URL with the reference above" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click: 'Save and deploy'" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Wait 2-3 minutes for deployment to complete" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Press Enter to test the health endpoint (or Ctrl+C to exit)"

Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $healthUrl = "https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health"
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS! Application is running!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "URL: $healthUrl" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Health check failed or deployment still in progress" -ForegroundColor Yellow
    Write-Host "Check the deployment status in Lightsail console" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
