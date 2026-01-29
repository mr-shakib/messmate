# Vercel Deployment Guide - MessMate

## Overview

This guide covers deploying the MessMate application to Vercel. Since Vercel is optimized for frontend and serverless functions, we'll deploy:
- **Frontend**: React app (static hosting)
- **Backend**: Express API as serverless functions

## Architecture on Vercel

```
Frontend (Vercel)          Backend (Vercel Serverless)
├── React App              ├── API Routes as Functions
├── Static Assets          ├── MongoDB Atlas (external)
└── Environment Vars       └── Environment Vars
```

## Prerequisites

1. Vercel account (free tier works)
2. MongoDB Atlas account (free tier works)
3. Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel CLI (optional): `npm i -g vercel`

## Part 1: Prepare MongoDB Atlas

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist all IPs: `0.0.0.0/0` (for Vercel's dynamic IPs)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/messmate`

## Part 2: Backend Deployment (Serverless)

### Step 1: Restructure Backend for Serverless

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Backend Package.json

Add to `backend/package.json`:

```json
{
  "scripts": {
    "vercel-build": "tsc",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Step 3: Update CORS Configuration

Update `backend/src/app.ts` to allow your Vercel frontend:

```typescript
// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app', // Add your Vercel frontend URL
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### Step 4: Deploy Backend to Vercel

#### Option A: Using Vercel CLI

```bash
cd backend
vercel login
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Set Root Directory: `backend`
5. Framework Preset: Other
6. Build Command: `npm run vercel-build`
7. Output Directory: `dist`
8. Install Command: `npm install`

### Step 5: Set Backend Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/messmate
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
FRONTEND_URL=https://your-frontend.vercel.app
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate secure secrets**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Get Backend URL

After deployment, Vercel will give you a URL like:
`https://your-backend.vercel.app`

Save this for frontend configuration.

## Part 3: Frontend Deployment

### Step 1: Update Frontend Environment

Create `frontend/.env.production`:

```
VITE_API_URL=https://your-backend.vercel.app
VITE_ENV=production
```

### Step 2: Update API Service

Ensure `frontend/src/services/api.ts` uses the environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 3: Create Vercel Configuration

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 4: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI

```bash
cd frontend
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to Vercel Dashboard
2. Click "Add New" → "Project"
3. Import your Git repository (or create new project)
4. Set Root Directory: `frontend`
5. Framework Preset: Vite
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Install Command: `npm install`

### Step 5: Set Frontend Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.vercel.app
VITE_ENV=production
```

## Part 4: Update Backend CORS

After getting your frontend URL, update backend environment:

1. Go to Backend project in Vercel
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your frontend URL
4. Redeploy backend

## Part 5: Testing Deployment

### Test Backend

```bash
curl https://your-backend.vercel.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T...",
  "database": "connected"
}
```

### Test Frontend

1. Visit `https://your-frontend.vercel.app`
2. Register a new user
3. Create a mess
4. Test all features

## Deployment Checklist

### Backend
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] `vercel.json` created
- [ ] Environment variables set
- [ ] Backend deployed
- [ ] Health check endpoint working
- [ ] CORS configured with frontend URL

### Frontend
- [ ] `.env.production` created
- [ ] `vercel.json` created
- [ ] API URL configured
- [ ] Environment variables set
- [ ] Frontend deployed
- [ ] Can access the app
- [ ] Can register/login
- [ ] API calls working

## Common Issues & Solutions

### Issue 1: CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
1. Check backend CORS configuration includes frontend URL
2. Verify `FRONTEND_URL` environment variable in backend
3. Redeploy backend after updating CORS

### Issue 2: MongoDB Connection Failed

**Problem**: Backend can't connect to MongoDB

**Solution**:
1. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Verify connection string in `MONGODB_URI`
3. Check database user credentials
4. Ensure network access is enabled

### Issue 3: Environment Variables Not Working

**Problem**: App uses default values instead of environment variables

**Solution**:
1. Verify variables are set in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### Issue 4: 404 on Frontend Routes

**Problem**: Refreshing page gives 404

**Solution**:
- Ensure `vercel.json` has rewrite rules (already included above)

### Issue 5: Build Fails

**Problem**: Deployment fails during build

**Solution**:
1. Check build logs in Vercel Dashboard
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `dependencies` (not `devDependencies`)
4. Check Node version compatibility

## Alternative: Deploy Backend Elsewhere

If you prefer a traditional server for the backend:

### Option 1: Railway
- Better for long-running processes
- Free tier available
- Easy MongoDB integration

### Option 2: Render
- Free tier with auto-sleep
- Good for Node.js apps
- Built-in PostgreSQL/MongoDB

### Option 3: DigitalOcean App Platform
- $5/month for basic app
- Managed MongoDB available
- Good performance

### Option 4: Heroku
- Classic PaaS
- Easy deployment
- Add-ons for MongoDB

## Monorepo Deployment (Both in One Repo)

If you want to deploy both from a single repository:

### Structure
```
project/
├── backend/
│   ├── vercel.json
│   └── ...
├── frontend/
│   ├── vercel.json
│   └── ...
└── README.md
```

### Deploy
1. Create two separate projects in Vercel
2. Project 1: Root Directory = `backend`
3. Project 2: Root Directory = `frontend`
4. Both will deploy from the same Git repo

## Continuous Deployment

Vercel automatically deploys when you push to Git:

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch

### Workflow
```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Sends notification
```

## Cost Estimation

### Free Tier (Hobby)
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage, shared cluster
- **Total**: $0/month

### Pro Tier (If Needed)
- **Vercel Pro**: $20/month (more bandwidth, team features)
- **MongoDB Atlas M10**: $57/month (dedicated cluster)
- **Total**: ~$77/month

## Performance Optimization

### Backend
1. Enable compression in Express
2. Use MongoDB indexes (already implemented)
3. Implement caching for frequent queries
4. Use connection pooling

### Frontend
1. Code splitting (Vite does this automatically)
2. Lazy load routes
3. Optimize images
4. Use CDN for assets (Vercel does this)

## Monitoring

### Vercel Analytics
- Enable in Project Settings
- Track page views, performance
- Free on Pro plan

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for APM

## Security Checklist

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] JWT secrets are strong (32+ chars)
- [ ] MongoDB credentials secured
- [ ] No secrets in code
- [ ] Security headers configured

## Next Steps

1. Deploy backend to Vercel
2. Deploy frontend to Vercel
3. Test all features
4. Set up custom domain (optional)
5. Enable analytics
6. Set up monitoring
7. Configure CI/CD

## Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `messmate.com`)
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### Update Environment Variables

After adding domain:
1. Update `FRONTEND_URL` in backend
2. Update `VITE_API_URL` in frontend
3. Redeploy both

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Quick Deploy Commands

```bash
# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd frontend
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

That's it! Your MessMate application should now be live on Vercel! 🚀
