# Implementation Plan: MessMate - Mess Management System

## Overview

This implementation plan breaks down the MessMate system into discrete, incremental coding tasks. Each task builds on previous work, starting with foundational infrastructure and progressing through backend services, frontend components, and finally integration. The plan emphasizes early validation through testing and includes checkpoints for user feedback.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - Initialize backend Node.js/TypeScript project with Express
  - Initialize frontend React/TypeScript project with Vite
  - Configure MongoDB connection with Mongoose
  - Set up environment configuration for development/production
  - Configure ESLint, Prettier for code quality
  - Set up testing frameworks (Jest for backend, Vitest for frontend, fast-check for property tests)
  - Create basic folder structure as per design document
  - _Requirements: 15.1, 15.2_

- [ ]* 1.1 Write property test for environment configuration
  - **Property 1: Environment Variable Loading**
  - **Validates: Requirements 15.1**

- [x] 2. Database Models and Schemas
  - [x] 2.1 Create User model with Mongoose schema
    - Define User schema with name, email, password, refreshTokens
    - Add email unique index
    - Add password hashing pre-save hook using bcrypt (cost factor 10)
    - Add methods for password comparison and token management
    - _Requirements: 1.1, 13.1, 14.2, 14.4_

  - [ ]* 2.2 Write property test for User model
    - **Property 1: Password Hashing Integrity**
    - **Validates: Requirements 1.1, 13.1**

  - [x] 2.3 Create Mess model with Mongoose schema
    - Define Mess schema with name, memberLimit, inviteCode, members array
    - Add inviteCode unique index
    - Add members.userId index
    - Add validation for memberLimit (6-20 range)
    - Add method to generate unique invite codes 

  - [ ]* 2.4 Write property tests for Mess model
    - **Property 9: Member Limit Enforcement**
    - **Property 12: Invite Code Uniqueness**
    - **Validates: Requirements 2.2, 2.3, 11.8**

  - [x] 2.5 Create Expense model with Mongoose schema
    - Define Expense schema with amount, description, category, date, paidBy, splitMethod, splits
    - Add indexes: messId, date, compound (messId, date), compound (messId, paidBy)
    - Add isDeleted field for soft deletes
    - Add validation for positive amounts and valid categories
    - _Requirements: 5.1, 5.2, 11.7, 14.2, 14.4, 14.7_

  - [ ]* 2.6 Write property test for Expense model
    - **Property 24: Positive Amount Validation**
    - **Validates: Requirements 11.7**

  - [x] 2.7 Create Settlement model with Mongoose schema
    - Define Settlement schema with messId, fromUserId, toUserId, amount, description
    - Add indexes: messId, compound (messId, fromUserId), compound (messId, toUserId), createdAt
    - Add isDeleted field for soft deletes
    - Make createdAt immutable
    - _Requirements: 7.3, 14.2, 14.4, 14.7_

  - [ ]* 2.8 Write property test for Settlement model
    - **Property 29: Settlement Immutability**
    - **Validates: Requirements 7.3**

  - [x] 2.9 Create ActivityLog model with Mongoose schema
    - Define ActivityLog schema with messId, userId, action, activityType, resourceId, details, timestamp
    - Add indexes: messId, compound (messId, timestamp)
    - Add TTL index on expiresAt field (90 days)
    - _Requirements: 9.1, 9.7, 14.2, 14.4_

  - [x] 2.10 Create InviteLink model with Mongoose schema
    - Define InviteLink schema with messId, token, createdBy, expiresAt
    - Add unique index on token
    - Add TTL index on expiresAt
    - _Requirements: 3.1, 14.2, 14.4_

- [x] 3. Authentication Service and Middleware
  - [x] 3.1 Implement JWT utility functions
    - Create functions to generate access tokens (15min expiry)
    - Create functions to generate refresh tokens (7 days expiry)
    - Create function to verify JWT tokens
    - Use strong secrets from environment variables
    - _Requirements: 1.2, 13.5_

  - [ ]* 3.2 Write property test for JWT generation
    - **Property 2: JWT Token Generation**
    - **Validates: Requirements 1.2**

  - [x] 3.3 Implement AuthService
    - Implement register method with password validation and hashing
    - Implement login method with credential verification and token generation
    - Implement refreshToken method for token refresh
    - Implement logout method to invalidate refresh tokens
    - Implement revokeAllTokens method
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.7_

  - [ ]* 3.4 Write property tests for AuthService
    - **Property 3: Token Refresh Round Trip**
    - **Property 4: Invalid Credentials Rejection**
    - **Property 5: Token Invalidation on Logout**
    - **Property 6: Password Validation**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 3.5 Implement authentication middleware
    - Create middleware to verify JWT on protected routes
    - Extract user information from token and attach to request
    - Handle token expiration and invalid tokens
    - _Requirements: 13.5_

  - [ ]* 3.6 Write unit tests for authentication middleware
    - Test valid token acceptance
    - Test invalid token rejection
    - Test expired token handling

  - [x] 3.7 Implement rate limiting middleware
    - Configure express-rate-limit for 100 requests per 15 minutes per IP
    - Apply to authentication routes
    - _Requirements: 13.2_

  - [ ]* 3.8 Write property test for rate limiting
    - **Property 7: Rate Limiting Protection**
    - **Validates: Requirements 13.2**

- [x] 4. Authorization Service
  - [x] 4.1 Implement AuthorizationService
    - Implement canManageMess (Owner only)
    - Implement canManageExpenses (Owner or Admin)
    - Implement canEditExpense (Owner, Admin, or creator)
    - Implement canViewAllBalances (Owner or Admin)
    - Implement canViewSettlements (role-based filtering)
    - Implement canAssignRoles (Owner only)
    - Implement getUserRole helper
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.2 Write property test for authorization
    - **Property 16: Role-Based Authorization**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

- [x] 5. Checkpoint - Core Infrastructure Complete
  - Ensure all database models are created with proper indexes
  - Ensure authentication and authorization services are working
  - Run all tests to verify foundational components
  - Ask the user if questions arise

- [x] 6. Mess Management Service
  - [x] 6.1 Implement MessService
    - Implement createMess with Owner assignment and invite code generation
    - Implement updateMess with authorization check
    - Implement getMess with member verification
    - Implement getUserMesses to list all messes for a user
    - Implement generateInviteLink with expiration
    - Implement joinMessByCode with capacity check and duplicate prevention
    - Implement joinMessByLink with token verification
    - Implement removeMember with authorization
    - _Requirements: 2.1, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 6.2 Write property tests for MessService
    - **Property 8: Mess Creation with Owner Assignment**
    - **Property 10: Mess Update Persistence**
    - **Property 11: Multi-Mess Membership**
    - **Property 13: Member Limit Boundary**
    - **Property 14: Default Role Assignment**
    - **Property 15: Duplicate Membership Prevention**
    - **Property 17: Single Owner Invariant**
    - **Validates: Requirements 2.1, 2.4, 2.6, 3.4, 3.5, 3.6, 4.7, 10.5**

  - [x] 6.3 Implement ActivityLogService
    - Implement logExpenseActivity
    - Implement logSettlementActivity
    - Implement logMemberActivity
    - Implement getActivityLogs with role-based filtering
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 6.4 Write property test for activity logging
    - **Property 32: Comprehensive Activity Logging**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 7. Expense Split Logic and Service
  - [x] 7.1 Implement expense split calculation utilities
    - Implement calculateEqualSplit function
    - Implement calculateUnequalSplit with validation
    - Implement calculatePercentageSplit with 100% validation
    - Handle member exclusions
    - Round all amounts to 2 decimal places
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 6.5_

  - [ ]* 7.2 Write property tests for split calculations
    - **Property 19: Equal Split Calculation**
    - **Property 20: Unequal Split Validation**
    - **Property 21: Percentage Split Validation**
    - **Property 22: Member Exclusion**
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7**

  - [x] 7.3 Implement ExpenseService
    - Implement createExpense with split calculation and balance updates
    - Implement updateExpense with authorization and balance recalculation
    - Implement deleteExpense (soft delete) with balance recalculation
    - Implement getExpense with authorization
    - Implement getExpenses with pagination, filtering, and sorting
    - Integrate with ActivityLogService for logging
    - _Requirements: 5.1, 5.8, 5.9, 5.10, 12.1, 12.2, 12.3_

  - [ ]* 7.4 Write property tests for ExpenseService
    - **Property 18: Expense Creation and Balance Update**
    - **Property 23: Expense Modification Balance Recalculation**
    - **Validates: Requirements 5.1, 5.10, 6.1**

- [x] 8. Balance Calculation Service
  - [x] 8.1 Implement BalanceService
    - Implement calculateMemberBalance using formula: (paid - share - settlements_made + settlements_received)
    - Implement getAllBalances for all mess members
    - Implement getBalanceBreakdown with transaction history
    - Round all balances to 2 decimal places
    - Determine balance status (owed/owes/settled)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.2 Write property tests for BalanceService
    - **Property 25: Balance Calculation Formula**
    - **Property 26: Balance Sign Interpretation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 9. Settlement Service and Simplification Algorithm
  - [x] 9.1 Implement settlement simplification algorithm
    - Implement simplifySettlements function using greedy algorithm
    - Separate creditors and debtors
    - Sort by balance amount
    - Match largest creditor with largest debtor
    - Generate minimal transaction list
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test for settlement algorithm
    - **Property 30: Settlement Simplification Correctness**
    - **Validates: Requirements 7.4, 7.5, 7.6**

  - [x] 9.3 Implement SettlementService
    - Implement recordSettlement with amount validation and balance updates
    - Implement getSettlements with role-based filtering and pagination
    - Implement getSettlementSuggestions using simplification algorithm
    - Integrate with ActivityLogService for logging
    - _Requirements: 7.1, 7.2, 7.7, 7.8_

  - [ ]* 9.4 Write property tests for SettlementService
    - **Property 27: Settlement Balance Update**
    - **Property 28: Settlement Amount Validation**
    - **Validates: Requirements 7.1, 7.2**

- [x] 10. Dashboard Service
  - [x] 10.1 Implement DashboardService
    - Implement getDashboardData with current month total calculation
    - Calculate user balance
    - Generate category breakdown with percentages
    - Fetch recent 10 transactions
    - Include member analytics for Owner/Admin roles
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.2 Write property tests for DashboardService
    - **Property 39: Dashboard Data Accuracy**
    - **Property 40: Recent Transactions Limit**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 11. Checkpoint - Backend Services Complete
  - Ensure all services are implemented and tested
  - Verify balance calculations are accurate
  - Verify settlement algorithm produces correct results
  - Run all property tests and unit tests
  - Ask the user if questions arise

- [x] 12. API Controllers and Routes
  - [x] 12.1 Implement Auth Controller and Routes
    - POST /api/auth/register - User registration
    - POST /api/auth/login - User login
    - POST /api/auth/refresh - Token refresh
    - POST /api/auth/logout - User logout
    - POST /api/auth/revoke - Revoke all tokens
    - Add input validation middleware
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.7_

  - [ ]* 12.2 Write integration tests for Auth API
    - Test registration flow
    - Test login flow
    - Test token refresh flow
    - Test logout flow

  - [x] 12.3 Implement Mess Controller and Routes
    - POST /api/messes - Create mess
    - GET /api/messes - Get user's messes
    - GET /api/messes/:id - Get mess details
    - PUT /api/messes/:id - Update mess
    - POST /api/messes/:id/invite - Generate invite link
    - POST /api/messes/join/code - Join by code
    - POST /api/messes/join/link - Join by link
    - DELETE /api/messes/:id/members/:memberId - Remove member
    - Add authentication and authorization middleware
    - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3, 10.1_

  - [ ]* 12.4 Write integration tests for Mess API
    - Test mess creation
    - Test invite generation and joining
    - Test member management

  - [x] 12.5 Implement Expense Controller and Routes
    - POST /api/expenses - Create expense
    - GET /api/expenses - Get expenses (with pagination, filtering, sorting)
    - GET /api/expenses/:id - Get expense details
    - PUT /api/expenses/:id - Update expense
    - DELETE /api/expenses/:id - Delete expense (soft delete)
    - Add authentication and authorization middleware
    - Add pagination middleware
    - _Requirements: 5.1, 5.8, 5.9, 5.10, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 12.6 Write property tests for pagination
    - **Property 36: Pagination Correctness**
    - **Property 37: Pagination Limit Enforcement**
    - **Property 38: Filter and Sort Correctness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

  - [x] 12.7 Implement Settlement Controller and Routes
    - POST /api/settlements - Record settlement
    - GET /api/settlements - Get settlements (with pagination, filtering)
    - GET /api/settlements/suggestions - Get settlement suggestions
    - Add authentication and authorization middleware
    - _Requirements: 7.1, 7.4, 7.5_

  - [x] 12.8 Implement Balance Controller and Routes
    - GET /api/balances/me - Get user's balance
    - GET /api/balances - Get all balances (Owner/Admin only)
    - GET /api/balances/:userId/breakdown - Get balance breakdown
    - Add authentication and authorization middleware
    - _Requirements: 6.1, 6.2, 6.6_

  - [x] 12.9 Implement Dashboard Controller and Routes
    - GET /api/dashboard - Get dashboard data
    - Add authentication middleware
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 12.10 Implement Activity Log Controller and Routes
    - GET /api/activity-logs - Get activity logs (with pagination, filtering)
    - Add authentication and authorization middleware
    - _Requirements: 9.5, 9.6_

- [x] 13. Input Validation and Error Handling
  - [x] 13.1 Implement validation middleware
    - Create validation schemas using express-validator
    - Add validation for all request bodies and query parameters
    - Sanitize inputs to prevent injection attacks
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 13.2 Write property tests for validation
    - **Property 33: Required Field Validation**
    - **Property 34: Data Type Validation**
    - **Property 35: Input Sanitization**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

  - [x] 13.3 Implement centralized error handling middleware
    - Create error handler that catches all errors
    - Format errors consistently
    - Log errors with details
    - Return appropriate HTTP status codes
    - Sanitize error messages for production
    - _Requirements: 11.5, 11.6_

  - [ ]* 13.4 Write unit tests for error handling
    - Test different error types
    - Test error response format
    - Test error logging

- [x] 14. Security Middleware and Configuration
  - [x] 14.1 Configure security middleware
    - Set up Helmet for security headers
    - Configure CORS with whitelisted origins
    - Add CSRF protection for state-changing operations
    - _Requirements: 13.3, 13.4, 13.9_

  - [ ]* 14.2 Write property tests for security
    - **Property for CORS validation**
    - **Property for security headers**
    - **Validates: Requirements 13.3, 13.4**

  - [x] 14.2 Implement health check endpoint
    - GET /health - Return server status and database connectivity
    - _Requirements: 15.4_

  - [x] 14.3 Implement graceful shutdown
    - Handle SIGTERM and SIGINT signals
    - Close database connections gracefully
    - Complete in-flight requests before shutdown
    - _Requirements: 15.8_

- [x] 15. Checkpoint - Backend API Complete
  - Ensure all API endpoints are implemented
  - Verify all middleware is working correctly
  - Test end-to-end API flows
  - Run all tests (unit, integration, property)
  - Ask the user if questions arise

- [x] 16. Frontend State Management Setup
  - [x] 16.1 Set up Zustand stores
    - Create authStore for authentication state
    - Create messStore for current mess context
    - Create uiStore for UI state (toasts, modals, loading)
    - _Requirements: 10.2_

  - [ ]* 16.2 Write unit tests for stores
    - Test state updates
    - Test action creators
    - Test selectors

  - [x] 16.3 Set up Axios instance with interceptors
    - Configure base URL from environment
    - Add request interceptor to attach JWT token
    - Add response interceptor for token refresh on 401
    - Add response interceptor for error handling
    - _Requirements: 1.3_

- [x] 17. Authentication Components
  - [x] 17.1 Implement LoginForm component
    - Create form with email and password fields
    - Add form validation using React Hook Form + Zod
    - Handle login submission
    - Display error messages
    - _Requirements: 1.2, 1.4_

  - [ ]* 17.2 Write component tests for LoginForm
    - Test form rendering
    - Test validation
    - Test submission

  - [x] 17.3 Implement RegisterForm component
    - Create form with name, email, password fields
    - Add password strength indicator
    - Add form validation
    - Handle registration submission
    - _Requirements: 1.1, 1.6_

  - [x] 17.4 Implement ProtectedRoute component
    - Check authentication status
    - Redirect to login if not authenticated
    - Optionally check role requirements
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 17.5 Create authentication pages
    - Login page
    - Register page
    - Layout with branding

- [x] 18. Mess Management Components
  - [x] 18.1 Implement MessList component
    - Display all messes user belongs to
    - Show member count and role for each mess
    - Add mess selection functionality
    - _Requirements: 10.1_

  - [x] 18.2 Implement CreateMessModal component
    - Create form for mess name and member limit
    - Add validation
    - Handle mess creation
    - _Requirements: 2.1, 2.2_

  - [x] 18.3 Implement MessSettings component
    - Display mess details
    - Allow editing (Owner only)
    - Show member list with roles
    - Allow role assignment (Owner only)
    - Allow member removal (Owner only)
    - _Requirements: 2.4, 2.5, 4.2_

  - [x] 18.4 Implement InviteModal component
    - Generate invite link
    - Display invite code
    - Copy to clipboard functionality
    - Show expiration time
    - _Requirements: 3.1_

  - [x] 18.5 Implement JoinMessModal component
    - Input for invite code or link
    - Handle join request
    - Display success/error messages
    - _Requirements: 3.2, 3.3_

- [x] 19. Expense Management Components
  - [x] 19.1 Implement ExpenseList component
    - Display paginated expense list
    - Show expense details (amount, description, category, date, payer)
    - Add click to view details
    - Integrate with ExpenseFilters
    - _Requirements: 12.1_

  - [x] 19.2 Implement ExpenseFilters component
    - Date range picker
    - Category dropdown
    - Member dropdown
    - Sort options
    - Apply filters to expense list
    - _Requirements: 12.2, 12.3_

  - [x] 19.3 Implement CreateExpenseModal component
    - Multi-step form (details → split configuration)
    - Amount, description, category, date, payer inputs
    - Split method selection (equal/unequal/percentage)
    - Member selection with exclusion
    - Integrate SplitCalculator
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 19.4 Implement SplitCalculator component
    - Display split preview
    - For equal: show calculated amounts
    - For unequal: allow custom amounts per member
    - For percentage: allow percentage input per member with 100% validation
    - Show real-time calculation
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 19.5 Implement ExpenseDetail component
    - Display full expense information
    - Show split breakdown
    - Allow edit/delete (if authorized)
    - _Requirements: 5.8, 5.9_

- [x] 20. Balance and Settlement Components
  - [x] 20.1 Implement BalanceCard component
    - Display user's current balance
    - Show status indicator (owed/owes/settled)
    - Color coding for positive/negative
    - _Requirements: 6.3, 6.4, 6.6_

  - [x] 20.2 Implement BalanceSummary component
    - Display all member balances (Owner/Admin only)
    - Sortable table
    - Show total owed and total owing
    - _Requirements: 6.6, 8.5_

  - [x] 20.3 Implement SettlementModal component
    - Select payee from members
    - Input settlement amount
    - Validate amount doesn't exceed balance
    - Handle settlement submission
    - _Requirements: 7.1, 7.2_

  - [x] 20.4 Implement SettlementSuggestions component
    - Display optimized settlement suggestions
    - Show from → to → amount for each suggestion
    - Highlight minimal transaction count
    - Quick action to record suggested settlement
    - _Requirements: 7.4, 7.5_

  - [x] 20.5 Implement SettlementHistory component
    - Display paginated settlement list
    - Show date, from, to, amount
    - Filter by date range
    - _Requirements: 7.7, 7.8_

- [x] 21. Dashboard Components
  - [x] 21.1 Implement Dashboard layout
    - Grid layout for cards
    - Responsive design
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 21.2 Implement ExpenseSummaryCard
    - Display current month total
    - Show comparison with previous month
    - Visual indicator for trends
    - _Requirements: 8.1_

  - [x] 21.3 Implement CategoryChart
    - Pie or bar chart for category breakdown
    - Show percentages
    - Interactive tooltips
    - _Requirements: 8.3_

  - [x] 21.4 Implement RecentTransactions component
    - List last 10 transactions
    - Show type (expense/settlement), description, amount, date
    - Link to details
    - _Requirements: 8.4_

  - [x] 21.5 Implement MemberAnalyticsTable component
    - Display member-wise analytics (Owner/Admin only)
    - Show total paid, total share, balance for each member
    - Sortable columns
    - _Requirements: 8.5_

- [x] 22. Shared Components and Navigation
  - [x] 22.1 Implement Navbar component
    - Display current mess name
    - Mess switcher dropdown
    - User menu with logout
    - _Requirements: 10.2_

  - [x] 22.2 Implement Sidebar component
    - Navigation links (Dashboard, Expenses, Settlements, Members, Settings)
    - Active link highlighting
    - Collapsible on mobile
    - _Requirements: Navigation_

  - [x] 22.3 Implement shared UI components
    - LoadingSpinner
    - Toast notification system
    - ConfirmDialog for destructive actions
    - ErrorBoundary for error handling
    - _Requirements: UI/UX_

- [x] 23. Data Isolation Testing
  - [x]* 23.1 Write property test for data isolation
    - **Property 31: Mess Data Isolation**
    - **Validates: Requirements 10.3, 10.4**

- [x] 24. Checkpoint - Frontend Complete
  - Ensure all components are implemented
  - Verify authentication flow works end-to-end
  - Test expense creation and balance updates
  - Test settlement recording and suggestions
  - Run all frontend tests
  - Ask the user if questions arise

- [ ] 25. Integration and End-to-End Testing
  - [ ]* 25.1 Write integration tests for complete flows
    - Test user registration → login → create mess → invite member → create expense → view balance → record settlement
    - Test multi-mess scenarios
    - Test role-based access control across all features

  - [ ] 25.2 Manual testing checklist
    - Test on different browsers (Chrome, Firefox, Safari)
    - Test responsive design on mobile devices
    - Test error scenarios (network failures, invalid inputs)
    - Test concurrent user scenarios

- [ ] 26. Production Preparation
  - [ ] 26.1 Create production build scripts
    - Backend: TypeScript compilation, environment config
    - Frontend: Vite production build with optimization
    - _Requirements: 15.3_

  - [ ] 26.2 Set up logging configuration
    - Configure Winston logger for backend
    - Log to files in production, console in development
    - Set appropriate log levels
    - _Requirements: 15.5_

  - [ ] 26.3 Create deployment documentation
    - Environment variable setup guide
    - Database setup and migration instructions
    - Server deployment steps
    - Frontend deployment steps
    - Health check and monitoring setup
    - _Requirements: 15.6_

  - [ ] 26.4 Create example environment files
    - .env.example for backend
    - .env.example for frontend
    - Document all required variables
    - _Requirements: 15.1_

- [ ] 27. Final Checkpoint - Production Ready
  - Run full test suite (unit, integration, property tests)
  - Verify all 40 correctness properties pass
  - Test production builds locally
  - Review security checklist
  - Review deployment documentation
  - Ask the user for final review and deployment approval

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and user feedback
- Implementation follows the design document architecture
- All code should be production-ready with proper error handling and logging
