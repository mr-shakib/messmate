# Mess Fund System - Implementation Plan

## Decisions Made

✅ **Replace current system** (easier to maintain)
✅ **Allow custom splits** (equal, custom percentages, exclude members)
✅ **Automatic reimbursement** (tracked in balance calculation)
✅ **Start fresh** (no data migration)

## System Overview

### Balance Calculation Formula

```typescript
Member Balance = Money Contributed - Fair Share of Expenses + Amount Paid from Pocket

Where:
- Money Contributed = Total money given to mess fund
- Fair Share = (Total Expenses × Member's Split Percentage) / 100
- Amount Paid from Pocket = Expenses paid by member that need reimbursement

Example:
User 1 contributed: 1000 tk
Total expenses: 900 tk (3 members, equal split)
User 1 paid from pocket: 500 tk

Fair Share: 900 / 3 = 300 tk
Balance: 1000 - 300 + 500 = +1200 tk (Should get back)
```

### Split Methods

1. **Equal Split** (Default)
   - Divide equally among all active members
   - Example: 900 tk ÷ 3 members = 300 tk each

2. **Custom Percentage Split**
   - Specify percentage for each member
   - Must total 100%
   - Example: Member A: 40%, Member B: 35%, Member C: 25%

3. **Exclude Members**
   - Some members not participating
   - Split only among included members
   - Example: 3 members, exclude 1 → split among 2

## Database Schema

### 1. MoneyCollection Model

```typescript
const MoneyCollectionSchema = new Schema({
  messId: { type: ObjectId, ref: 'Mess', required: true, index: true },
  memberId: { type: ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, default: 'Monthly contribution' },
  collectedBy: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
MoneyCollectionSchema.index({ messId: 1, date: -1 });
MoneyCollectionSchema.index({ messId: 1, memberId: 1 });
```

### 2. Updated Expense Model

```typescript
const ExpenseSchema = new Schema({
  messId: { type: ObjectId, ref: 'Mess', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['Groceries', 'Utilities', 'Rent', 'Gas', 'Internet', 'Cleaning', 'Other']
  },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  
  // Who paid from their pocket (needs reimbursement)
  paidBy: { type: ObjectId, ref: 'User', required: true },
  
  // Split configuration
  splitMethod: { 
    type: String, 
    enum: ['equal', 'custom', 'exclude'],
    default: 'equal'
  },
  splits: [{
    memberId: { type: ObjectId, ref: 'User' },
    percentage: { type: Number, min: 0, max: 100 }, // For custom split
    amount: { type: Number, min: 0 } // Calculated amount
  }],
  
  // Optional receipt
  receipt: { type: String },
  
  // Soft delete
  isDeleted: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
ExpenseSchema.index({ messId: 1, date: -1 });
ExpenseSchema.index({ messId: 1, paidBy: 1 });
ExpenseSchema.index({ messId: 1, category: 1 });
```

### 3. Updated Settlement Model

```typescript
const SettlementSchema = new Schema({
  messId: { type: ObjectId, ref: 'Mess', required: true, index: true },
  memberId: { type: ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  
  // Type of settlement
  type: { 
    type: String, 
    enum: ['contribution', 'refund'],
    required: true
  },
  // contribution: Member paying money to mess
  // refund: Mess returning money to member
  
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
  recordedBy: { type: ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
SettlementSchema.index({ messId: 1, date: -1 });
SettlementSchema.index({ messId: 1, memberId: 1 });
```

## Backend Services

### 1. MoneyCollectionService

```typescript
class MoneyCollectionService {
  // Record money collection
  async recordCollection(
    messId: string,
    memberId: string,
    amount: number,
    description: string,
    collectedBy: string
  ): Promise<MoneyCollection> {
    // Validate mess and member
    // Create collection record
    // Log activity
    // Return collection
  }

  // Get all collections for a mess
  async getCollections(
    messId: string,
    filters?: {
      memberId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<MoneyCollection>> {
    // Query with filters
    // Paginate results
    // Return collections
  }

  // Get total collected for a mess
  async getTotalCollected(
    messId: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<number> {
    // Sum all collections
    // Filter by period if provided
    // Return total
  }

  // Get member's total contributions
  async getMemberContributions(
    messId: string,
    memberId: string
  ): Promise<number> {
    // Sum member's collections
    // Return total
  }

  // Delete collection (Owner only)
  async deleteCollection(
    collectionId: string,
    userId: string
  ): Promise<void> {
    // Check authorization
    // Delete collection
    // Log activity
  }
}
```

### 2. Updated ExpenseService

```typescript
class ExpenseService {
  // Record expense with split calculation
  async recordExpense(
    messId: string,
    data: {
      amount: number;
      category: string;
      description: string;
      date: Date;
      paidBy: string;
      splitMethod: 'equal' | 'custom' | 'exclude';
      splits?: Array<{ memberId: string; percentage?: number }>;
    }
  ): Promise<Expense> {
    // Validate mess and members
    // Calculate splits based on method
    // Create expense record
    // Log activity
    // Return expense
  }

  // Calculate splits
  private calculateSplits(
    amount: number,
    members: string[],
    splitMethod: string,
    customSplits?: Array<{ memberId: string; percentage?: number }>
  ): Array<{ memberId: string; percentage: number; amount: number }> {
    if (splitMethod === 'equal') {
      const percentage = 100 / members.length;
      const amountPerMember = amount / members.length;
      return members.map(memberId => ({
        memberId,
        percentage,
        amount: amountPerMember
      }));
    }
    
    if (splitMethod === 'custom') {
      // Validate percentages total 100%
      const total = customSplits.reduce((sum, s) => sum + s.percentage, 0);
      if (total !== 100) throw new Error('Percentages must total 100%');
      
      return customSplits.map(split => ({
        memberId: split.memberId,
        percentage: split.percentage,
        amount: (amount * split.percentage) / 100
      }));
    }
    
    // For 'exclude', members array already filtered
    return this.calculateSplits(amount, members, 'equal');
  }

  // Get expenses with filters
  async getExpenses(
    messId: string,
    filters?: {
      category?: string;
      paidBy?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Expense>> {
    // Query with filters
    // Paginate results
    // Return expenses
  }

  // Get total expenses
  async getTotalExpenses(
    messId: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<number> {
    // Sum all expenses
    // Filter by period if provided
    // Return total
  }

  // Update expense
  async updateExpense(
    expenseId: string,
    userId: string,
    updates: Partial<Expense>
  ): Promise<Expense> {
    // Check authorization
    // Recalculate splits if amount changed
    // Update expense
    // Log activity
    // Return updated expense
  }

  // Delete expense (soft delete)
  async deleteExpense(
    expenseId: string,
    userId: string
  ): Promise<void> {
    // Check authorization
    // Soft delete expense
    // Log activity
  }
}
```

### 3. Updated BalanceService

```typescript
class BalanceService {
  // Calculate mess fund balance
  async getMessFundBalance(messId: string): Promise<number> {
    const totalCollected = await moneyCollectionService.getTotalCollected(messId);
    const totalExpenses = await expenseService.getTotalExpenses(messId);
    return totalCollected - totalExpenses;
  }

  // Calculate member balance
  async getMemberBalance(
    messId: string,
    memberId: string
  ): Promise<{
    contributed: number;
    fairShare: number;
    paidFromPocket: number;
    balance: number;
    status: 'owed' | 'owes' | 'settled';
  }> {
    // Get member's contributions
    const contributed = await moneyCollectionService.getMemberContributions(
      messId,
      memberId
    );

    // Get member's fair share of expenses
    const expenses = await expenseService.getExpenses(messId);
    let fairShare = 0;
    
    for (const expense of expenses.data) {
      const memberSplit = expense.splits.find(s => s.memberId === memberId);
      if (memberSplit) {
        fairShare += memberSplit.amount;
      }
    }

    // Get amount paid from pocket (needs reimbursement)
    const paidFromPocket = expenses.data
      .filter(e => e.paidBy === memberId)
      .reduce((sum, e) => sum + e.amount, 0);

    // Calculate balance
    const balance = contributed - fairShare + paidFromPocket;

    // Determine status
    let status: 'owed' | 'owes' | 'settled';
    if (balance > 1) status = 'owed'; // Mess owes member
    else if (balance < -1) status = 'owes'; // Member owes mess
    else status = 'settled';

    return {
      contributed,
      fairShare,
      paidFromPocket,
      balance,
      status
    };
  }

  // Get all member balances
  async getAllMemberBalances(
    messId: string
  ): Promise<Array<MemberBalance>> {
    const mess = await Mess.findById(messId);
    const balances = [];

    for (const member of mess.members) {
      const balance = await this.getMemberBalance(messId, member.userId);
      balances.push({
        userId: member.userId,
        userName: member.name,
        ...balance
      });
    }

    return balances;
  }

  // Get balance breakdown with transaction history
  async getBalanceBreakdown(
    messId: string,
    memberId: string
  ): Promise<{
    balance: MemberBalance;
    collections: MoneyCollection[];
    expenses: Expense[];
    settlements: Settlement[];
  }> {
    const balance = await this.getMemberBalance(messId, memberId);
    const collections = await moneyCollectionService.getCollections(messId, { memberId });
    const expenses = await expenseService.getExpenses(messId);
    const settlements = await settlementService.getSettlements(messId, { memberId });

    return {
      balance,
      collections: collections.data,
      expenses: expenses.data.filter(e => 
        e.paidBy === memberId || e.splits.some(s => s.memberId === memberId)
      ),
      settlements: settlements.data
    };
  }
}
```

### 4. Updated SettlementService

```typescript
class SettlementService {
  // Record contribution to mess
  async recordContribution(
    messId: string,
    memberId: string,
    amount: number,
    description: string,
    recordedBy: string
  ): Promise<Settlement> {
    // This is same as money collection
    // Just record it as settlement for history
    await moneyCollectionService.recordCollection(
      messId,
      memberId,
      amount,
      description,
      recordedBy
    );

    const settlement = await Settlement.create({
      messId,
      memberId,
      amount,
      type: 'contribution',
      description,
      recordedBy
    });

    return settlement;
  }

  // Record refund from mess
  async recordRefund(
    messId: string,
    memberId: string,
    amount: number,
    description: string,
    recordedBy: string
  ): Promise<Settlement> {
    // Check mess fund has enough balance
    const messFund = await balanceService.getMessFundBalance(messId);
    if (messFund < amount) {
      throw new Error('Insufficient mess fund balance');
    }

    const settlement = await Settlement.create({
      messId,
      memberId,
      amount,
      type: 'refund',
      description,
      recordedBy
    });

    // Log activity
    await activityLogService.logSettlementActivity(
      messId,
      recordedBy,
      'refund_recorded',
      settlement.id,
      { memberId, amount }
    );

    return settlement;
  }

  // Get settlement suggestions
  async getSettlementSuggestions(
    messId: string
  ): Promise<Array<{
    memberId: string;
    memberName: string;
    action: 'pay' | 'receive';
    amount: number;
  }>> {
    const balances = await balanceService.getAllMemberBalances(messId);

    return balances
      .filter(b => Math.abs(b.balance) > 1) // Ignore small amounts
      .map(b => ({
        memberId: b.userId,
        memberName: b.userName,
        action: b.balance > 0 ? 'receive' : 'pay',
        amount: Math.abs(b.balance)
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Get settlement history
  async getSettlements(
    messId: string,
    filters?: {
      memberId?: string;
      type?: 'contribution' | 'refund';
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<Settlement>> {
    // Query with filters
    // Paginate results
    // Return settlements
  }
}
```

## API Routes

### Money Collection Routes

```typescript
// POST /api/collections - Record money collection
router.post('/', authenticate, async (req, res) => {
  const { messId, memberId, amount, description } = req.body;
  const collection = await moneyCollectionService.recordCollection(
    messId,
    memberId,
    amount,
    description,
    req.user.userId
  );
  res.status(201).json({ success: true, data: collection });
});

// GET /api/collections - Get all collections
router.get('/', authenticate, async (req, res) => {
  const { messId, memberId, startDate, endDate, page, limit } = req.query;
  const collections = await moneyCollectionService.getCollections(messId, {
    memberId,
    startDate,
    endDate,
    page,
    limit
  });
  res.json({ success: true, data: collections });
});

// GET /api/collections/total - Get total collected
router.get('/total', authenticate, async (req, res) => {
  const { messId, startDate, endDate } = req.query;
  const total = await moneyCollectionService.getTotalCollected(messId, {
    startDate,
    endDate
  });
  res.json({ success: true, data: { total } });
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', authenticate, async (req, res) => {
  await moneyCollectionService.deleteCollection(req.params.id, req.user.userId);
  res.json({ success: true, message: 'Collection deleted' });
});
```

### Updated Expense Routes

```typescript
// POST /api/expenses - Record expense
router.post('/', authenticate, async (req, res) => {
  const expense = await expenseService.recordExpense(req.body.messId, {
    amount: req.body.amount,
    category: req.body.category,
    description: req.body.description,
    date: req.body.date,
    paidBy: req.body.paidBy,
    splitMethod: req.body.splitMethod,
    splits: req.body.splits
  });
  res.status(201).json({ success: true, data: expense });
});

// GET /api/expenses - Get expenses
router.get('/', authenticate, async (req, res) => {
  const expenses = await expenseService.getExpenses(req.query.messId, req.query);
  res.json({ success: true, data: expenses });
});

// GET /api/expenses/total - Get total expenses
router.get('/total', authenticate, async (req, res) => {
  const total = await expenseService.getTotalExpenses(req.query.messId, {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data: { total } });
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', authenticate, async (req, res) => {
  const expense = await expenseService.updateExpense(
    req.params.id,
    req.user.userId,
    req.body
  );
  res.json({ success: true, data: expense });
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authenticate, async (req, res) => {
  await expenseService.deleteExpense(req.params.id, req.user.userId);
  res.json({ success: true, message: 'Expense deleted' });
});
```

### Updated Balance Routes

```typescript
// GET /api/balances/mess-fund - Get mess fund balance
router.get('/mess-fund', authenticate, async (req, res) => {
  const balance = await balanceService.getMessFundBalance(req.query.messId);
  res.json({ success: true, data: { balance } });
});

// GET /api/balances/me - Get my balance
router.get('/me', authenticate, async (req, res) => {
  const balance = await balanceService.getMemberBalance(
    req.query.messId,
    req.user.userId
  );
  res.json({ success: true, data: balance });
});

// GET /api/balances/all - Get all member balances
router.get('/all', authenticate, async (req, res) => {
  const balances = await balanceService.getAllMemberBalances(req.query.messId);
  res.json({ success: true, data: balances });
});

// GET /api/balances/:memberId/breakdown - Get balance breakdown
router.get('/:memberId/breakdown', authenticate, async (req, res) => {
  const breakdown = await balanceService.getBalanceBreakdown(
    req.query.messId,
    req.params.memberId
  );
  res.json({ success: true, data: breakdown });
});
```

### Updated Settlement Routes

```typescript
// POST /api/settlements/contribution - Record contribution
router.post('/contribution', authenticate, async (req, res) => {
  const settlement = await settlementService.recordContribution(
    req.body.messId,
    req.body.memberId,
    req.body.amount,
    req.body.description,
    req.user.userId
  );
  res.status(201).json({ success: true, data: settlement });
});

// POST /api/settlements/refund - Record refund
router.post('/refund', authenticate, async (req, res) => {
  const settlement = await settlementService.recordRefund(
    req.body.messId,
    req.body.memberId,
    req.body.amount,
    req.body.description,
    req.user.userId
  );
  res.status(201).json({ success: true, data: settlement });
});

// GET /api/settlements/suggestions - Get settlement suggestions
router.get('/suggestions', authenticate, async (req, res) => {
  const suggestions = await settlementService.getSettlementSuggestions(
    req.query.messId
  );
  res.json({ success: true, data: suggestions });
});

// GET /api/settlements - Get settlement history
router.get('/', authenticate, async (req, res) => {
  const settlements = await settlementService.getSettlements(
    req.query.messId,
    req.query
  );
  res.json({ success: true, data: settlements });
});
```

## Frontend Components

### 1. Money Collection Page (`/collections`)

**Components:**
- `CollectionList` - Display all collections
- `RecordCollectionModal` - Form to record collection
- `CollectionSummary` - Total collected, by member
- `CollectionFilters` - Filter by date, member

### 2. Expense Tracker Page (`/expenses`)

**Components:**
- `ExpenseList` - Display all expenses
- `RecordExpenseModal` - Form with split configuration
- `ExpenseSummary` - Total expenses, by category
- `ExpenseFilters` - Filter by date, category, member

### 3. Settlement Page (`/settlements`)

**Components:**
- `MessFundBalance` - Show total fund balance
- `MemberBalanceList` - Show each member's balance
- `SettlementSuggestions` - Who needs to pay/receive
- `RecordSettlementModal` - Record contribution/refund
- `SettlementHistory` - Past settlements

### 4. Updated Dashboard

**Widgets:**
- `MessFundWidget` - Current fund balance
- `YourBalanceWidget` - User's balance
- `CollectionSummaryWidget` - This month's collections
- `ExpenseSummaryWidget` - This month's expenses
- `CategoryChartWidget` - Expense breakdown
- `RecentActivityWidget` - Latest transactions

## Implementation Steps

## Implementation Steps & Status

### Phase 1: Backend (DONE)
- [x] Create MoneyCollection model
- [x] Update Expense model
- [x] Update Settlement model
- [x] Implement MoneyCollectionService
- [x] Update ExpenseService
- [x] Update BalanceService
- [x] Update SettlementService
- [x] Create API routes
- [x] Test with Postman/curl

### Phase 2: Frontend (IN PROGRESS)
- [ ] Create Money Collection page
  - [ ] `CollectionList` component
  - [ ] `RecordCollectionModal` component
  - [ ] `CollectionSummary` component
  - [ ] `CollectionFilters` component
  - [ ] `CollectionsPage` (Route: /collections)
- [x] Update Expense Tracker page (Components & Page Created)
- [x] Update Settlement page (Components & Page Created)
- [x] Update Dashboard (Components & Page Created)
- [ ] Update navigation (Add Collections link)
- [ ] Test UI flows

### Phase 3: Testing & Polish (PENDING)
1. End-to-end testing (Testing Collections integration)
2. Fix bugs
3. Add loading states
4. Add error handling
5. Polish UI/UX

## Next Steps

The next immediate task is to implement the **Money Collection** feature on the frontend, as the backend is ready and other frontend modules (Expenses, Settlements) are already in place.

1.  **Create Collection Components**: Implement `CollectionList`, `RecordCollectionModal`, etc. in `frontend/src/components/collection`.
2.  **Create Collections Page**: Add `CollectionsPage.tsx` and register route in `App.tsx`.
3.  **Update Navigation**: Ensure the new page is accessible.

