# Push Docker image to Lightsail
Write-Host "Pushing karematch:latest to Lightsail..." -ForegroundColor Yellow

# Run the push command
& aws lightsail push-container-image `
    --service-name karematch `
    --label latest `
    --image karematch:latest `
    --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The image reference will be shown above (looks like: :karematch.latest.X)" -ForegroundColor Cyan
    Write-Host "Copy that reference - you'll need it for deployment" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
