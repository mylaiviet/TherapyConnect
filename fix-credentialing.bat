@echo off
echo ================================================================================
echo FIXING CREDENTIALING INITIALIZATION
echo ================================================================================
echo.
echo This will initialize credentialing for therapists with verified NPI
echo.

node --require dotenv/config node_modules/.bin/tsx scripts/fix-credentialing-init.ts

echo.
echo ================================================================================
echo.
echo Next steps:
echo 1. Refresh your browser (Ctrl+R or F5)
echo 2. Go to Credentialing Portal - Status ^& Progress tab
echo 3. You should now see "In Progress" with NPI Verification completed
echo.
pause
