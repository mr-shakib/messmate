#!/bin/bash

# MessMate Vercel Deployment Script
# This script helps deploy both backend and frontend to Vercel

set -e  # Exit on error

echo "🚀 MessMate Vercel Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying Backend..."
    echo "----------------------"
    cd backend
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        echo -e "${RED}❌ backend/vercel.json not found${NC}"
        exit 1
    fi
    
    # Deploy
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend deployed successfully${NC}"
    else
        echo -e "${RED}❌ Backend deployment failed${NC}"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Function to deploy frontend
deploy_frontend() {
    echo "🎨 Deploying Frontend..."
    echo "------------------------"
    cd frontend
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        echo -e "${RED}❌ frontend/vercel.json not found${NC}"
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  Warning: frontend/.env.production not found${NC}"
        echo "Make sure to set VITE_API_URL in Vercel dashboard"
    fi
    
    # Deploy
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
    else
        echo -e "${RED}❌ Frontend deployment failed${NC}"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Main menu
echo "What would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (Backend first, then Frontend)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment URLs"
echo "2. Update backend CORS_ORIGIN with frontend URL"
echo "3. Update frontend VITE_API_URL with backend URL"
echo "4. Test your application"
echo ""
echo "For detailed instructions, see:"
echo "- QUICK_DEPLOY.md"
echo "- VERCEL_DEPLOYMENT_GUIDE.md"
echo "- DEPLOYMENT_CHECKLIST.md"
echo ""
