# Vercel Monorepo - Visual Guide

## Your Current Setup ✅

```
📁 your-git-repository/
│
├── 📁 backend/
│   ├── 📁 src/
│   ├── 📄 package.json
│   ├── 📄 vercel.json          ← Points Vercel to this folder
│   └── 📄 tsconfig.json
│
├── 📁 frontend/
│   ├── 📁 src/
│   ├── 📄 package.json
│   ├── 📄 vercel.json          ← Points Vercel to this folder
│   └── 📄 vite.config.ts
│
├── 📁 .git/                     ← Single Git repository
└── 📄 README.md
```

**This is PERFECT for Vercel!** ✅ No changes needed.

---

## How Vercel Sees Your Repo

```
                    Your Git Repository
                            │
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
    
    Vercel Project 1                Vercel Project 2
    ┌─────────────────┐            ┌─────────────────┐
    │  Backend API    │            │  Frontend App   │
    │                 │            │                 │
    │  Root: backend/ │            │  Root: frontend/│
    │  Build: npm run │            │  Build: npm run │
    │         vercel- │            │         build   │
    │         build   │            │                 │
    │                 │            │  Framework:     │
    │  Output: dist/  │            │  Vite           │
    └─────────────────┘            └─────────────────┘
            │                               │
            ▼                               ▼
    
    https://backend.vercel.app     https://frontend.vercel.app
```

---

## Deployment Flow

### Step 1: Import Repository (Backend)

```
You: Go to vercel.com/new
     ↓
Vercel: "Which Git repository?"
     ↓
You: Select "your-repository"
     ↓
Vercel: "Configure project"
     ↓
You: Set Root Directory = "backend"
     ↓
Vercel: Creates "Project 1" (Backend)
     ↓
Result: https://your-backend.vercel.app ✅
```

### Step 2: Import Repository Again (Frontend)

```
You: Go to vercel.com/new AGAIN
     ↓
Vercel: "Which Git repository?"
     ↓
You: Select "your-repository" (SAME REPO!)
     ↓
Vercel: "Configure project"
     ↓
You: Set Root Directory = "frontend"
     ↓
Vercel: Creates "Project 2" (Frontend)
     ↓
Result: https://your-frontend.vercel.app ✅
```

---

## Auto-Deploy Magic 🪄

### Scenario 1: Backend Changes Only

```
You:
├── Edit backend/src/services/auth.service.ts
├── git add backend/
├── git commit -m "Update auth logic"
└── git push

Vercel:
├── Detects changes in backend/
├── ✅ Redeploys Backend Project
└── ⏭️  Skips Frontend Project (no changes)

Result:
├── Backend: New deployment
└── Frontend: Unchanged
```

### Scenario 2: Frontend Changes Only

```
You:
├── Edit frontend/src/components/LoginForm.tsx
├── git add frontend/
├── git commit -m "Update login UI"
└── git push

Vercel:
├── Detects changes in frontend/
├── ⏭️  Skips Backend Project (no changes)
└── ✅ Redeploys Frontend Project

Result:
├── Backend: Unchanged
└── Frontend: New deployment
```

### Scenario 3: Both Changed

```
You:
├── Edit backend/src/routes/auth.routes.ts
├── Edit frontend/src/services/api.ts
├── git add .
├── git commit -m "Update API and client"
└── git push

Vercel:
├── Detects changes in both folders
├── ✅ Redeploys Backend Project
└── ✅ Redeploys Frontend Project

Result:
├── Backend: New deployment
└── Frontend: New deployment
```

---

## Vercel Dashboard View

After setup, your dashboard looks like this:

```
┌─────────────────────────────────────────────────────────┐
│                  Vercel Dashboard                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📦 messmate-backend                                     │
│  ├── 🌐 https://messmate-backend.vercel.app             │
│  ├── 📁 Git: your-repo (Root: backend/)                 │
│  ├── 🔄 Auto-deploy: Enabled                            │
│  └── 📊 Last deployed: 2 minutes ago                    │
│                                                          │
│  📦 messmate-frontend                                    │
│  ├── 🌐 https://messmate-frontend.vercel.app            │
│  ├── 📁 Git: your-repo (Root: frontend/)                │
│  ├── 🔄 Auto-deploy: Enabled                            │
│  └── 📊 Last deployed: 1 minute ago                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables Setup

### Backend Project (Project 1)

```
Vercel Dashboard → messmate-backend → Settings → Environment Variables

┌─────────────────────────────────────────────────────────┐
│  Variable Name              │  Value                     │
├─────────────────────────────┼────────────────────────────┤
│  NODE_ENV                   │  production                │
│  MONGODB_URI                │  mongodb+srv://...         │
│  JWT_ACCESS_SECRET          │  your-secret-here          │
│  JWT_REFRESH_SECRET         │  your-secret-here          │
│  FRONTEND_URL               │  https://frontend.vercel...│
│  CORS_ORIGIN                │  https://frontend.vercel...│
│  BCRYPT_ROUNDS              │  10                        │
│  RATE_LIMIT_WINDOW_MS       │  900000                    │
│  RATE_LIMIT_MAX_REQUESTS    │  100                       │
│  JWT_ACCESS_EXPIRATION      │  15m                       │
│  JWT_REFRESH_EXPIRATION     │  7d                        │
└─────────────────────────────┴────────────────────────────┘
```

### Frontend Project (Project 2)

```
Vercel Dashboard → messmate-frontend → Settings → Environment Variables

┌─────────────────────────────────────────────────────────┐
│  Variable Name              │  Value                     │
├─────────────────────────────┼────────────────────────────┤
│  VITE_API_URL               │  https://backend.vercel... │
│  VITE_ENV                   │  production                │
└─────────────────────────────┴────────────────────────────┘
```

---

## Communication Flow

```
┌─────────────┐
│   Browser   │
│  (User)     │
└──────┬──────┘
       │
       │ 1. Visit https://frontend.vercel.app
       ▼
┌─────────────────────────────────────┐
│  Frontend (Vercel Static Hosting)   │
│  - React App                        │
│  - Loads in browser                 │
└──────┬──────────────────────────────┘
       │
       │ 2. API calls to VITE_API_URL
       │    (https://backend.vercel.app)
       ▼
┌─────────────────────────────────────┐
│  Backend (Vercel Serverless)        │
│  - Express API                      │
│  - Handles requests                 │
└──────┬──────────────────────────────┘
       │
       │ 3. Database queries
       ▼
┌─────────────────────────────────────┐
│  MongoDB Atlas (Cloud)              │
│  - Stores data                      │
│  - Returns results                  │
└─────────────────────────────────────┘
```

---

## Comparison: Monorepo vs Separate Repos

### Monorepo (Your Current Setup) ✅

```
📁 one-repository/
├── backend/
└── frontend/

Pros:
✅ Single source of truth
✅ Easier to manage
✅ Atomic commits (update both at once)
✅ Shared Git history
✅ Better for small teams
✅ Simpler CI/CD

Cons:
⚠️ Two Vercel projects to configure
⚠️ Larger repo size (minor)
```

### Separate Repos ❌ (Not Recommended)

```
📁 backend-repository/
└── (backend code)

📁 frontend-repository/
└── (frontend code)

Pros:
✅ Cleaner separation
✅ Independent Git history

Cons:
❌ Two repos to manage
❌ Harder to sync changes
❌ More complex CI/CD
❌ Duplicate configuration
❌ More work for no benefit
```

**Verdict**: Stick with monorepo! ✅

---

## Quick Reference

### Deploy Backend
```bash
cd backend
vercel --prod
```

### Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Check Deployments
```bash
vercel ls
```

### View Logs
```bash
# Backend logs
vercel logs <backend-url>

# Frontend logs
vercel logs <frontend-url>
```

---

## Common Questions

### Q: Do I need two Git repositories?
**A**: No! ❌ One repository is perfect.

### Q: Will both deploy on every push?
**A**: Vercel is smart - only changed projects redeploy.

### Q: Can I use different Git branches?
**A**: Yes! Each project can deploy from different branches.

### Q: How do I rollback?
**A**: In Vercel Dashboard → Deployments → Click "..." → "Promote to Production"

### Q: Can I use custom domains?
**A**: Yes! Add domains in each project's settings.

### Q: Do I pay twice?
**A**: No! Free tier covers both projects.

---

## Summary

```
✅ Keep your current monorepo structure
✅ Deploy backend: Set root to "backend/"
✅ Deploy frontend: Set root to "frontend/"
✅ Two Vercel projects, one Git repo
✅ Auto-deploy works perfectly
✅ No need to split repositories
```

**You're all set!** Follow `QUICK_DEPLOY.md` to deploy now.
