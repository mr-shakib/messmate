# Login 401 Error and Balance Display Fix

## Issues Fixed

### Issue 1: BalanceSummary TypeError ✅
**Error**: `TypeError: balances is not iterable`

**Root Cause**: The API returns `{ success: true, data: [...] }` but the component expected `response.data` to be the array directly.

**Fix Applied**: Updated `BalanceSummary.tsx` to handle the correct response structure:
```typescript
const balancesData = response.data.data || response.data;
if (Array.isArray(balancesData)) {
  setBalances(balancesData);
}
```

### Issue 2: Login 401 Unauthorized ⚠️
**Error**: `POST http://localhost:5000/api/auth/login 401 (Unauthorized)`

**Possible Causes**:
1. User doesn't exist in database
2. Wrong email/password
3. Database not connected

## Solution: Register a New User

Since you're getting 401 on login, you likely need to create a user account first.

### Step 1: Navigate to Register Page

1. Open your browser to `http://localhost:5173`
2. Click "Register" or navigate to `http://localhost:5173/register`

### Step 2: Create an Account

Fill in the registration form:
- **Name**: Your Name
- **Email**: test@example.com (or any email)
- **Password**: Must meet requirements:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

Example:
- Name: `Test User`
- Email: `test@example.com`
- Password: `Password123`

### Step 3: Login

After registration, you'll be automatically logged in. If not:
1. Go to login page
2. Use the same credentials you just registered with

## Verification Steps

### 1. Check Backend is Running

```bash
# Should return 200 OK
curl http://localhost:5000/health
```

### 2. Check Database Connection

```bash
# In backend terminal, you should see:
# "MongoDB connected successfully"
```

### 3. Test Registration Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Should return:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 4. Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Should return:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Common Login Issues

### Issue: "Invalid credentials"

**Cause**: Wrong email or password

**Solution**:
1. Make sure you're using the correct email (case-sensitive)
2. Make sure you're using the correct password
3. Try registering a new account if you forgot credentials

### Issue: "User not found"

**Cause**: User doesn't exist in database

**Solution**:
1. Register a new account first
2. Check if MongoDB is running and connected

### Issue: Database connection error

**Cause**: MongoDB not running or wrong connection string

**Solution**:
1. Check MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl status mongod
   ```

2. Check backend `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/messmate
   ```

3. Restart backend server

### Issue: CSRF token error on login

**Cause**: CSRF protection blocking login

**Solution**: Login and register routes should be excluded from CSRF protection (already configured in backend).

If still having issues, check `backend/src/app.ts`:
```typescript
// Skip CSRF for authentication routes
if (req.path.startsWith('/auth/register') || 
    req.path.startsWith('/auth/login') || 
    req.path.startsWith('/auth/refresh')) {
  return next();
}
```

## Testing the Complete Flow

### 1. Register a New User

1. Navigate to `http://localhost:5173/register`
2. Fill in the form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `SecurePass123`
3. Click "Register"
4. Should redirect to dashboard

### 2. Create a Mess

1. Navigate to `/messes` (or click "Create or Join a Mess" from dashboard)
2. Click "Create New Mess"
3. Fill in:
   - Mess Name: `My First Mess`
   - Member Limit: `10`
4. Click "Create Mess"
5. Should see success message

### 3. View Balances

1. Navigate to `/settlements`
2. Should see "Balance Summary" section
3. Should show your user with balance $0.00 (settled)

### 4. Create an Expense

1. Navigate to `/expenses`
2. Click "Add Expense"
3. Fill in expense details
4. Should see expense in list

### 5. Check Balances Again

1. Navigate to `/settlements`
2. Should see updated balances

## Debugging Tips

### Enable Detailed Logging

**Frontend** - Add to `api.ts`:
```typescript
api.interceptors.request.use(
  async (config) => {
    console.log('🔍 Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Data:', config.data);
    console.log('📋 Headers:', config.headers);
    // ... rest of code
  }
);
```

**Backend** - Check terminal for logs:
```
INFO: POST /api/auth/login
INFO: User login attempt: test@example.com
ERROR: Invalid credentials for user: test@example.com
```

### Check Browser Console

Open DevTools (F12) → Console tab

Look for:
- ✅ Successful requests (200, 201)
- ❌ Failed requests (401, 403, 500)
- Error messages from the application

### Check Network Tab

Open DevTools (F12) → Network tab

1. Try to login
2. Click on the failed request
3. Check:
   - **Request Headers**: Should include `Content-Type: application/json`
   - **Request Payload**: Should include email and password
   - **Response**: Should show error message

## Quick Test Script

Create a file `test-auth.sh`:

```bash
#!/bin/bash

echo "Testing Backend Health..."
curl -s http://localhost:5000/health | jq

echo -e "\n\nTesting Registration..."
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123"
  }' | jq

echo -e "\n\nTesting Login..."
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }' | jq
```

Run it:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

## Summary

✅ **BalanceSummary fixed**: Now handles API response structure correctly

⚠️ **Login 401**: You need to register a new user first

### Next Steps:

1. **Restart frontend** to load the BalanceSummary fix:
   ```bash
   cd frontend
   # Ctrl+C to stop
   npm run dev
   ```

2. **Register a new user**:
   - Go to `http://localhost:5173/register`
   - Create an account
   - Login with those credentials

3. **Test the application**:
   - Create a mess
   - Add expenses
   - View balances
   - Record settlements

Everything should work now! 🎉
