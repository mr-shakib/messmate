@echo off
REM MessMate Vercel Deployment Script for Windows
REM This script helps deploy both backend and frontend to Vercel

echo.
echo ========================================
echo MessMate Vercel Deployment Script
echo ========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI is not installed
    echo Install it with: npm i -g vercel
    pause
    exit /b 1
)

echo [OK] Vercel CLI found
echo.

:menu
echo What would you like to deploy?
echo 1) Backend only
echo 2) Frontend only
echo 3) Both (Backend first, then Frontend)
echo 4) Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto end
echo Invalid choice
goto menu

:backend
echo.
echo ========================================
echo Deploying Backend...
echo ========================================
cd backend

if not exist "vercel.json" (
    echo [ERROR] backend/vercel.json not found
    cd ..
    pause
    exit /b 1
)

call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend deployment failed
    cd ..
    pause
    exit /b 1
)

echo [OK] Backend deployed successfully
cd ..
echo.
goto success

:frontend
echo.
echo ========================================
echo Deploying Frontend...
echo ========================================
cd frontend

if not exist "vercel.json" (
    echo [ERROR] frontend/vercel.json not found
    cd ..
    pause
    exit /b 1
)

if not exist ".env.production" (
    echo [WARNING] frontend/.env.production not found
    echo Make sure to set VITE_API_URL in Vercel dashboard
)

call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend deployment failed
    cd ..
    pause
    exit /b 1
)

echo [OK] Frontend deployed successfully
cd ..
echo.
goto success

:both
call :backend
if %ERRORLEVEL% NEQ 0 exit /b 1
call :frontend
if %ERRORLEVEL% NEQ 0 exit /b 1
goto success

:success
echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check Vercel dashboard for deployment URLs
echo 2. Update backend CORS_ORIGIN with frontend URL
echo 3. Update frontend VITE_API_URL with backend URL
echo 4. Test your application
echo.
echo For detailed instructions, see:
echo - QUICK_DEPLOY.md
echo - VERCEL_DEPLOYMENT_GUIDE.md
echo - DEPLOYMENT_CHECKLIST.md
echo.
pause
exit /b 0

:end
echo Exiting...
exit /b 0
