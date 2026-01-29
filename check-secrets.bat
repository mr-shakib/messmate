@echo off
REM Secret Detection Script for Windows
REM Run this before committing to check for potential secrets

echo.
echo ================================================
echo Checking for potential secrets in your repository...
echo ================================================
echo.

set ISSUES_FOUND=0

REM Check 1: .env files
echo 1. Checking for .env files...
git ls-files | findstr /R "\.env$" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] .env files found in Git!
    git ls-files | findstr /R "\.env$"
    set ISSUES_FOUND=1
) else (
    echo [OK] No .env files in Git
)
echo.

REM Check 2: MongoDB URIs
echo 2. Checking for MongoDB connection strings...
git grep -n "mongodb+srv://" -- ":!*.md" ":!*.example" ":!check-secrets.bat" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] MongoDB URI found in code!
    git grep -n "mongodb+srv://" -- ":!*.md" ":!*.example" ":!check-secrets.bat"
    set ISSUES_FOUND=1
) else (
    echo [OK] No MongoDB URIs in code
)
echo.

REM Check 3: Private keys
echo 3. Checking for private key files...
git ls-files | findstr /R "\.(pem|key|cert|crt|p12|pfx)$" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] Private key files found in Git!
    git ls-files | findstr /R "\.(pem|key|cert|crt|p12|pfx)$"
    set ISSUES_FOUND=1
) else (
    echo [OK] No private key files in Git
)
echo.

REM Check 4: Vercel files
echo 4. Checking for Vercel deployment files...
git ls-files | findstr /R "^\.vercel/" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] .vercel/ directory in Git
    echo This directory should be in .gitignore
    git ls-files | findstr /R "^\.vercel/"
) else (
    echo [OK] No .vercel/ directory in Git
)
echo.

REM Check 5: node_modules
echo 5. Checking for node_modules...
git ls-files | findstr /R "node_modules/" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] node_modules in Git
    echo This should be in .gitignore
) else (
    echo [OK] No node_modules in Git
)
echo.

REM Check 6: .gitignore files
echo 6. Checking .gitignore files...
set GITIGNORE_COUNT=0
if exist ".gitignore" set /a GITIGNORE_COUNT+=1
if exist "backend\.gitignore" set /a GITIGNORE_COUNT+=1
if exist "frontend\.gitignore" set /a GITIGNORE_COUNT+=1

if %GITIGNORE_COUNT% EQU 3 (
    echo [OK] All .gitignore files present (3/3^)
) else (
    echo [WARNING] Missing .gitignore files (found %GITIGNORE_COUNT%/3^)
)
echo.

REM Summary
echo ==================================================
echo Summary:
echo ==================================================

if %ISSUES_FOUND% EQU 0 (
    echo [OK] No critical issues found!
    echo Your repository appears to be safe from secret leaks.
    echo.
    echo You can safely commit and push your changes.
    exit /b 0
) else (
    echo [ERROR] CRITICAL ISSUES FOUND!
    echo DO NOT commit or push until these are resolved!
    echo.
    echo Steps to fix:
    echo 1. Remove secrets from code
    echo 2. Use environment variables instead
    echo 3. Add files to .gitignore if needed
    echo 4. Run this script again to verify
    echo.
    echo See SECURITY_CHECKLIST.md for detailed instructions.
    exit /b 1
)
