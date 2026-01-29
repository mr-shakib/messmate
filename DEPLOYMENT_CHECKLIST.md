# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### MongoDB Atlas
- [ ] MongoDB Atlas account created
- [ ] Free cluster (M0) created
- [ ] Database user created with strong password
- [ ] IP whitelist configured: `0.0.0.0/0`
- [ ] Connection string copied and saved
- [ ] Database name: `messmate`

### Secrets Generated
- [ ] JWT Access Secret generated (32+ chars)
- [ ] JWT Refresh Secret generated (32+ chars)
- [ ] Secrets saved securely

### Git Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible
- [ ] Latest changes committed

### Files Created
- [ ] `backend/vercel.json` exists
- [ ] `frontend/vercel.json` exists
- [ ] `frontend/.env.production` exists
- [ ] `backend/.env.production.example` exists (for reference)

## Backend Deployment

### Vercel Project Setup
- [ ] Backend project created in Vercel
- [ ] Root directory set to: `backend`
- [ ] Framework preset: Other
- [ ] Build command: `npm run vercel-build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (with actual password)
- [ ] `JWT_ACCESS_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `FRONTEND_URL` (will update after frontend deploy)
- [ ] `CORS_ORIGIN` (will update after frontend deploy)
- [ ] `BCRYPT_ROUNDS=10`
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`
- [ ] `JWT_ACCESS_EXPIRATION=15m`
- [ ] `JWT_REFRESH_EXPIRATION=7d`

### Deployment
- [ ] Backend deployed successfully
- [ ] Backend URL saved: `https://_____.vercel.app`
- [ ] Health check works: `/health` returns 200
- [ ] Database connection confirmed in health check

## Frontend Deployment

### Environment Configuration
- [ ] `frontend/.env.production` updated with backend URL
- [ ] `VITE_API_URL` set to backend URL

### Vercel Project Setup
- [ ] Frontend project created in Vercel
- [ ] Root directory set to: `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### Environment Variables Set
- [ ] `VITE_API_URL` (backend URL)
- [ ] `VITE_ENV=production`

### Deployment
- [ ] Frontend deployed successfully
- [ ] Frontend URL saved: `https://_____.vercel.app`
- [ ] App loads in browser
- [ ] No console errors

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Backend `FRONTEND_URL` updated with actual frontend URL
- [ ] Backend `CORS_ORIGIN` updated with actual frontend URL
- [ ] Backend redeployed after CORS update

### Testing
- [ ] Backend health check: `curl https://backend.vercel.app/health`
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can create mess
- [ ] Can record collection
- [ ] Can create expense
- [ ] Can view balances
- [ ] Can record settlement
- [ ] Dashboard loads correctly

## Verification

### Backend Verification
```bash
# Health check
curl https://your-backend.vercel.app/health

# Expected response:
# {
#   "status": "ok",
#   "database": {
#     "status": "connected",
#     "connected": true
#   }
# }
```

### Frontend Verification
- [ ] Visit frontend URL
- [ ] No CORS errors in console
- [ ] Can complete full user flow
- [ ] API calls work correctly

## Common Issues Checklist

### If Backend Health Check Fails
- [ ] Check MongoDB Atlas IP whitelist
- [ ] Verify MONGODB_URI is correct
- [ ] Check database user credentials
- [ ] Verify database name in connection string

### If CORS Errors Occur
- [ ] Verify FRONTEND_URL matches actual frontend URL
- [ ] Verify CORS_ORIGIN includes frontend URL
- [ ] Check for trailing slashes in URLs
- [ ] Redeploy backend after CORS changes

### If Frontend Can't Connect
- [ ] Verify VITE_API_URL is correct
- [ ] Check backend is deployed and running
- [ ] Verify no typos in URLs
- [ ] Check browser console for errors

### If Build Fails
- [ ] Check build logs in Vercel
- [ ] Verify all dependencies are in package.json
- [ ] Check Node version compatibility
- [ ] Verify build command is correct

## Security Checklist

- [ ] JWT secrets are strong (32+ characters)
- [ ] MongoDB password is strong
- [ ] No secrets committed to Git
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Performance Checklist

- [ ] MongoDB indexes created (automatic from models)
- [ ] Frontend assets optimized (automatic with Vite)
- [ ] Compression enabled in Express
- [ ] No console.log in production code

## Monitoring Setup (Optional)

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] Alerts configured

## Documentation

- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Team members have access

## Continuous Deployment

- [ ] Automatic deployments enabled
- [ ] Main branch deploys to production
- [ ] Preview deployments work for other branches
- [ ] Team notified of deployment process

## Custom Domain (Optional)

- [ ] Domain purchased
- [ ] Domain added to Vercel project
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Environment variables updated with custom domain
- [ ] Both projects redeployed

## Final Verification

- [ ] All features work in production
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] Database operations work correctly
- [ ] Authentication works
- [ ] Authorization works
- [ ] All API endpoints respond correctly

## Rollback Plan

If something goes wrong:
- [ ] Previous deployment can be restored via Vercel Dashboard
- [ ] Database backup available (MongoDB Atlas automatic backups)
- [ ] Environment variables backed up
- [ ] Team knows rollback procedure

## Success Criteria

✅ Backend deployed and healthy
✅ Frontend deployed and accessible
✅ Database connected
✅ CORS configured correctly
✅ All features working
✅ No errors in logs
✅ Team can access and use the app

## Deployment Complete! 🎉

**Backend URL**: https://_____.vercel.app
**Frontend URL**: https://_____.vercel.app
**Deployed By**: _____
**Date**: _____
**Status**: ✅ Production Ready

---

## Next Steps After Deployment

1. Monitor application for 24 hours
2. Check error logs regularly
3. Set up monitoring and alerts
4. Document any issues and solutions
5. Plan for scaling if needed

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Project README](./README.md)
- [Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
