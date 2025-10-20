$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
$dbIdentifier = "karematch-db"
$region = "us-east-1"
$maxAttempts = 30
$sleepSeconds = 30

Write-Host "Starting RDS database status monitoring..." -ForegroundColor Cyan
Write-Host "Database: $dbIdentifier" -ForegroundColor Cyan
Write-Host "Region: $region" -ForegroundColor Cyan
Write-Host "Max attempts: $maxAttempts (checking every $sleepSeconds seconds)" -ForegroundColor Cyan
Write-Host ""

$status = "creating"
$attempt = 0

while ($status -ne "available" -and $attempt -lt $maxAttempts) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host "[$timestamp] Attempt $attempt/$maxAttempts - Checking database status..." -ForegroundColor Yellow

    try {
        $status = & $awsPath rds describe-db-instances --db-instance-identifier $dbIdentifier --region $region --query "DBInstances[0].DBInstanceStatus" --output text

        if ($status -eq "available") {
            Write-Host "[$timestamp] Status: $status" -ForegroundColor Green
            Write-Host ""
            Write-Host "==================================================" -ForegroundColor Green
            Write-Host "SUCCESS! Database is now AVAILABLE!" -ForegroundColor Green
            Write-Host "==================================================" -ForegroundColor Green
            break
        } else {
            Write-Host "[$timestamp] Status: $status" -ForegroundColor Yellow

            if ($attempt -lt $maxAttempts) {
                Write-Host "Waiting $sleepSeconds seconds before next check..." -ForegroundColor Gray
                Start-Sleep -Seconds $sleepSeconds
            }
        }
    } catch {
        Write-Host "Error checking status: $_" -ForegroundColor Red
        break
    }
}

if ($status -ne "available") {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "WARNING: Database did not become available within the monitoring period" -ForegroundColor Red
    Write-Host "Current status: $status" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Final Status: $status" -ForegroundColor Cyan
