@echo off
REM ============================================================================
REM Matomo Analytics Setup Script for TherapyConnect (Windows)
REM ============================================================================

echo.
echo ============================================================================
echo  TherapyConnect - Matomo Analytics Setup
echo ============================================================================
echo.

REM Check if Docker is installed
echo [INFO] Checking for Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [SUCCESS] Docker is installed
echo.

REM Check if Docker Compose is available
echo [INFO] Checking for Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose is not installed!
        pause
        exit /b 1
    )
)
echo [SUCCESS] Docker Compose is installed
echo.

echo ============================================================================
echo  Starting Matomo Analytics Containers
echo ============================================================================
echo.

REM Pull latest images
echo [INFO] Pulling latest Matomo images...
docker-compose -f docker-compose.matomo.yml pull
echo.

REM Start containers
echo [INFO] Starting containers...
docker-compose -f docker-compose.matomo.yml up -d
echo.

REM Wait for Matomo to be ready
echo [INFO] Waiting for Matomo to be ready (this may take 30-60 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo ============================================================================
echo  Matomo Installation Complete!
echo ============================================================================
echo.
echo [32m Matomo is now running![0m
echo.
echo Access Matomo at: http://localhost:8080
echo.
echo ============================================================================
echo  Database Configuration (for installation wizard)
echo ============================================================================
echo.
echo   Database Server:   matomo-db
echo   Database Name:     matomo
echo   Database Username: matomo
echo   Database Password: SecurePassword123!
echo.
echo ============================================================================
echo  Create Two Websites in Matomo
echo ============================================================================
echo.
echo   1. TherapyConnect - Anonymous
echo      - URL: https://therapyconnect.com
echo      - Site ID should be: 1
echo.
echo   2. TherapyConnect - Authenticated
echo      - URL: https://app.therapyconnect.com
echo      - Site ID should be: 2
echo.
echo ============================================================================
echo  Next Steps
echo ============================================================================
echo.
echo   1. Open http://localhost:8080 in your browser
echo   2. Complete the installation wizard
echo   3. Create super admin account
echo   4. Create two websites (Site 1 and Site 2)
echo   5. Configure HIPAA compliance settings
echo   6. Generate API auth token
echo   7. Update .env file with Matomo configuration
echo.
echo ============================================================================
echo  Documentation
echo ============================================================================
echo.
echo   Quick Start: docs\analytics\QUICK-START.md
echo   Full Guide:  docs\analytics\MATOMO-IMPLEMENTATION-GUIDE.md
echo.
echo ============================================================================
echo  Useful Commands
echo ============================================================================
echo.
echo   View logs:     docker-compose -f docker-compose.matomo.yml logs -f
echo   Stop Matomo:   docker-compose -f docker-compose.matomo.yml down
echo   Restart:       docker-compose -f docker-compose.matomo.yml restart
echo.
echo.
echo [SUCCESS] Setup complete! Opening browser...
echo.

REM Try to open browser (Windows)
start http://localhost:8080

pause
