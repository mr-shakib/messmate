# CSRF Protection Fix - 403 Forbidden Error

## Problem

When trying to create a mess, you were getting:
```
POST http://localhost:5000/api/messes 403 (Forbidden)
```

## Root Cause

The backend has **CSRF (Cross-Site Request Forgery) protection** enabled for all state-changing operations (POST, PUT, DELETE, PATCH). The frontend wasn't sending the required CSRF token with requests, causing them to be rejected with 403 Forbidden.

## How CSRF Protection Works

1. **Backend generates** a CSRF token for each session
2. **Frontend fetches** the token from `/api/csrf-token`
3. **Frontend includes** the token in the `X-CSRF-Token` header for all state-changing requests
4. **Backend verifies** the token matches before processing the request

## What Was Fixed

### Updated `frontend/src/services/api.ts`:

1. **Added CSRF token fetching:**
   ```typescript
   export const fetchCsrfToken = async (): Promise<string> => {
     const response = await axios.get('/api/csrf-token', { withCredentials: true });
     csrfToken = response.data.csrfToken;
     return csrfToken;
   };
   ```

2. **Enabled credentials in axios:**
   ```typescript
   const api = axios.create({
     // ...
     withCredentials: true, // Important for CSRF cookies
   });
   ```

3. **Added CSRF token to request interceptor:**
   ```typescript
   // For POST, PUT, DELETE, PATCH requests
   if (!['get', 'head', 'options'].includes(config.method)) {
     if (!csrfToken) {
       await fetchCsrfToken();
     }
     config.headers['X-CSRF-Token'] = csrfToken;
   }
   ```

4. **Added 403 error handling:**
   ```typescript
   // If 403, try refreshing CSRF token and retry
   if (error.response?.status === 403 && !originalRequest._retry) {
     await fetchCsrfToken();
     originalRequest.headers['X-CSRF-Token'] = csrfToken;
     return api(originalRequest);
   }
   ```

## How It Works Now

### Request Flow:

1. **App loads** → Automatically fetches CSRF token
2. **User logs in** → JWT token stored
3. **User creates mess** → Request includes:
   - `Authorization: Bearer <JWT_TOKEN>` (for authentication)
   - `X-CSRF-Token: <CSRF_TOKEN>` (for CSRF protection)
4. **Backend verifies** both tokens → Request succeeds ✅

### Error Handling:

- **If CSRF token is missing** → Automatically fetches it
- **If CSRF token is invalid** → Refreshes token and retries request
- **If still fails** → Shows error to user

## Testing the Fix

### Step 1: Restart Frontend

```bash
cd frontend
# Stop the dev server (Ctrl+C)
npm run dev
```

The CSRF token will be fetched automatically when the app loads.

### Step 2: Try Creating a Mess

1. Navigate to `/messes`
2. Click "Create New Mess"
3. Fill in the form
4. Click "Create Mess"

**Expected Result:** ✅ Mess created successfully!

### Step 3: Check Browser Console

You should see:
```
✅ No 403 errors
✅ POST /api/messes → 201 Created
✅ Success toast notification
```

## Backend CSRF Configuration

The backend CSRF protection is configured in `backend/src/app.ts`:

- **Enabled for:** All POST, PUT, DELETE, PATCH requests to `/api/*`
- **Excluded routes:** `/auth/register`, `/auth/login`, `/auth/refresh`
- **Token endpoint:** `GET /api/csrf-token`
- **Token header:** `X-CSRF-Token`
- **Cookie name:** `XSRF-TOKEN`

## Security Benefits

CSRF protection prevents attackers from:
- Making unauthorized requests on behalf of authenticated users
- Performing actions without user consent
- Exploiting user sessions from malicious websites

## Troubleshooting

### If you still get 403 errors:

1. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application tab → Cookies
   - Delete all cookies for localhost:5173 and localhost:5000

2. **Check CORS configuration:**
   - Backend should allow `http://localhost:5173` origin
   - `credentials: true` should be set in CORS config

3. **Verify CSRF token is being sent:**
   - Open DevTools (F12)
   - Network tab
   - Click on the failed request
   - Check "Request Headers" for `X-CSRF-Token`

4. **Check backend logs:**
   - Look for CSRF-related errors
   - Verify token generation is working

### If CSRF token fetch fails:

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/api/csrf-token
   ```
   Should return: `{"csrfToken":"..."}`

2. **Check CORS headers:**
   - Response should include `Access-Control-Allow-Credentials: true`
   - Response should include `Access-Control-Allow-Origin: http://localhost:5173`

## Environment Variables

Make sure your `.env` files are configured correctly:

### Frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend `.env`:
```
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Summary

✅ **Fixed:** CSRF token is now automatically fetched and included in requests
✅ **Secure:** CSRF protection prevents cross-site request forgery attacks
✅ **Automatic:** Token refresh happens automatically on 403 errors
✅ **Transparent:** No changes needed to individual API calls

**The 403 Forbidden error should now be resolved!** 🎉
