# Design Document: MessMate - Mess Management System

## Overview

MessMate is a full-stack MERN application that enables shared household expense management with sophisticated split logic, role-based access control, and multi-mess support. The system follows a three-tier architecture with a React/TypeScript frontend, Express REST API backend, and MongoDB database.

### Key Design Decisions

1. **REST over GraphQL**: REST APIs provide simpler caching, better tooling support, and easier debugging for this CRUD-heavy application
2. **JWT with Refresh Tokens**: Balances security (short-lived access tokens) with user experience (refresh tokens prevent frequent re-authentication)
3. **Role-Based Access Control**: Three-tier role system (Owner/Admin/Member) provides flexibility while maintaining simplicity
4. **Settlement Simplification Algorithm**: Implements a greedy algorithm to minimize transaction count while maintaining mathematical correctness
5. **Soft Deletes**: Maintains audit trails and enables data recovery while appearing deleted to users
6. **MongoDB Document Design**: Uses a hybrid approach - embedded documents for tightly coupled data (expense splits), references for loosely coupled data (user-mess relationships)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React + TypeScript + Redux/Zustand                    │ │
│  │  - Authentication Flow                                 │ │
│  │  - Protected Routes                                    │ │
│  │  - Dashboard, Expense, Settlement, Member UIs          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express Middleware Stack                              │ │
│  │  - CORS, Helmet (Security Headers)                     │ │
│  │  - Rate Limiting                                       │ │
│  │  - Request Logging                                     │ │
│  │  - JWT Validation                                      │ │
│  │  - Error Handling                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers (Route Handlers)                          │ │
│  │  - Auth Controller                                     │ │
│  │  - Mess Controller                                     │ │
│  │  - Expense Controller                                  │ │
│  │  - Settlement Controller                               │ │
│  │  - Member Controller                                   │ │
│  │  - Dashboard Controller                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic Layer                                  │ │
│  │  - Expense Split Service                               │ │
│  │  - Balance Calculation Service                         │ │
│  │  - Settlement Simplification Service                   │ │
│  │  - Authorization Service                               │ │
│  │  - Activity Logging Service                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Mongoose Models & Repositories                        │ │
│  │  - User Model                                          │ │
│  │  - Mess Model                                          │ │
│  │  - Expense Model                                       │ │
│  │  - Settlement Model                                    │ │
│  │  - ActivityLog Model                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MongoDB                                               │ │
│  │  - Collections: users, messes, expenses, settlements,  │ │
│  │    activityLogs                                        │ │
│  │  - Indexes for performance optimization                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- State Management: Zustand (lightweight, simpler than Redux for this use case)
- Routing: React Router v6
- HTTP Client: Axios with interceptors for token refresh
- UI Components: Custom components with Tailwind CSS
- Form Handling: React Hook Form with Zod validation

**Backend:**
- Node.js 18+ LTS
- Express 4.x
- Mongoose 7.x for MongoDB ODM
- JWT: jsonwebtoken library
- Password Hashing: bcrypt
- Validation: express-validator
- Security: helmet, cors, express-rate-limit

**Database:**
- MongoDB 6.x
- Indexes on frequently queried fields
- Compound indexes for complex queries

## Components and Interfaces

### Backend Components

#### 1. Authentication Service

**Responsibilities:**
- User registration with password hashing (bcrypt, cost factor 10)
- User login with JWT generation (access token: 15min, refresh token: 7 days)
- Token refresh mechanism
- Token revocation
- Rate limiting for failed login attempts

**Interface:**
```typescript
interface AuthService {
  register(userData: RegisterDTO): Promise<UserResponse>;
  login(credentials: LoginDTO): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  logout(userId: string, refreshToken: string): Promise<void>;
  revokeAllTokens(userId: string): Promise<void>;
}

interface RegisterDTO {
  name: string;
  email: string;
  password: string; // Min 8 chars, 1 upper, 1 lower, 1 number
}

interface LoginDTO {
  email: string;
  password: string;
}

interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
```

#### 2. Mess Service

**Responsibilities:**
- Mess creation with unique invite codes
- Mess settings management
- Member limit enforcement (6-20)
- Invite link generation with expiration
- Multi-mess support per user

**Interface:**
```typescript
interface MessService {
  createMess(ownerId: string, messData: CreateMessDTO): Promise<MessResponse>;
  updateMess(messId: string, userId: string, updates: UpdateMessDTO): Promise<MessResponse>;
  getMess(messId: string, userId: string): Promise<MessResponse>;
  getUserMesses(userId: string): Promise<MessResponse[]>;
  generateInviteLink(messId: string, ownerId: string, expiresInHours: number): Promise<InviteLinkResponse>;
  joinMessByCode(userId: string, inviteCode: string): Promise<MessResponse>;
  joinMessByLink(userId: string, inviteLinkToken: string): Promise<MessResponse>;
  removeMember(messId: string, ownerId: string, memberId: string): Promise<void>;
}

interface CreateMessDTO {
  name: string;
  memberLimit: number; // 6-20
  description?: string;
}

interface UpdateMessDTO {
  name?: string;
  memberLimit?: number;
  description?: string;
}

interface MessResponse {
  id: string;
  name: string;
  memberLimit: number;
  description?: string;
  inviteCode: string;
  members: MemberInfo[];
  createdAt: Date;
  updatedAt: Date;
}

interface MemberInfo {
  userId: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
  joinedAt: Date;
}

interface InviteLinkResponse {
  inviteLink: string;
  expiresAt: Date;
}
```

#### 3. Expense Service

**Responsibilities:**
- Expense CRUD operations
- Split calculation (equal, unequal, percentage)
- Member exclusion handling
- Balance updates on expense changes
- Category management

**Interface:**
```typescript
interface ExpenseService {
  createExpense(messId: string, userId: string, expenseData: CreateExpenseDTO): Promise<ExpenseResponse>;
  updateExpense(expenseId: string, userId: string, updates: UpdateExpenseDTO): Promise<ExpenseResponse>;
  deleteExpense(expenseId: string, userId: string): Promise<void>;
  getExpense(expenseId: string, userId: string): Promise<ExpenseResponse>;
  getExpenses(messId: string, userId: string, filters: ExpenseFilters): Promise<PaginatedResponse<ExpenseResponse>>;
}

interface CreateExpenseDTO {
  messId: string;
  amount: number; // Positive number
  description: string;
  category: 'Groceries' | 'Utilities' | 'Rent' | 'Food' | 'Entertainment' | 'Other';
  date: Date;
  paidBy: string; // userId
  splitMethod: 'equal' | 'unequal' | 'percentage';
  splits: ExpenseSplit[];
  excludedMembers?: string[]; // userIds
}

interface UpdateExpenseDTO {
  amount?: number;
  description?: string;
  category?: string;
  date?: Date;
  paidBy?: string;
  splitMethod?: 'equal' | 'unequal' | 'percentage';
  splits?: ExpenseSplit[];
  excludedMembers?: string[];
}

interface ExpenseSplit {
  userId: string;
  amount?: number; // For unequal split
  percentage?: number; // For percentage split
}

interface ExpenseResponse {
  id: string;
  messId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  paidBy: UserBasicInfo;
  splitMethod: string;
  splits: SplitInfo[];
  createdBy: UserBasicInfo;
  createdAt: Date;
  updatedAt: Date;
}

interface SplitInfo {
  user: UserBasicInfo;
  amount: number;
  percentage?: number;
}

interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

interface ExpenseFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  memberId?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

#### 4. Balance Service

**Responsibilities:**
- Real-time balance calculation
- Balance accuracy (2 decimal places)
- Transaction breakdown generation
- Balance sign interpretation (positive = owed, negative = owes)

**Interface:**
```typescript
interface BalanceService {
  calculateMemberBalance(messId: string, userId: string): Promise<BalanceResponse>;
  getAllBalances(messId: string): Promise<BalanceResponse[]>;
  getBalanceBreakdown(messId: string, userId: string): Promise<BalanceBreakdown>;
}

interface BalanceResponse {
  userId: string;
  userName: string;
  balance: number; // Positive = owed, Negative = owes, rounded to 2 decimals
  status: 'owed' | 'owes' | 'settled';
}

interface BalanceBreakdown {
  userId: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  transactions: TransactionInfo[];
}

interface TransactionInfo {
  type: 'expense' | 'settlement';
  id: string;
  description: string;
  amount: number;
  date: Date;
}
```

#### 5. Settlement Service

**Responsibilities:**
- Settlement recording with validation
- Settlement simplification algorithm
- Immutable settlement records
- Balance updates on settlement

**Interface:**
```typescript
interface SettlementService {
  recordSettlement(messId: string, settlementData: CreateSettlementDTO): Promise<SettlementResponse>;
  getSettlements(messId: string, userId: string, filters: SettlementFilters): Promise<PaginatedResponse<SettlementResponse>>;
  getSettlementSuggestions(messId: string): Promise<SettlementSuggestion[]>;
}

interface CreateSettlementDTO {
  messId: string;
  fromUserId: string;
  toUserId: string;
  amount: number; // Must not exceed outstanding balance
  description?: string;
}

interface SettlementResponse {
  id: string;
  messId: string;
  fromUser: UserBasicInfo;
  toUser: UserBasicInfo;
  amount: number;
  description?: string;
  createdAt: Date;
}

interface SettlementFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  userId?: string; // Filter settlements involving this user
}

interface SettlementSuggestion {
  fromUser: UserBasicInfo;
  toUser: UserBasicInfo;
  amount: number;
}
```

#### 6. Authorization Service

**Responsibilities:**
- Role-based permission checking
- Ownership verification
- Resource access control

**Interface:**
```typescript
interface AuthorizationService {
  canManageMess(userId: string, messId: string): Promise<boolean>; // Owner only
  canManageExpenses(userId: string, messId: string): Promise<boolean>; // Owner or Admin
  canEditExpense(userId: string, expenseId: string): Promise<boolean>; // Owner, Admin, or creator
  canViewAllBalances(userId: string, messId: string): Promise<boolean>; // Owner or Admin
  canViewSettlements(userId: string, messId: string, settlementId?: string): Promise<boolean>;
  canAssignRoles(userId: string, messId: string): Promise<boolean>; // Owner only
  getUserRole(userId: string, messId: string): Promise<'Owner' | 'Admin' | 'Member'>;
}
```

#### 7. Activity Log Service

**Responsibilities:**
- Comprehensive activity logging
- Log retention (90 days minimum)
- Role-based log access

**Interface:**
```typescript
interface ActivityLogService {
  logExpenseActivity(messId: string, userId: string, action: 'created' | 'updated' | 'deleted', expenseId: string, details: any): Promise<void>;
  logSettlementActivity(messId: string, userId: string, settlementId: string, details: any): Promise<void>;
  logMemberActivity(messId: string, action: 'joined' | 'left' | 'role_changed', userId: string, details: any): Promise<void>;
  getActivityLogs(messId: string, userId: string, filters: ActivityFilters): Promise<PaginatedResponse<ActivityLogResponse>>;
}

interface ActivityFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  activityType?: 'expense' | 'settlement' | 'member';
}

interface ActivityLogResponse {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  action: string;
  activityType: string;
  details: any;
  timestamp: Date;
}
```

#### 8. Dashboard Service

**Responsibilities:**
- Aggregate expense data
- Category-wise breakdown
- Recent transactions
- Role-based analytics

**Interface:**
```typescript
interface DashboardService {
  getDashboardData(messId: string, userId: string): Promise<DashboardResponse>;
}

interface DashboardResponse {
  currentMonthTotal: number;
  userBalance: number;
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: TransactionInfo[];
  memberAnalytics?: MemberAnalytics[]; // Only for Owner/Admin
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface MemberAnalytics {
  userId: string;
  userName: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
}
```

### Frontend Components

#### 1. Authentication Components

**Components:**
- `LoginForm`: Email/password login with validation
- `RegisterForm`: User registration with password strength indicator
- `ProtectedRoute`: HOC for route protection with role checking
- `AuthContext`: Context provider for auth state management

#### 2. Mess Management Components

**Components:**
- `MessList`: Display all messes user belongs to
- `CreateMessModal`: Form for creating new mess
- `MessSettings`: Mess configuration and member management
- `InviteModal`: Generate and display invite links/codes
- `JoinMessModal`: Join mess via code or link

#### 3. Expense Management Components

**Components:**
- `ExpenseList`: Paginated, filterable expense list
- `CreateExpenseModal`: Multi-step form for expense creation with split configuration
- `ExpenseDetail`: Detailed view with split breakdown
- `ExpenseFilters`: Filter panel for date, category, member
- `SplitCalculator`: Interactive split configuration (equal/unequal/percentage)

#### 4. Balance & Settlement Components

**Components:**
- `BalanceCard`: Display user's current balance with status indicator
- `BalanceSummary`: All member balances (Owner/Admin only)
- `SettlementModal`: Record settlement payment
- `SettlementSuggestions`: Display optimized settlement suggestions
- `SettlementHistory`: List of past settlements

#### 5. Dashboard Components

**Components:**
- `Dashboard`: Main dashboard layout
- `ExpenseSummaryCard`: Current month total and trends
- `CategoryChart`: Pie/bar chart for category breakdown
- `RecentTransactions`: List of last 10 transactions
- `MemberAnalyticsTable`: Member-wise analytics (Owner/Admin only)

#### 6. Shared Components

**Components:**
- `Navbar`: Navigation with mess switcher
- `Sidebar`: Main navigation menu
- `LoadingSpinner`: Loading state indicator
- `ErrorBoundary`: Error handling wrapper
- `Toast`: Notification system
- `ConfirmDialog`: Confirmation modal for destructive actions

## Data Models

### User Model

```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string; // Unique, indexed
  password: string; // Bcrypt hashed
  createdAt: Date;
  updatedAt: Date;
  refreshTokens: RefreshToken[]; // Embedded
}

interface RefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Indexes
// - email: unique index
// - refreshTokens.token: index for token lookup
```

### Mess Model

```typescript
interface Mess {
  _id: ObjectId;
  name: string;
  description?: string;
  memberLimit: number; // 6-20
  inviteCode: string; // Unique, indexed, 8-char alphanumeric
  members: MessMember[]; // Embedded
  createdAt: Date;
  updatedAt: Date;
}

interface MessMember {
  userId: ObjectId; // Reference to User
  role: 'Owner' | 'Admin' | 'Member';
  joinedAt: Date;
}

// Indexes
// - inviteCode: unique index
// - members.userId: index for member lookup
```

### Expense Model

```typescript
interface Expense {
  _id: ObjectId;
  messId: ObjectId; // Reference to Mess
  amount: number; // Positive, 2 decimal places
  description: string;
  category: 'Groceries' | 'Utilities' | 'Rent' | 'Food' | 'Entertainment' | 'Other';
  date: Date; // Indexed
  paidBy: ObjectId; // Reference to User
  splitMethod: 'equal' | 'unequal' | 'percentage';
  splits: ExpenseSplitDetail[]; // Embedded
  createdBy: ObjectId; // Reference to User
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean; // Soft delete flag
  deletedAt?: Date;
}

interface ExpenseSplitDetail {
  userId: ObjectId; // Reference to User
  amount: number; // Calculated share
  percentage?: number; // For percentage split
}

// Indexes
// - messId: index
// - date: index
// - compound: (messId, date) for filtered queries
// - compound: (messId, paidBy) for user expense queries
// - isDeleted: index for soft delete queries
```

### Settlement Model

```typescript
interface Settlement {
  _id: ObjectId;
  messId: ObjectId; // Reference to Mess
  fromUserId: ObjectId; // Reference to User (payer)
  toUserId: ObjectId; // Reference to User (payee)
  amount: number; // Positive, 2 decimal places
  description?: string;
  createdAt: Date; // Immutable after creation
  isDeleted: boolean; // Soft delete flag
  deletedAt?: Date;
}

// Indexes
// - messId: index
// - compound: (messId, fromUserId) for user settlement queries
// - compound: (messId, toUserId) for user settlement queries
// - createdAt: index for date-based queries
// - isDeleted: index for soft delete queries
```

### ActivityLog Model

```typescript
interface ActivityLog {
  _id: ObjectId;
  messId: ObjectId; // Reference to Mess
  userId: ObjectId; // Reference to User who performed action
  action: string; // 'created', 'updated', 'deleted', 'joined', 'left', 'role_changed'
  activityType: 'expense' | 'settlement' | 'member';
  resourceId?: ObjectId; // Reference to related resource (expense, settlement, etc.)
  details: any; // JSON object with activity-specific details
  timestamp: Date;
  expiresAt: Date; // TTL index for automatic deletion after 90 days
}

// Indexes
// - messId: index
// - compound: (messId, timestamp) for chronological queries
// - expiresAt: TTL index (90 days retention)
```

### InviteLink Model

```typescript
interface InviteLink {
  _id: ObjectId;
  messId: ObjectId; // Reference to Mess
  token: string; // Unique, indexed, JWT-like token
  createdBy: ObjectId; // Reference to User
  expiresAt: Date;
  createdAt: Date;
}

// Indexes
// - token: unique index
// - expiresAt: TTL index for automatic cleanup
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication & Security Properties

**Property 1: Password Hashing Integrity**
*For any* user registration with a valid password, the stored password hash should be verifiable with bcrypt and should not match the plain text password.
**Validates: Requirements 1.1, 13.1**

**Property 2: JWT Token Generation**
*For any* successful login with valid credentials, the system should generate both an access token and refresh token with correct expiration times (access: 15min, refresh: 7 days).
**Validates: Requirements 1.2**

**Property 3: Token Refresh Round Trip**
*For any* valid refresh token, using it to refresh should produce a new valid access token that can authenticate requests.
**Validates: Requirements 1.3**

**Property 4: Invalid Credentials Rejection**
*For any* login attempt with invalid credentials (wrong password or non-existent email), the system should reject with appropriate error and not generate tokens.
**Validates: Requirements 1.4**

**Property 5: Token Invalidation on Logout**
*For any* user session, after logout, the refresh token should be removed and subsequent refresh attempts with that token should fail.
**Validates: Requirements 1.5**

**Property 6: Password Validation**
*For any* password that doesn't meet requirements (< 8 chars, no uppercase, no lowercase, or no number), registration should be rejected.
**Validates: Requirements 1.6**

**Property 7: Rate Limiting Protection**
*For any* IP address making more than 100 requests in 15 minutes, subsequent requests should be blocked with 429 status.
**Validates: Requirements 13.2**

### Mess Management Properties

**Property 8: Mess Creation with Owner Assignment**
*For any* valid mess creation request, the system should create the mess, assign the creator as Owner, and generate a unique invite code.
**Validates: Requirements 2.1, 2.3**

**Property 9: Member Limit Enforcement**
*For any* mess creation or update with member limit outside 6-20 range, the operation should be rejected.
**Validates: Requirements 2.2, 11.8**

**Property 10: Mess Update Persistence**
*For any* mess update by an Owner, the changes should be immediately retrievable in subsequent queries.
**Validates: Requirements 2.4**

**Property 11: Multi-Mess Membership**
*For any* user, creating or joining multiple messes should result in the user being a member of all those messes with independent roles.
**Validates: Requirements 2.6, 10.5**

**Property 12: Invite Code Uniqueness**
*For any* two different messes, their invite codes should be unique.
**Validates: Requirements 2.3**

**Property 13: Member Limit Boundary**
*For any* mess at maximum capacity, attempts to add new members should be rejected.
**Validates: Requirements 3.4**

**Property 14: Default Role Assignment**
*For any* user joining a mess (not creating it), they should be assigned the Member role by default.
**Validates: Requirements 3.5**

**Property 15: Duplicate Membership Prevention**
*For any* user already in a mess, attempting to join the same mess again should be rejected.
**Validates: Requirements 3.6**

### Authorization Properties

**Property 16: Role-Based Authorization**
*For any* operation requiring specific role permissions (Owner for mess deletion, Admin for expense management, Member for viewing own balance), the system should allow access only to users with appropriate roles and reject others with 403 status.
**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 5.8, 5.9, 7.7, 7.8, 8.5, 8.6, 9.5, 9.6**

**Property 17: Single Owner Invariant**
*For any* mess at any point in time, there should be exactly one member with Owner role.
**Validates: Requirements 4.7**

### Expense Management Properties

**Property 18: Expense Creation and Balance Update**
*For any* valid expense creation, the expense should be recorded and all involved members' balances should be updated immediately according to their split amounts.
**Validates: Requirements 5.1, 5.10, 6.1**

**Property 19: Equal Split Calculation**
*For any* expense with equal split method and N non-excluded members, each member's share should be (total amount / N) rounded to 2 decimal places.
**Validates: Requirements 5.4**

**Property 20: Unequal Split Validation**
*For any* expense with unequal split, the sum of all custom amounts should equal the total expense amount.
**Validates: Requirements 5.5**

**Property 21: Percentage Split Validation**
*For any* expense with percentage split, the sum of all percentages should equal 100%, and each member's amount should be (total × percentage / 100) rounded to 2 decimals.
**Validates: Requirements 5.6**

**Property 22: Member Exclusion**
*For any* expense with excluded members, those members should have zero share amount and their balances should not be affected.
**Validates: Requirements 5.7**

**Property 23: Expense Modification Balance Recalculation**
*For any* expense modification or deletion, all affected member balances should be recalculated to reflect the change.
**Validates: Requirements 5.10**

**Property 24: Positive Amount Validation**
*For any* expense creation or update, amounts must be positive numbers, otherwise the operation should be rejected.
**Validates: Requirements 11.7**

### Balance Calculation Properties

**Property 25: Balance Calculation Formula**
*For any* member in a mess, their balance should equal (total amount they paid) - (total of their shares in all expenses) - (settlements they made) + (settlements they received), rounded to 2 decimal places.
**Validates: Requirements 6.1, 6.2, 6.5**

**Property 26: Balance Sign Interpretation**
*For any* member balance, positive values should indicate money owed to them, negative values should indicate money they owe, and zero should indicate settled status.
**Validates: Requirements 6.3, 6.4, 6.6**

### Settlement Properties

**Property 27: Settlement Balance Update**
*For any* settlement recording, both payer and payee balances should be updated immediately (payer balance increases, payee balance decreases by settlement amount).
**Validates: Requirements 7.1**

**Property 28: Settlement Amount Validation**
*For any* settlement attempt where the amount exceeds the payer's outstanding debt to the payee, the operation should be rejected.
**Validates: Requirements 7.2**

**Property 29: Settlement Immutability**
*For any* settlement record, after creation it should not be modifiable (only soft-deletable for corrections).
**Validates: Requirements 7.3**

**Property 30: Settlement Simplification Correctness**
*For any* set of member balances, the simplified settlement suggestions should, when executed, result in all balances becoming zero, and the total amount transferred should equal the sum of all positive balances (or absolute value of all negative balances).
**Validates: Requirements 7.4, 7.5, 7.6**

### Data Isolation Properties

**Property 31: Mess Data Isolation**
*For any* two different messes, expenses, settlements, and balances from one mess should never appear in queries for the other mess.
**Validates: Requirements 10.3, 10.4**

### Activity Logging Properties

**Property 32: Comprehensive Activity Logging**
*For any* expense creation/modification/deletion, settlement recording, member join/leave, or role change, an activity log entry should be created with timestamp, user, and action details.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Input Validation Properties

**Property 33: Required Field Validation**
*For any* API request missing required fields, the system should reject with 400 status and descriptive error message.
**Validates: Requirements 11.1, 11.2**

**Property 34: Data Type Validation**
*For any* API request with fields not matching expected types (invalid email format, non-numeric amounts, invalid dates), the system should reject with 400 status.
**Validates: Requirements 11.3**

**Property 35: Input Sanitization**
*For any* user input containing potentially malicious content (SQL injection, XSS attempts), the system should sanitize the input before processing.
**Validates: Requirements 11.4**

### Pagination Properties

**Property 36: Pagination Correctness**
*For any* paginated list request, the returned items should match the requested page and limit, and pagination metadata should accurately reflect total count and page numbers.
**Validates: Requirements 12.1, 12.4**

**Property 37: Pagination Limit Enforcement**
*For any* page size request exceeding 100, the system should cap it at 100 items.
**Validates: Requirements 12.5**

**Property 38: Filter and Sort Correctness**
*For any* expense list request with filters (date range, category, member) and sorting, all returned items should match the filter criteria and be ordered according to the sort specification.
**Validates: Requirements 12.2, 12.3**

### Dashboard Properties

**Property 39: Dashboard Data Accuracy**
*For any* dashboard request, the current month total should equal the sum of all expenses in the current month, the user balance should match the calculated balance, and category breakdown should sum to the total expenses.
**Validates: Requirements 8.1, 8.2, 8.3**

**Property 40: Recent Transactions Limit**
*For any* dashboard request, the recent transactions list should contain at most the last 10 transactions ordered by date descending.
**Validates: Requirements 8.4**

## Error Handling

### Error Categories

1. **Validation Errors (400 Bad Request)**
   - Missing required fields
   - Invalid data types or formats
   - Business rule violations (e.g., negative amounts, invalid member limits)

2. **Authentication Errors (401 Unauthorized)**
   - Missing or invalid JWT token
   - Expired access token without valid refresh token
   - Invalid credentials

3. **Authorization Errors (403 Forbidden)**
   - Insufficient permissions for requested operation
   - Attempting to access resources from different mess

4. **Not Found Errors (404 Not Found)**
   - Requested resource doesn't exist
   - Invalid IDs

5. **Conflict Errors (409 Conflict)**
   - Duplicate email registration
   - Duplicate mess membership
   - Mess at capacity

6. **Rate Limit Errors (429 Too Many Requests)**
   - Exceeded rate limit threshold

7. **Server Errors (500 Internal Server Error)**
   - Unexpected errors
   - Database connection failures

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable error message
    details?: any; // Additional error details (validation errors, etc.)
    timestamp: Date;
    path: string; // Request path
  };
}
```

### Centralized Error Handling

All errors will be caught by Express error handling middleware that:
1. Logs error details (stack trace, request info) to logging service
2. Determines appropriate HTTP status code
3. Formats error response consistently
4. Sanitizes error messages (no sensitive data in production)
5. Returns JSON error response

## Testing Strategy

### Dual Testing Approach

The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- Both approaches are complementary and necessary for comprehensive correctness validation

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with format: **Feature: mess-management-system, Property {number}: {property_text}**
- Each correctness property implemented by a single property-based test

**Test Organization**:
```
backend/tests/
├── properties/
│   ├── auth.properties.test.ts
│   ├── mess.properties.test.ts
│   ├── expense.properties.test.ts
│   ├── balance.properties.test.ts
│   ├── settlement.properties.test.ts
│   ├── authorization.properties.test.ts
│   └── validation.properties.test.ts
```

**Example Property Test**:
```typescript
// Feature: mess-management-system, Property 19: Equal Split Calculation
describe('Expense Split Properties', () => {
  it('should divide expenses equally among non-excluded members', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0.01, max: 10000 }), // expense amount
        fc.integer({ min: 2, max: 20 }), // number of members
        async (amount, memberCount) => {
          const expectedShare = Math.round((amount / memberCount) * 100) / 100;
          const expense = await createExpenseWithEqualSplit(amount, memberCount);
          
          expense.splits.forEach(split => {
            expect(split.amount).toBeCloseTo(expectedShare, 2);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Jest with Supertest for API testing

**Coverage Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, maximum limits)
- Error conditions (invalid inputs, unauthorized access)
- Integration points between components

**Test Organization**:
```
backend/tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── mess.service.test.ts
│   │   ├── expense.service.test.ts
│   │   ├── balance.service.test.ts
│   │   └── settlement.service.test.ts
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   ├── mess.controller.test.ts
│   │   └── expense.controller.test.ts
│   └── utils/
│       ├── validation.test.ts
│       └── settlement-algorithm.test.ts
├── integration/
│   ├── auth.integration.test.ts
│   ├── expense-flow.integration.test.ts
│   └── settlement-flow.integration.test.ts
```

### Frontend Testing

**Framework**: React Testing Library + Vitest

**Coverage Areas**:
- Component rendering with various props
- User interactions (clicks, form submissions)
- State management (Zustand store)
- API integration (mocked with MSW)
- Protected route behavior

**Test Organization**:
```
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── LoginForm.test.tsx
│   │   ├── ExpenseList.test.tsx
│   │   └── BalanceCard.test.tsx
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts
│   │   └── useExpenses.test.ts
└── store/
    └── __tests__/
        └── authStore.test.ts
```

### Test Data Generation

**Approach**: Use factories and fixtures for consistent test data

```typescript
// Test data factories
const userFactory = (overrides?: Partial<User>) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: 'Test123!',
  ...overrides
});

const messFactory = (overrides?: Partial<Mess>) => ({
  name: faker.company.name(),
  memberLimit: faker.number.int({ min: 6, max: 20 }),
  ...overrides
});
```

### Continuous Integration

- Run all tests on every pull request
- Enforce minimum 80% code coverage
- Run property tests with increased iterations (500) in CI
- Fail build on any test failure

## Settlement Simplification Algorithm

### Algorithm Design

The settlement simplification uses a greedy algorithm to minimize the number of transactions:

1. Calculate net balance for each member
2. Separate members into creditors (positive balance) and debtors (negative balance)
3. Sort creditors by balance descending, debtors by absolute balance descending
4. Match largest creditor with largest debtor
5. Transfer minimum of (creditor balance, debtor absolute balance)
6. Remove settled members from lists
7. Repeat until all balances are zero

### Algorithm Complexity

- Time Complexity: O(n log n) due to sorting
- Space Complexity: O(n) for storing balances

### Implementation

```typescript
interface Balance {
  userId: string;
  amount: number;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

function simplifySettlements(balances: Balance[]): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Separate creditors and debtors
  const creditors = balances
    .filter(b => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount);
  
  const debtors = balances
    .filter(b => b.amount < -0.01)
    .map(b => ({ userId: b.userId, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);
  
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const transferAmount = Math.min(creditor.amount, debtor.amount);
    
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(transferAmount * 100) / 100
    });
    
    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;
    
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }
  
  return transactions;
}
```

### Algorithm Correctness Property

The algorithm must satisfy:
1. Sum of all transaction amounts equals sum of all positive balances
2. After applying all transactions, all balances become zero
3. Number of transactions ≤ (number of members - 1)

## Security Implementation

### Password Security

- **Hashing**: bcrypt with cost factor 10
- **Validation**: Minimum 8 characters, at least one uppercase, lowercase, and number
- **Storage**: Never store plain text passwords

### JWT Security

- **Access Token**: Short-lived (15 minutes), contains user ID and email
- **Refresh Token**: Longer-lived (7 days), stored in database, rotated on use
- **Signing**: HS256 algorithm with strong secret (min 256 bits)
- **Validation**: Verify signature, expiration, and token structure on every protected route

### API Security

- **Rate Limiting**: 100 requests per 15 minutes per IP using express-rate-limit
- **CORS**: Whitelist only frontend origin(s)
- **Helmet**: Set security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Input Sanitization**: Use express-validator to sanitize all inputs
- **SQL/NoSQL Injection Prevention**: Use Mongoose parameterized queries
- **XSS Prevention**: Sanitize HTML content, use Content Security Policy

### HTTPS

- All production traffic over HTTPS
- Redirect HTTP to HTTPS
- Use HSTS header to enforce HTTPS

### Environment Variables

- Store all secrets in environment variables
- Never commit .env files to version control
- Use different secrets for dev/staging/production

## Deployment Architecture

### Backend Deployment

**Platform**: Node.js server (can be deployed to AWS EC2, Heroku, DigitalOcean, etc.)

**Configuration**:
- Environment-based config (development, staging, production)
- Health check endpoint: `GET /health`
- Graceful shutdown handling (SIGTERM, SIGINT)
- Process manager: PM2 for production

**Environment Variables**:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://...
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Deployment

**Platform**: Static hosting (Vercel, Netlify, AWS S3 + CloudFront)

**Build Process**:
- TypeScript compilation
- Asset optimization (minification, tree-shaking)
- Code splitting for lazy loading
- Environment-specific API URLs

**Environment Variables**:
```
VITE_API_URL=https://api.messmate.com
VITE_ENV=production
```

### Database Deployment

**Platform**: MongoDB Atlas (managed) or self-hosted MongoDB

**Configuration**:
- Replica set for high availability
- Automated backups (daily)
- Connection pooling
- Indexes created via migration scripts

### CI/CD Pipeline

1. **Code Push** → GitHub/GitLab
2. **Run Tests** → Jest, fast-check property tests
3. **Build** → TypeScript compilation, frontend build
4. **Deploy Backend** → PM2 restart on server
5. **Deploy Frontend** → Upload to static hosting
6. **Health Check** → Verify deployment success

### Monitoring

- **Application Logs**: Winston logger writing to files/cloud service
- **Error Tracking**: Sentry or similar for error monitoring
- **Performance Monitoring**: Response time tracking
- **Health Checks**: Automated endpoint monitoring

## Folder Structure

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Mess.ts
│   │   ├── Expense.ts
│   │   ├── Settlement.ts
│   │   ├── ActivityLog.ts
│   │   └── InviteLink.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── mess.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── settlement.controller.ts
│   │   ├── member.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── mess.service.ts
│   │   ├── expense.service.ts
│   │   ├── balance.service.ts
│   │   ├── settlement.service.ts
│   │   ├── authorization.service.ts
│   │   └── activityLog.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── logger.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── mess.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── settlement.routes.ts
│   │   ├── member.routes.ts
│   │   └── dashboard.routes.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── settlement-algorithm.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── index.ts
│   └── app.ts
├── tests/
│   ├── properties/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── mess/
│   │   │   ├── MessList.tsx
│   │   │   ├── CreateMessModal.tsx
│   │   │   ├── MessSettings.tsx
│   │   │   └── InviteModal.tsx
│   │   ├── expense/
│   │   │   ├── ExpenseList.tsx
│   │   │   ├── CreateExpenseModal.tsx
│   │   │   ├── ExpenseDetail.tsx
│   │   │   └── SplitCalculator.tsx
│   │   ├── settlement/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── SettlementModal.tsx
│   │   │   └── SettlementSuggestions.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ExpenseSummaryCard.tsx
│   │   │   └── CategoryChart.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useExpenses.ts
│   │   ├── useBalances.ts
│   │   └── useSettlements.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── messStore.ts
│   │   └── uiStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── mess.service.ts
│   │   ├── expense.service.ts
│   │   └── settlement.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This design provides a comprehensive blueprint for building the MessMate system with clear separation of concerns, robust security, and testable architecture.
