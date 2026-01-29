# Quick Deploy to Vercel - 5 Minutes

## ✅ Monorepo Setup (No Need to Split Repositories!)

**Good news**: You can deploy both backend and frontend from your **single repository**!

Your current structure is perfect:
```
your-repo/
├── backend/
└── frontend/
```

Vercel will create **two projects** from **one repo** by using different root directories.

## Prerequisites
- Vercel account (sign up at vercel.com)
- MongoDB Atlas account (sign up at mongodb.com/cloud/atlas)
- Git repository pushed to GitHub/GitLab/Bitbucket (your current repo is fine!)

## Step 1: MongoDB Atlas Setup (2 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox)
3. Create database user:
   - Username: `messmate`
   - Password: Generate strong password (save it!)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy: `mongodb+srv://messmate:<password>@cluster.mongodb.net/messmate`
   - Replace `<password>` with your actual password

## Step 2: Generate JWT Secrets (30 seconds)

Run this command twice to generate two secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save both outputs:
- First one: JWT_ACCESS_SECRET
- Second one: JWT_REFRESH_SECRET

## Step 3: Deploy Backend (1 minute)

### Option A: Vercel Dashboard (Recommended for Monorepo)

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import your Git repository** (the one with both backend/ and frontend/)
3. Configure:
   - **Project Name**: `messmate-backend` (or any name you like)
   - **Root Directory**: `backend` ← **IMPORTANT!**
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy backend
cd backend
vercel --prod
# Follow prompts - it will create a new project
```

### Set Environment Variables

In Vercel Dashboard → Your Backend Project → Settings → Environment Variables:

Add these variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://messmate:YOUR_PASSWORD@cluster.mongodb.net/messmate
JWT_ACCESS_SECRET=your-first-generated-secret
JWT_REFRESH_SECRET=your-second-generated-secret
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

**Important**: You'll update `FRONTEND_URL` and `CORS_ORIGIN` after deploying frontend

Click "Save" and redeploy.

**Save your backend URL**: `https://your-backend.vercel.app`

## Step 4: Deploy Frontend (1 minute)

### Deploy Frontend (Same Repository!)

#### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new) **again**
2. **Import the SAME repository** (yes, the same one!)
3. Configure:
   - **Project Name**: `messmate-frontend` (or any name you like)
   - **Root Directory**: `frontend` ← **IMPORTANT!**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click "Deploy"

**Note**: Vercel is smart - it will create a second project from the same repo!

#### Option B: Vercel CLI

```bash
cd ../frontend  # From backend directory
vercel --prod
# Follow prompts - it will create another project
```

### Set Environment Variables

In Vercel Dashboard → Your Frontend Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.vercel.app
VITE_ENV=production
```

Click "Save" and redeploy.

**Save your frontend URL**: `https://your-frontend.vercel.app`

## Step 5: Update Backend CORS (30 seconds)

1. Go to Backend project in Vercel Dashboard
2. Settings → Environment Variables
3. Update these variables with your actual frontend URL:
   ```
   FRONTEND_URL=https://your-actual-frontend.vercel.app
   CORS_ORIGIN=https://your-actual-frontend.vercel.app,http://localhost:5173
   ```
4. Click "Save"
5. Go to Deployments tab → Click "..." on latest deployment → "Redeploy"

## Step 6: Test Your Deployment (30 seconds)

### Test Backend Health

```bash
curl https://your-backend.vercel.app/health
```

Should return:
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

### Test Frontend

1. Visit `https://your-frontend.vercel.app`
2. Click "Register"
3. Create account
4. Create a mess
5. Test features

## Done! 🎉

Your app is now live at:
- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-backend.vercel.app

## Troubleshooting

### Backend shows "database: disconnected"

**Fix**:
1. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Verify `MONGODB_URI` is correct
3. Check database user credentials

### Frontend shows CORS errors

**Fix**:
1. Verify `FRONTEND_URL` in backend matches your actual frontend URL
2. Verify `CORS_ORIGIN` includes your frontend URL
3. Redeploy backend after updating

### "Cannot connect to backend"

**Fix**:
1. Check `VITE_API_URL` in frontend environment variables
2. Verify backend is deployed and health check works
3. Check browser console for errors

## Continuous Deployment

Now every time you push to your main branch:
- Vercel automatically builds and deploys
- No manual deployment needed
- Preview deployments for other branches

## Next Steps

1. ✅ Add custom domain (optional)
2. ✅ Set up monitoring
3. ✅ Enable Vercel Analytics
4. ✅ Configure alerts

## Custom Domain (Optional)

### Add Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `messmate.com`)
3. Update DNS records as instructed
4. Wait for DNS propagation

### Update Environment Variables

After adding domain:
1. Update `FRONTEND_URL` in backend to `https://messmate.com`
2. Update `CORS_ORIGIN` in backend to include your domain
3. Update `VITE_API_URL` in frontend to `https://api.messmate.com`
4. Redeploy both projects

## Cost

**Free Tier Limits**:
- Vercel: 100GB bandwidth/month, unlimited deployments
- MongoDB Atlas: 512MB storage, shared cluster
- **Total**: $0/month

Perfect for development and small-scale production!

## Support

- Vercel: [vercel.com/support](https://vercel.com/support)
- MongoDB: [mongodb.com/support](https://www.mongodb.com/support)
- Issues: Check `VERCEL_DEPLOYMENT_GUIDE.md` for detailed troubleshooting

---

**Deployment Time**: ~5 minutes
**Status**: ✅ Production Ready
