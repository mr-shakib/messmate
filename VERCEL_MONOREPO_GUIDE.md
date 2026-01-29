# Vercel Monorepo Deployment Guide

## Single Repository, Two Projects ✅

**Good news**: You can keep your current structure with both `backend/` and `frontend/` in one repository!

## Current Structure (Perfect for Vercel)

```
your-repo/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── vercel.json          ← Already created
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vercel.json          ← Already created
│   └── vite.config.ts
├── .git/
└── README.md
```

**This is ideal!** No need to split repositories.

## How Vercel Handles Monorepos

Vercel creates **two separate projects** from **one repository**:

1. **Project 1 (Backend)**: Points to `backend/` folder
2. **Project 2 (Frontend)**: Points to `frontend/` folder

Both projects:
- ✅ Deploy from the same Git repo
- ✅ Have separate URLs
- ✅ Have separate environment variables
- ✅ Deploy independently
- ✅ Auto-deploy on Git push

## Deployment Steps (Monorepo)

### Method 1: Vercel Dashboard (Recommended for Monorepo)

#### Step 1: Deploy Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import your Git repository**
3. Configure:
   ```
   Project Name: messmate-backend (or any name)
   Root Directory: backend          ← Important!
   Framework Preset: Other
   Build Command: npm run vercel-build
   Output Directory: dist
   Install Command: npm install
   ```
4. Click **"Deploy"**
5. **Save the URL**: `https://messmate-backend.vercel.app`

#### Step 2: Set Backend Environment Variables

1. Go to your backend project → **Settings** → **Environment Variables**
2. Add all variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   FRONTEND_URL=https://messmate-frontend.vercel.app
   CORS_ORIGIN=https://messmate-frontend.vercel.app,http://localhost:5173
   BCRYPT_ROUNDS=10
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   ```
3. Click **"Save"**
4. **Redeploy** (Deployments tab → ... → Redeploy)

#### Step 3: Deploy Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. **Import the SAME repository** (yes, same repo!)
3. Configure:
   ```
   Project Name: messmate-frontend (or any name)
   Root Directory: frontend         ← Important!
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
4. Click **"Deploy"**
5. **Save the URL**: `https://messmate-frontend.vercel.app`

#### Step 4: Set Frontend Environment Variables

1. Go to your frontend project → **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_API_URL=https://messmate-backend.vercel.app
   VITE_ENV=production
   ```
3. Click **"Save"**
4. **Redeploy**

#### Step 5: Update Backend CORS

1. Go back to **backend project** → **Settings** → **Environment Variables**
2. Update these with your actual frontend URL:
   ```
   FRONTEND_URL=https://messmate-frontend.vercel.app
   CORS_ORIGIN=https://messmate-frontend.vercel.app,http://localhost:5173
   ```
3. **Redeploy backend**

### Method 2: Vercel CLI (Monorepo)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy Backend
cd backend
vercel --prod
# Follow prompts, it will create a new project

# Deploy Frontend
cd ../frontend
vercel --prod
# Follow prompts, it will create another project

# Both projects are now linked to the same Git repo!
```

## How Auto-Deploy Works (Monorepo)

### Smart Detection

Vercel automatically detects which project to redeploy:

```
Push changes to backend/ → Only backend redeploys
Push changes to frontend/ → Only frontend redeploys
Push changes to both → Both redeploy
```

### Example Workflow

```bash
# Make backend changes
git add backend/
git commit -m "Update API endpoint"
git push

# Result: Only backend project redeploys
# Frontend stays unchanged
```

## Vercel Dashboard View

After setup, you'll see:

```
Your Vercel Dashboard
├── messmate-backend
│   ├── URL: https://messmate-backend.vercel.app
│   ├── Git: your-repo (root: backend/)
│   └── Auto-deploy: ✅ Enabled
│
└── messmate-frontend
    ├── URL: https://messmate-frontend.vercel.app
    ├── Git: your-repo (root: frontend/)
    └── Auto-deploy: ✅ Enabled
```

## Benefits of Monorepo

### ✅ Advantages

1. **Single Source of Truth**: All code in one place
2. **Easier Development**: Work on both simultaneously
3. **Shared Git History**: See all changes together
4. **Simpler CI/CD**: One repository to manage
5. **Better Collaboration**: Team works in one repo
6. **Atomic Commits**: Update both in one commit

### ⚠️ Considerations

1. **Two Separate Deployments**: Backend and frontend deploy independently
2. **Two Sets of Env Vars**: Manage separately in Vercel
3. **Two URLs**: Different domains for API and app

## Environment Variables Management

### Backend Variables (Project 1)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://messmate-frontend.vercel.app
CORS_ORIGIN=https://messmate-frontend.vercel.app
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Frontend Variables (Project 2)
```
VITE_API_URL=https://messmate-backend.vercel.app
VITE_ENV=production
```

## Testing Your Monorepo Deployment

### 1. Test Backend
```bash
curl https://messmate-backend.vercel.app/health
```

Expected:
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

### 2. Test Frontend
Visit: `https://messmate-frontend.vercel.app`

### 3. Test Integration
1. Register a user on frontend
2. Check browser console for API calls
3. Verify no CORS errors

## Common Monorepo Issues

### Issue 1: Wrong Root Directory

**Problem**: Build fails with "package.json not found"

**Solution**: 
1. Go to Project Settings → General
2. Set **Root Directory** to `backend` or `frontend`
3. Redeploy

### Issue 2: Both Projects Deploy on Every Push

**Problem**: Unnecessary deployments

**Solution**: This is normal! Vercel is smart:
- If only backend changed → Backend builds, frontend skips
- If only frontend changed → Frontend builds, backend skips
- Both changed → Both build

### Issue 3: Environment Variables Not Working

**Problem**: Variables not loading

**Solution**:
1. Verify variables are set in correct project
2. Redeploy after adding variables
3. Check variable names match exactly

## Deployment Checklist (Monorepo)

### Pre-Deployment
- [ ] Single Git repository with `backend/` and `frontend/`
- [ ] Both `vercel.json` files exist
- [ ] Code pushed to Git (GitHub/GitLab/Bitbucket)
- [ ] MongoDB Atlas configured
- [ ] JWT secrets generated

### Backend Deployment
- [ ] Backend project created in Vercel
- [ ] Root directory set to `backend`
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] Health check works

### Frontend Deployment
- [ ] Frontend project created in Vercel
- [ ] Root directory set to `frontend`
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] App loads in browser

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Backend redeployed
- [ ] Full user flow tested
- [ ] No CORS errors

## Alternative: Separate Repositories

If you ever want to split (not recommended):

### Pros
- Cleaner separation
- Independent Git history
- Smaller repo size

### Cons
- More repos to manage
- Harder to sync changes
- More complex CI/CD
- Duplicate configuration

### How to Split (If Needed)

```bash
# Create backend repo
mkdir messmate-backend
cp -r backend/* messmate-backend/
cd messmate-backend
git init
git add .
git commit -m "Initial backend"
git remote add origin <backend-repo-url>
git push -u origin main

# Create frontend repo
mkdir messmate-frontend
cp -r frontend/* messmate-frontend/
cd messmate-frontend
git init
git add .
git commit -m "Initial frontend"
git remote add origin <frontend-repo-url>
git push -u origin main
```

**But honestly, keep the monorepo!** It's easier.

## Monorepo Best Practices

### 1. Clear Folder Structure
```
repo/
├── backend/          ← All backend code
├── frontend/         ← All frontend code
├── docs/             ← Shared documentation
├── .github/          ← CI/CD workflows
└── README.md         ← Main readme
```

### 2. Shared Configuration
```
repo/
├── .gitignore        ← Shared
├── .prettierrc       ← Shared
├── .eslintrc         ← Shared (if compatible)
└── package.json      ← Optional root package.json
```

### 3. Documentation
Keep deployment docs at root:
- `README.md` - Overview
- `DEPLOYMENT.md` - How to deploy
- `CONTRIBUTING.md` - How to contribute

### 4. Git Workflow
```bash
# Feature branch
git checkout -b feature/new-api

# Make changes to both
git add backend/ frontend/
git commit -m "Add new API endpoint and UI"
git push

# Both deploy automatically!
```

## Summary

### ✅ You Can Use Monorepo (Recommended)

**Current Structure**: Perfect! ✅
```
your-repo/
├── backend/
└── frontend/
```

**Deployment**: Two Vercel projects, one Git repo

**Benefits**:
- ✅ Easier to manage
- ✅ Single source of truth
- ✅ Atomic commits
- ✅ Better collaboration

**Setup Time**: 15 minutes

### ❌ You Don't Need Separate Repos

Unless you have specific reasons like:
- Different teams managing each
- Different access controls needed
- Very large codebase

**For your app**: Monorepo is perfect!

## Quick Start (Monorepo)

```bash
# 1. Push your current repo to Git
git add .
git commit -m "Ready for deployment"
git push

# 2. Go to vercel.com/new
# 3. Import repo → Set root to "backend" → Deploy
# 4. Import repo again → Set root to "frontend" → Deploy
# 5. Set environment variables for both
# 6. Done!
```

**Total time**: ~15 minutes
**Repositories needed**: 1 (your current one)
**Vercel projects**: 2 (backend + frontend)

---

**Ready to deploy?** Follow `QUICK_DEPLOY.md` - it's already set up for your monorepo structure!
