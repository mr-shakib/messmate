# Vercel Deployment - Quick Reference Card

## 🚀 Deploy in 3 Commands

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy Backend
cd backend && vercel --prod

# 3. Deploy Frontend
cd ../frontend && vercel --prod
```

## 📋 Environment Variables

### Backend (Vercel Dashboard)
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_ACCESS_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (Vercel Dashboard)
```
VITE_API_URL=https://your-backend.vercel.app
```

## 🔑 Generate Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Test Deployment

```bash
# Backend health
curl https://your-backend.vercel.app/health

# Frontend
open https://your-frontend.vercel.app
```

## 🔧 Common Fixes

| Issue | Fix |
|-------|-----|
| Database disconnected | Add `0.0.0.0/0` to MongoDB Atlas IP whitelist |
| CORS errors | Update `CORS_ORIGIN` in backend with frontend URL |
| Can't connect | Update `VITE_API_URL` in frontend with backend URL |
| Build fails | Check Vercel logs, verify dependencies |

## 📚 Full Guides

- **5-min guide**: `QUICK_DEPLOY.md`
- **Detailed guide**: `VERCEL_DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Summary**: `DEPLOYMENT_SUMMARY.md`

## 🎯 Deployment Flow

```
MongoDB Atlas Setup (2 min)
    ↓
Deploy Backend (1 min)
    ↓
Set Backend Env Vars (1 min)
    ↓
Deploy Frontend (1 min)
    ↓
Set Frontend Env Vars (30 sec)
    ↓
Update CORS (30 sec)
    ↓
Test (1 min)
    ↓
✅ DONE! (~7 min total)
```

## 💰 Cost

**Free Tier**: $0/month
- Vercel: 100GB bandwidth
- MongoDB: 512MB storage

## 🆘 Need Help?

1. Check `VERCEL_DEPLOYMENT_GUIDE.md`
2. Review Vercel logs
3. Verify environment variables
4. Check MongoDB connection

## 📞 Support Links

- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Project Issues](https://github.com/your-repo/issues)

---

**Quick Deploy**: `./deploy.sh` (Mac/Linux) or `deploy.bat` (Windows)
