# API Testing Guide - Phase 1 Endpoints

## Quick Start

After clearing the database and creating a new user/mess, use these examples to test the Phase 1 implementation.

## Authentication

### Register
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123!"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Test123!"
}
```

**Response**: Save the `accessToken` for subsequent requests

## Mess Management

### Create Mess
```bash
POST http://localhost:5000/api/messes
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Bachelor Flat 101",
  "memberLimit": 10,
  "description": "Our shared apartment"
}
```

**Response**: Save the `messId` for subsequent requests

### Get My Messes
```bash
GET http://localhost:5000/api/messes
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Money Collections (NEW in Phase 1)

### Record Collection
```bash
POST http://localhost:5000/api/collections
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "memberId": "YOUR_USER_ID",
  "amount": 1000,
  "description": "Monthly contribution - January"
}
```

### Get All Collections
```bash
GET http://localhost:5000/api/collections?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Get Total Collected
```bash
GET http://localhost:5000/api/collections/total?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Delete Collection (Owner only)
```bash
DELETE http://localhost:5000/api/collections/COLLECTION_ID?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Expenses (UPDATED in Phase 1)

### Create Expense - Equal Split
```bash
POST http://localhost:5000/api/expenses
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "amount": 900,
  "description": "Weekly groceries",
  "category": "Groceries",
  "date": "2026-01-30",
  "paidBy": "YOUR_USER_ID",
  "splitMethod": "equal"
}
```

### Create Expense - Custom Split
```bash
POST http://localhost:5000/api/expenses
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "amount": 1200,
  "description": "Electricity bill",
  "category": "Utilities",
  "date": "2026-01-30",
  "paidBy": "YOUR_USER_ID",
  "splitMethod": "custom",
  "splits": [
    { "memberId": "MEMBER_1_ID", "percentage": 40 },
    { "memberId": "MEMBER_2_ID", "percentage": 35 },
    { "memberId": "MEMBER_3_ID", "percentage": 25 }
  ]
}
```

### Create Expense - Exclude Members
```bash
POST http://localhost:5000/api/expenses
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "amount": 600,
  "description": "Dinner (some members absent)",
  "category": "Food",
  "date": "2026-01-30",
  "paidBy": "YOUR_USER_ID",
  "splitMethod": "exclude",
  "excludedMembers": ["MEMBER_ID_TO_EXCLUDE"]
}
```

### Get Expenses
```bash
GET http://localhost:5000/api/expenses?messId=YOUR_MESS_ID&page=1&limit=20
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Balances (UPDATED in Phase 1)

### Get Mess Fund Balance (NEW)
```bash
GET http://localhost:5000/api/balances/mess-fund?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCollected": 1000,
    "totalExpenses": 900,
    "messFundBalance": 100
  }
}
```

### Get My Balance (UPDATED)
```bash
GET http://localhost:5000/api/balances/me?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response** (new formula):
```json
{
  "success": true,
  "data": {
    "userId": "YOUR_USER_ID",
    "userName": "John Doe",
    "balance": 150.50,
    "status": "owed"
  }
}
```

**Balance Formula**: `Contributed - Fair Share + Paid from Pocket`

### Get All Balances
```bash
GET http://localhost:5000/api/balances?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Get Balance Breakdown
```bash
GET http://localhost:5000/api/balances/USER_ID/breakdown?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Settlements (UPDATED in Phase 1)

### Get Settlement Suggestions (UPDATED)
```bash
GET http://localhost:5000/api/settlements/suggestions?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response** (new format):
```json
{
  "success": true,
  "data": [
    {
      "member": {
        "id": "MEMBER_ID",
        "name": "Jane Doe"
      },
      "action": "pay",
      "amount": 250.50,
      "description": "Contribute to mess fund"
    },
    {
      "member": {
        "id": "MEMBER_ID_2",
        "name": "Bob Smith"
      },
      "action": "receive",
      "amount": 150.00,
      "description": "Refund from mess fund"
    }
  ]
}
```

### Record Contribution (NEW)
```bash
POST http://localhost:5000/api/settlements/contribution
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "memberId": "YOUR_USER_ID",
  "amount": 500,
  "description": "Settling my balance"
}
```

### Record Refund (NEW)
```bash
POST http://localhost:5000/api/settlements/refund
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "messId": "YOUR_MESS_ID",
  "memberId": "YOUR_USER_ID",
  "amount": 200,
  "description": "Refund for overpayment"
}
```

**Note**: Refunds will fail if mess fund balance is insufficient

### Get Settlement History (UPDATED)
```bash
GET http://localhost:5000/api/settlements?messId=YOUR_MESS_ID&type=contribution
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Query parameters:
- `type`: Filter by `contribution` or `refund`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

## Dashboard

### Get Dashboard Data
```bash
GET http://localhost:5000/api/dashboard?messId=YOUR_MESS_ID
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Testing Workflow

### Scenario 1: Basic Flow
1. Register user
2. Login (get token)
3. Create mess (get messId)
4. Record collection (₹1000)
5. Create expense (₹900, equal split)
6. Check mess fund balance (should be ₹100)
7. Check my balance
8. Get settlement suggestions

### Scenario 2: Multiple Members
1. Create mess
2. Generate invite link
3. Have other users join
4. Record collections from multiple members
5. Create expenses with different split methods
6. Check all balances
7. Record settlements

### Scenario 3: Reimbursement
1. Member pays expense from pocket (paidBy = memberId)
2. Check member's balance (should include reimbursement)
3. Member's balance = Contributed - Fair Share + Paid from Pocket

## Common Issues

### 401 Unauthorized
- Token expired or invalid
- Login again to get new token

### 403 Forbidden
- Insufficient permissions
- Check user role (Owner/Admin/Member)

### 500 Internal Server Error
- Check backend logs
- Verify messId and userId are valid
- Ensure user is member of the mess

### "User is not a member of this mess"
- Clear database and start fresh
- Ensure user joined the mess properly

## Using Postman

1. Create a new collection "MessMate API"
2. Add environment variables:
   - `baseUrl`: http://localhost:5000
   - `accessToken`: (set after login)
   - `messId`: (set after creating mess)
   - `userId`: (set after login)
3. Use `{{baseUrl}}/api/...` in requests
4. Set Authorization header: `Bearer {{accessToken}}`

## Using curl

### Example: Create Collection
```bash
curl -X POST http://localhost:5000/api/collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messId": "YOUR_MESS_ID",
    "memberId": "YOUR_USER_ID",
    "amount": 1000,
    "description": "Monthly contribution"
  }'
```

## Next Steps

After testing Phase 1 backend:
1. ✅ Verify all endpoints work
2. ✅ Test balance calculations
3. ✅ Test settlement suggestions
4. 🚀 Move to Phase 2: Frontend implementation

See `PHASE_1_COMPLETE_SUMMARY.md` for complete feature list.
