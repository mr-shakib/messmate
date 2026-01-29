# Database Reset Guide - After Phase 1 Implementation

## Problem

After implementing Phase 1 (mess fund system), the database schema has changed significantly:
- `Expense` model: Changed split structure (`userId` → `memberId`, new split methods)
- `Settlement` model: Changed from person-to-person to mess-based settlements
- New `MoneyCollection` model added

The existing data in the database doesn't match the new schema, causing errors like:
- "User is not a member of this mess"
- 500 Internal Server Errors on dashboard, collections, expenses, settlements

## Solution: Clear Database and Start Fresh

As planned in the implementation, we're starting fresh with no data migration.

### Step 1: Stop the Backend Server

If the backend is running, stop it:
- Press `Ctrl+C` in the terminal running the backend
- Or use the process manager to stop it

### Step 2: Clear the Database

Run the cleanup script:

```bash
cd backend
node clear-database.js
```

This will:
- Connect to your MongoDB database
- Drop all collections (users, messes, expenses, settlements, etc.)
- Give you a clean slate

### Step 3: Restart the Backend

```bash
cd backend
npm run dev
```

### Step 4: Clear Frontend Storage

In your browser:
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies
4. Refresh the page

### Step 5: Register a New User

1. Go to the registration page
2. Create a new account with:
   - Name
   - Email
   - Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)

### Step 6: Create a New Mess

1. After logging in, create a new mess
2. Set member limit (6-20)
3. You'll be assigned as Owner

### Step 7: Test the New System

Now you can test the Phase 1 features:

#### Test Money Collection
```bash
POST /api/collections
{
  "messId": "your-mess-id",
  "memberId": "your-user-id",
  "amount": 1000,
  "description": "Monthly contribution"
}
```

#### Test Expense with New Split Methods
```bash
POST /api/expenses
{
  "messId": "your-mess-id",
  "amount": 900,
  "description": "Groceries",
  "category": "Groceries",
  "date": "2026-01-30",
  "paidBy": "your-user-id",
  "splitMethod": "equal"
}
```

#### Check Balances
```bash
GET /api/balances/mess-fund?messId=your-mess-id
GET /api/balances/me?messId=your-mess-id
```

#### Test Settlements
```bash
GET /api/settlements/suggestions?messId=your-mess-id

POST /api/settlements/contribution
{
  "messId": "your-mess-id",
  "memberId": "your-user-id",
  "amount": 500,
  "description": "Settling balance"
}
```

## Alternative: Manual Database Cleanup

If you prefer to use MongoDB Compass or mongo shell:

### Using MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Select each collection and click "Drop Collection"

### Using mongo shell
```bash
mongo
use messmate
db.dropDatabase()
```

## What Changed in Phase 1

### Database Models
- ✅ New `MoneyCollection` model for tracking contributions
- ✅ Updated `Expense` model with new split methods
- ✅ Updated `Settlement` model for mess-based settlements

### Balance Formula
**Old**: `Balance = Paid - Share`
**New**: `Balance = Contributed - Fair Share + Paid from Pocket`

### Split Methods
**Old**: `equal`, `unequal`, `percentage`
**New**: `equal`, `custom`, `exclude`

### Settlement Types
**Old**: Person-to-person (`fromUserId`, `toUserId`)
**New**: Mess-based (`contribution`, `refund`)

## Next Steps After Reset

1. ✅ Clear database
2. ✅ Register new user
3. ✅ Create new mess
4. ✅ Test money collection
5. ✅ Test expense creation
6. ✅ Test balance calculation
7. ✅ Test settlements
8. 🚀 Move to Phase 2: Frontend implementation

## Need Help?

If you encounter any issues:
1. Check backend logs for error details
2. Verify MongoDB is running
3. Check environment variables in `.env`
4. Ensure all dependencies are installed (`npm install`)

## Files Modified in Phase 1

### Created (2 files)
- `backend/src/models/moneyCollection.model.ts`
- `backend/src/routes/collection.routes.ts`

### Updated (12 files)
- `backend/src/models/Expense.ts`
- `backend/src/models/Settlement.ts`
- `backend/src/models/index.ts`
- `backend/src/services/balance.service.ts`
- `backend/src/services/settlement.service.ts`
- `backend/src/services/expense.service.ts`
- `backend/src/utils/expenseSplit.ts`
- `backend/src/routes/balance.routes.ts`
- `backend/src/routes/settlement.routes.ts`
- `backend/src/controllers/balance.controller.ts`
- `backend/src/controllers/settlement.controller.ts`
- `backend/src/app.ts`

See `PHASE_1_COMPLETE_SUMMARY.md` for detailed changes.
