# CSRF 403 Error Troubleshooting Guide

## Problem
Getting `POST http://localhost:5000/api/messes 403 (Forbidden)` when trying to create a mess.

## Root Cause
The frontend dev server is still running the old code that doesn't include CSRF token handling. The code changes were made, but the dev server needs to be restarted to load them.

## Solution

### Step 1: Restart Frontend Dev Server

**In your terminal where frontend is running:**

```bash
# Press Ctrl+C to stop the server
# Then restart it:
cd frontend
npm run dev
```

The dev server should restart and show:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Clear Browser Cache (Optional but Recommended)

**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache in DevTools**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Clear All Cookies**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand "Cookies" in the left sidebar
4. Delete cookies for both:
   - `http://localhost:5173`
   - `http://localhost:5000`

### Step 3: Verify CSRF Token is Being Fetched

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the page
4. You should see a successful request to `/api/csrf-token`
5. Check Network tab → Look for `csrf-token` request → Should return 200 OK

### Step 4: Try Creating a Mess Again

1. Navigate to `/messes`
2. Click "Create New Mess"
3. Fill in the form
4. Click "Create Mess"

**Expected Result:** ✅ Mess created successfully!

## Verification Checklist

### ✅ Backend is Running
```bash
curl http://localhost:5000/api/csrf-token
```
Should return: `{"csrfToken":"..."}`

### ✅ Frontend is Running
Browser should show: `http://localhost:5173`

### ✅ CSRF Token is Fetched
Check browser console for:
```
GET http://localhost:5000/api/csrf-token 200 OK
```

### ✅ CSRF Token is Sent with Requests
In DevTools → Network tab → Click on the POST request → Request Headers should include:
```
X-CSRF-Token: <token-value>
```

## Common Issues

### Issue 1: "Failed to fetch CSRF token" in Console

**Cause:** Backend not running or CORS misconfigured

**Solution:**
1. Check backend is running: `curl http://localhost:5000/api/csrf-token`
2. Check backend `.env` has: `FRONTEND_URL=http://localhost:5173`
3. Restart backend if needed

### Issue 2: CSRF Token Not Included in Request Headers

**Cause:** Old code still running in browser

**Solution:**
1. Stop frontend dev server (Ctrl+C)
2. Clear browser cache
3. Restart frontend dev server
4. Hard refresh browser (Ctrl+Shift+R)

### Issue 3: Still Getting 403 After Restart

**Cause:** Multiple issues possible

**Solution:**
1. Check browser console for errors
2. Verify request headers include `X-CSRF-Token`
3. Verify request headers include `Authorization: Bearer <token>`
4. Check backend logs for CSRF validation errors
5. Try logging out and logging back in

### Issue 4: CORS Error

**Cause:** Backend CORS not configured for frontend URL

**Solution:**
Check `backend/.env`:
```
FRONTEND_URL=http://localhost:5173
```

Check `backend/src/app.ts` CORS configuration:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Debug Mode

### Enable Detailed Logging

Add this to `frontend/src/services/api.ts` (temporarily):

```typescript
// Request interceptor - attach JWT token and CSRF token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('🔍 Request:', config.method?.toUpperCase(), config.url);
    console.log('🔑 CSRF Token:', csrfToken);
    console.log('📋 Headers:', config.headers);
    
    // ... rest of the code
  }
);
```

This will show you exactly what's being sent with each request.

## Expected Request Headers

When creating a mess, the request should include:

```
POST /api/messes
Headers:
  Authorization: Bearer <jwt-token>
  X-CSRF-Token: <csrf-token>
  Content-Type: application/json
  Cookie: XSRF-TOKEN=<csrf-cookie>
```

## Backend Logs to Check

If still having issues, check backend console for:

```
CSRF token validation failed
Invalid CSRF token
Missing CSRF token
```

## Quick Fix Script

If you want to automate the restart:

**Windows (PowerShell):**
```powershell
# Stop all node processes (use with caution!)
Get-Process node | Stop-Process -Force

# Restart backend
cd backend
Start-Process powershell -ArgumentList "npm run dev"

# Restart frontend
cd ../frontend
Start-Process powershell -ArgumentList "npm run dev"
```

**Note:** This will stop ALL node processes, including any other Node apps you have running!

## Still Not Working?

If you've tried all the above and still getting 403:

1. **Check if you're logged in:**
   - The JWT token might have expired
   - Try logging out and logging back in

2. **Check backend CSRF middleware:**
   - Verify `backend/src/middleware/csrf.middleware.ts` exists
   - Verify it's applied in `backend/src/app.ts`

3. **Check backend routes:**
   - Verify `/api/messes` route is not excluded from CSRF protection
   - Check `backend/src/app.ts` for CSRF exclusions

4. **Create a minimal test:**
   ```javascript
   // In browser console
   fetch('http://localhost:5000/api/csrf-token', {
     credentials: 'include'
   })
   .then(r => r.json())
   .then(data => console.log('CSRF Token:', data.csrfToken));
   ```

5. **Ask for help:**
   - Share the full error from browser console
   - Share the request headers from Network tab
   - Share backend console logs

## Success Indicators

You'll know it's working when:

✅ No errors in browser console
✅ POST request returns 201 Created
✅ Success toast notification appears
✅ New mess appears in the list
✅ You can navigate to the mess dashboard

## Summary

**Most common solution:** Just restart the frontend dev server!

```bash
# In frontend terminal:
Ctrl+C
npm run dev
```

Then hard refresh your browser (Ctrl+Shift+R) and try again.
