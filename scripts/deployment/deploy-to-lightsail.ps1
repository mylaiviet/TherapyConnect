# Deploy to AWS Lightsail - Complete Automation
# Run as Administrator after running fix-lightsail-path.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Lightsail Deployment Script ===" -ForegroundColor Blue
Write-Host ""

# Configuration
$SERVICE_NAME = "karematch"
$IMAGE_NAME = "karematch:latest"
$REGION = "us-east-1"
$HEALTH_ENDPOINT = "https://karematch.8e74v5zr8vptw.us-east-1.cs.amazonlightsail.com/health"

# Step 1: Verify Docker image exists
Write-Host "[1/5] Verifying Docker image..." -ForegroundColor Yellow
$images = docker images $IMAGE_NAME --format "{{.Repository}}:{{.Tag}}"
if ($images -like "*$IMAGE_NAME*") {
    Write-Host "✅ Found image: $IMAGE_NAME" -ForegroundColor Green
} else {
    Write-Host "❌ Image not found: $IMAGE_NAME" -ForegroundColor Red
    Write-Host "Please run: docker build -t $IMAGE_NAME ." -ForegroundColor Yellow
    exit 1
}

# Step 2: Test lightsailctl is available
Write-Host ""
Write-Host "[2/5] Testing lightsailctl plugin..." -ForegroundColor Yellow
try {
    $testOutput = & aws lightsail push-container-image --help 2>&1
    if ($testOutput -like "*lightsailctl*" -or $testOutput -like "*Lightsail Control*") {
        Write-Host "✅ lightsailctl plugin is available" -ForegroundColor Green
    } else {
        throw "Plugin not working"
    }
} catch {
    Write-Host "❌ lightsailctl plugin not found" -ForegroundColor Red
    Write-Host "Please run: .\fix-lightsail-path.ps1" -ForegroundColor Yellow
    Write-Host "Then restart PowerShell and try again" -ForegroundColor Yellow
    exit 1
}

# Step 3: Push image to Lightsail
Write-Host ""
Write-Host "[3/5] Pushing image to Lightsail..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan
Write-Host ""

try {
    $pushOutput = & aws lightsail push-container-image `
        --service-name $SERVICE_NAME `
        --label latest `
        --image $IMAGE_NAME `
        --region $REGION 2>&1

    Write-Host $pushOutput

    # Extract image reference from output
    $imageRef = $pushOutput | Select-String -Pattern ":$SERVICE_NAME\.latest\.\d+" | Select-Object -First 1

    if ($imageRef) {
        $imageReference = $imageRef.Line.Trim()
        Write-Host ""
        Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
        Write-Host "Image reference: $imageReference" -ForegroundColor Cyan
        Write-Host ""
    } else {
        # Try to find the reference in a different format
        $imageRef = $pushOutput | Select-String -Pattern "Refer to this image as" -Context 0,1
        if ($imageRef) {
            Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
            Write-Host $imageRef -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Image may have been pushed, but couldn't extract reference" -ForegroundColor Yellow
            Write-Host "Check the output above for the image reference" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Failed to push image" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Instructions for manual deployment
Write-Host ""
Write-Host "[4/5] Manual Deployment Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "The image has been pushed to Lightsail's registry." -ForegroundColor White
Write-Host "Now you need to update the deployment in the AWS Console:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/$SERVICE_NAME/deployments" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Click: 'Modify your deployment'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In the 'Image' field, REPLACE the ECR URL with:" -ForegroundColor Cyan
Write-Host "   $imageReference" -ForegroundColor Yellow
Write-Host "   (If the reference above is blank, look for it in the push output)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Scroll down and click: 'Save and deploy'" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Wait 2-3 minutes for deployment to complete" -ForegroundColor Cyan
Write-Host ""

# Step 5: Wait for user confirmation
Write-Host "[5/5] Waiting for deployment..." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Have you completed the manual deployment steps? (yes/no)"

if ($confirmation -eq "yes" -or $confirmation -eq "y") {
    Write-Host ""
    Write-Host "Testing health endpoint..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    try {
        $response = Invoke-WebRequest -Uri $HEALTH_ENDPOINT -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SUCCESS! Application is running" -ForegroundColor Green
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
            Write-Host ""
            Write-Host "Application URL: $HEALTH_ENDPOINT" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Health check failed or deployment still in progress" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check deployment status at:" -ForegroundColor Yellow
        Write-Host "https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/$SERVICE_NAME/deployments" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Deployment skipped. Complete the manual steps above when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Script Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "- Check deployment logs in Lightsail console" -ForegroundColor White
Write-Host "- Test your application endpoints" -ForegroundColor White
Write-Host "- Monitor metrics in the Lightsail dashboard" -ForegroundColor White
