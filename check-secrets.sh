#!/bin/bash

# Secret Detection Script
# Run this before committing to check for potential secrets

echo "🔍 Checking for potential secrets in your repository..."
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any issues found
ISSUES_FOUND=0

# Check 1: .env files
echo "1. Checking for .env files..."
if git ls-files | grep -E "\.env$" > /dev/null; then
    echo -e "${RED}❌ CRITICAL: .env files found in Git!${NC}"
    git ls-files | grep -E "\.env$"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No .env files in Git${NC}"
fi
echo ""

# Check 2: MongoDB URIs
echo "2. Checking for MongoDB connection strings..."
if git grep -n "mongodb+srv://" -- ':!*.md' ':!*.example' ':!check-secrets.sh' > /dev/null 2>&1; then
    echo -e "${RED}❌ CRITICAL: MongoDB URI found in code!${NC}"
    git grep -n "mongodb+srv://" -- ':!*.md' ':!*.example' ':!check-secrets.sh'
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No MongoDB URIs in code${NC}"
fi
echo ""

# Check 3: JWT Secrets
echo "3. Checking for JWT secrets..."
if git grep -n -E "JWT_.*SECRET.*=.*[a-zA-Z0-9]{20,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh' > /dev/null 2>&1; then
    echo -e "${RED}❌ CRITICAL: JWT secret found in code!${NC}"
    git grep -n -E "JWT_.*SECRET.*=.*[a-zA-Z0-9]{20,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh'
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No JWT secrets in code${NC}"
fi
echo ""

# Check 4: Password patterns
echo "4. Checking for password patterns..."
if git grep -n -i -E "(password|passwd|pwd).*=.*['\"][^'\"]{8,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh' ':!package-lock.json' > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  WARNING: Potential password found${NC}"
    git grep -n -i -E "(password|passwd|pwd).*=.*['\"][^'\"]{8,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh' ':!package-lock.json'
    echo -e "${YELLOW}Please review these matches manually${NC}"
fi
echo ""

# Check 5: API keys
echo "5. Checking for API keys..."
if git grep -n -E "(api_key|apikey|api-key).*=.*['\"][a-zA-Z0-9]{20,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh' > /dev/null 2>&1; then
    echo -e "${RED}❌ CRITICAL: API key found in code!${NC}"
    git grep -n -E "(api_key|apikey|api-key).*=.*['\"][a-zA-Z0-9]{20,}" -- ':!*.md' ':!*.example' ':!check-secrets.sh'
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No API keys in code${NC}"
fi
echo ""

# Check 6: Private keys
echo "6. Checking for private keys..."
if git ls-files | grep -E "\.(pem|key|cert|crt|p12|pfx)$" > /dev/null; then
    echo -e "${RED}❌ CRITICAL: Private key files found in Git!${NC}"
    git ls-files | grep -E "\.(pem|key|cert|crt|p12|pfx)$"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No private key files in Git${NC}"
fi
echo ""

# Check 7: Vercel files
echo "7. Checking for Vercel deployment files..."
if git ls-files | grep -E "^\.vercel/" > /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: .vercel/ directory in Git${NC}"
    echo "This directory contains deployment info and should be in .gitignore"
    git ls-files | grep -E "^\.vercel/"
else
    echo -e "${GREEN}✅ No .vercel/ directory in Git${NC}"
fi
echo ""

# Check 8: node_modules
echo "8. Checking for node_modules..."
if git ls-files | grep -E "node_modules/" > /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: node_modules in Git${NC}"
    echo "This should be in .gitignore"
else
    echo -e "${GREEN}✅ No node_modules in Git${NC}"
fi
echo ""

# Check 9: .gitignore exists
echo "9. Checking .gitignore files..."
GITIGNORE_COUNT=0
if [ -f ".gitignore" ]; then
    GITIGNORE_COUNT=$((GITIGNORE_COUNT + 1))
fi
if [ -f "backend/.gitignore" ]; then
    GITIGNORE_COUNT=$((GITIGNORE_COUNT + 1))
fi
if [ -f "frontend/.gitignore" ]; then
    GITIGNORE_COUNT=$((GITIGNORE_COUNT + 1))
fi

if [ $GITIGNORE_COUNT -eq 3 ]; then
    echo -e "${GREEN}✅ All .gitignore files present (3/3)${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Missing .gitignore files (found $GITIGNORE_COUNT/3)${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "Summary:"
echo "=================================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No critical issues found!${NC}"
    echo -e "${GREEN}Your repository appears to be safe from secret leaks.${NC}"
    echo ""
    echo "You can safely commit and push your changes."
    exit 0
else
    echo -e "${RED}❌ CRITICAL ISSUES FOUND!${NC}"
    echo -e "${RED}DO NOT commit or push until these are resolved!${NC}"
    echo ""
    echo "Steps to fix:"
    echo "1. Remove secrets from code"
    echo "2. Use environment variables instead"
    echo "3. Add files to .gitignore if needed"
    echo "4. Run this script again to verify"
    echo ""
    echo "See SECURITY_CHECKLIST.md for detailed instructions."
    exit 1
fi
