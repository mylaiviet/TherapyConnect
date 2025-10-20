# Fix Lightsail Plugin PATH - Run as Administrator
# This script permanently adds the lightsailctl plugin to the system PATH

$ErrorActionPreference = "Stop"

Write-Host "=== Lightsail Plugin PATH Fix ===" -ForegroundColor Blue
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Define the lightsailctl path
$lightsailPath = "$env:USERPROFILE\.aws\plugins\lightsail\bin"

Write-Host "[1/3] Checking if lightsailctl.exe exists..." -ForegroundColor Yellow
if (Test-Path "$lightsailPath\lightsailctl.exe") {
    Write-Host "✅ Found: $lightsailPath\lightsailctl.exe" -ForegroundColor Green
} else {
    Write-Host "❌ lightsailctl.exe not found at: $lightsailPath" -ForegroundColor Red
    Write-Host "Please run: .\install-plugin.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Adding to System PATH..." -ForegroundColor Yellow

# Get current system PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Check if already in PATH
if ($currentPath -like "*$lightsailPath*") {
    Write-Host "✅ Path already contains lightsailctl directory" -ForegroundColor Green
} else {
    # Add to PATH
    $newPath = "$currentPath;$lightsailPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "✅ Added to System PATH: $lightsailPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/3] Updating current session PATH..." -ForegroundColor Yellow
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "✅ Session PATH updated" -ForegroundColor Green

Write-Host ""
Write-Host "=== Testing lightsailctl ===" -ForegroundColor Blue
Write-Host ""

# Test if AWS CLI can find the plugin
Write-Host "Running: aws lightsail push-container-image --help" -ForegroundColor Cyan
try {
    $output = & aws lightsail push-container-image --help 2>&1
    if ($output -like "*lightsailctl*" -or $output -like "*push-container-image*") {
        Write-Host "✅ SUCCESS! AWS CLI can now find the lightsailctl plugin" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Close this PowerShell window and open a NEW one as Administrator" -ForegroundColor White
        Write-Host "2. Run: cd C:\TherapyConnect" -ForegroundColor White
        Write-Host "3. Run: .\deploy-to-lightsail.ps1" -ForegroundColor White
    } else {
        Write-Host "⚠️  Plugin installed but may need a new PowerShell session" -ForegroundColor Yellow
        Write-Host "Please close this window and open a NEW PowerShell as Administrator" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  You may need to restart PowerShell for PATH changes to take effect" -ForegroundColor Yellow
    Write-Host "Close this window and open a NEW PowerShell as Administrator, then test:" -ForegroundColor Yellow
    Write-Host "  aws lightsail push-container-image --help" -ForegroundColor White
}

Write-Host ""
Write-Host "=== PATH Fix Complete ===" -ForegroundColor Green
