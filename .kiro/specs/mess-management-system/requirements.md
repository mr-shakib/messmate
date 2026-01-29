# Requirements Document

## Introduction

MessMate is a shared household (mess) management system designed for bachelor flats and shared accommodations with 6-20 members. The system enables users to manage expenses, track balances, facilitate settlements, and maintain transparency in shared living arrangements. Built using the MERN stack (MongoDB, Express, React, Node.js), the system provides role-based access control, secure authentication, and comprehensive expense management capabilities.

## Glossary

- **Mess**: A shared household or living arrangement with multiple members who share expenses
- **Owner**: The user who creates a mess and has full administrative privileges
- **Admin**: A member with elevated privileges to manage expenses and members
- **Member**: A regular user who can view expenses and their own balances
- **Expense**: A financial transaction recorded in the mess that needs to be split among members
- **Settlement**: A payment made between members to clear outstanding balances
- **Balance**: The net amount a member owes to or is owed by the mess
- **Split**: The method of dividing an expense among members (equal, unequal, percentage)
- **System**: The MessMate application
- **User**: Any authenticated person using the system
- **JWT**: JSON Web Token used for authentication
- **API**: Application Programming Interface for backend communication

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a user, I want to securely sign up and log in to the system, so that I can access my mess information and maintain data privacy.

#### Acceptance Criteria

1. WHEN a user provides valid registration details (name, email, password), THE System SHALL create a new user account with hashed password
2. WHEN a user provides valid login credentials, THE System SHALL generate a JWT access token and refresh token
3. WHEN a user's access token expires, THE System SHALL allow token refresh using a valid refresh token
4. WHEN a user provides invalid credentials, THE System SHALL reject the login attempt and return an appropriate error message
5. WHEN a user logs out, THE System SHALL invalidate the refresh token
6. THE System SHALL enforce password requirements (minimum 8 characters, at least one uppercase, one lowercase, one number)
7. WHEN authentication fails three times within 15 minutes from the same IP, THE System SHALL temporarily block further attempts

### Requirement 2: Mess Creation and Management

**User Story:** As a user, I want to create and manage a mess, so that I can organize shared expenses with my housemates.

#### Acceptance Criteria

1. WHEN a user creates a mess with valid details (name, member limit), THE System SHALL create the mess and assign the user as Owner
2. THE System SHALL enforce a member limit between 6 and 20 members per mess
3. WHEN a mess is created, THE System SHALL generate a unique invite code and invite link
4. WHEN an Owner updates mess details, THE System SHALL persist the changes immediately
5. WHERE a user is an Owner or Admin, THE System SHALL allow them to view and manage mess settings
6. WHEN a user creates a mess, THE System SHALL allow the user to be a member of multiple messes simultaneously

### Requirement 3: Member Invitation and Joining

**User Story:** As a mess owner, I want to invite members to join my mess, so that we can track shared expenses together.

#### Acceptance Criteria

1. WHEN an Owner generates an invite link, THE System SHALL create a unique, time-limited URL
2. WHEN a user clicks a valid invite link, THE System SHALL allow them to join the mess if space is available
3. WHEN a user provides a valid invite code, THE System SHALL add them to the corresponding mess
4. IF a mess has reached its member limit, THEN THE System SHALL prevent new members from joining
5. WHEN a user joins a mess, THE System SHALL assign them the Member role by default
6. WHEN a user is already a member of a mess, THE System SHALL prevent duplicate membership

### Requirement 4: Role-Based Access Control

**User Story:** As a mess owner, I want to assign different roles to members, so that I can delegate responsibilities and control access to sensitive operations.

#### Acceptance Criteria

1. THE System SHALL support three roles: Owner, Admin, and Member
2. WHEN an Owner assigns a role to a member, THE System SHALL update the member's permissions immediately
3. WHERE a user has Owner role, THE System SHALL allow them to perform all operations including role assignment and mess deletion
4. WHERE a user has Admin role, THE System SHALL allow them to manage expenses and view all member balances
5. WHERE a user has Member role, THE System SHALL allow them to view expenses and their own balance only
6. WHEN a user attempts an unauthorized operation, THE System SHALL reject the request with a 403 Forbidden error
7. THE System SHALL ensure each mess has exactly one Owner at all times

### Requirement 5: Expense Creation and Management

**User Story:** As a member, I want to record expenses with flexible split options, so that costs can be fairly distributed among participants.

#### Acceptance Criteria

1. WHEN a user creates an expense with valid details (amount, description, category, date, payer), THE System SHALL record the expense and update balances
2. THE System SHALL support expense categories (Groceries, Utilities, Rent, Food, Entertainment, Other)
3. WHEN creating an expense, THE System SHALL allow the user to select a split method (equal, unequal, percentage)
4. WHEN equal split is selected, THE System SHALL divide the expense equally among all non-excluded members
5. WHEN unequal split is selected, THE System SHALL allow custom amounts for each member
6. WHEN percentage split is selected, THE System SHALL allow percentage allocation for each member and validate that total equals 100%
7. WHEN creating an expense, THE System SHALL allow the user to exclude specific members from the split
8. WHERE a user has Admin or Owner role, THE System SHALL allow them to edit or delete any expense
9. WHERE a user has Member role, THE System SHALL allow them to edit or delete only their own expenses
10. WHEN an expense is modified or deleted, THE System SHALL recalculate all affected member balances immediately

### Requirement 6: Balance Calculation and Tracking

**User Story:** As a member, I want to see accurate balances showing who owes whom, so that I can settle my dues fairly.

#### Acceptance Criteria

1. WHEN an expense is recorded, THE System SHALL update the balance for each involved member immediately
2. THE System SHALL calculate balances as: (amount paid by member) - (member's share of all expenses)
3. WHEN a member has a positive balance, THE System SHALL indicate they are owed money
4. WHEN a member has a negative balance, THE System SHALL indicate they owe money
5. THE System SHALL maintain balance accuracy to two decimal places
6. WHEN displaying balances, THE System SHALL show the net amount for each member
7. THE System SHALL provide a breakdown showing individual transactions contributing to each balance

### Requirement 7: Settlement Recording and Simplification

**User Story:** As a member, I want to record settlements and see simplified payment suggestions, so that I can clear my dues with minimum transactions.

#### Acceptance Criteria

1. WHEN a member records a settlement payment, THE System SHALL update both payer and payee balances immediately
2. THE System SHALL validate that settlement amounts do not exceed the outstanding balance
3. WHEN a settlement is recorded, THE System SHALL create an immutable settlement record with timestamp
4. THE System SHALL implement a settlement simplification algorithm that minimizes the number of transactions needed
5. WHEN displaying settlement suggestions, THE System SHALL show the optimal set of payments to clear all balances
6. THE System SHALL ensure the simplification algorithm produces mathematically equivalent results to individual settlements
7. WHERE a user has Admin or Owner role, THE System SHALL allow them to view all settlements
8. WHERE a user has Member role, THE System SHALL allow them to view only settlements involving themselves

### Requirement 8: Dashboard and Analytics

**User Story:** As a member, I want to view a dashboard with expense summaries and analytics, so that I can understand spending patterns.

#### Acceptance Criteria

1. WHEN a user views the dashboard, THE System SHALL display total expenses for the current month
2. WHEN a user views the dashboard, THE System SHALL display their current balance
3. WHEN a user views the dashboard, THE System SHALL show expense breakdown by category
4. WHEN a user views the dashboard, THE System SHALL display recent transactions (last 10)
5. WHERE a user has Admin or Owner role, THE System SHALL show analytics for all members
6. WHERE a user has Member role, THE System SHALL show analytics for their own expenses only
7. WHEN displaying analytics, THE System SHALL provide filtering by date range and category

### Requirement 9: Activity Logging

**User Story:** As an owner, I want to see an activity log of all mess operations, so that I can maintain transparency and audit changes.

#### Acceptance Criteria

1. WHEN any expense is created, modified, or deleted, THE System SHALL log the activity with timestamp and user
2. WHEN any settlement is recorded, THE System SHALL log the activity with timestamp and user
3. WHEN a member joins or leaves, THE System SHALL log the activity with timestamp
4. WHEN roles are changed, THE System SHALL log the activity with timestamp and user
5. WHERE a user has Owner role, THE System SHALL allow them to view the complete activity log
6. WHERE a user has Admin role, THE System SHALL allow them to view expense and settlement activities only
7. THE System SHALL retain activity logs for a minimum of 90 days

### Requirement 10: Multi-Mess Support

**User Story:** As a user, I want to be a member of multiple messes simultaneously, so that I can manage different shared living situations.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE System SHALL allow them to view all messes they belong to
2. WHEN a user switches between messes, THE System SHALL update the context to show the selected mess's data
3. THE System SHALL maintain separate balances, expenses, and settlements for each mess
4. WHEN displaying data, THE System SHALL ensure no cross-contamination between different messes
5. THE System SHALL allow a user to have different roles in different messes

### Requirement 11: Input Validation and Error Handling

**User Story:** As a developer, I want comprehensive input validation and error handling, so that the system remains stable and secure.

#### Acceptance Criteria

1. WHEN invalid data is submitted to any API endpoint, THE System SHALL reject the request with a 400 Bad Request error and descriptive message
2. THE System SHALL validate all required fields are present before processing requests
3. THE System SHALL validate data types match expected formats (email format, numeric amounts, date formats)
4. THE System SHALL sanitize all user inputs to prevent injection attacks
5. WHEN an unexpected error occurs, THE System SHALL log the error details and return a generic error message to the client
6. THE System SHALL implement centralized error handling middleware for consistent error responses
7. THE System SHALL validate that expense amounts are positive numbers
8. THE System SHALL validate that member limits are within the allowed range (6-20)

### Requirement 12: API Pagination and Filtering

**User Story:** As a user, I want to efficiently browse large lists of expenses and activities, so that the application remains responsive.

#### Acceptance Criteria

1. WHEN requesting a list of expenses, THE System SHALL support pagination with configurable page size
2. WHEN requesting a list of expenses, THE System SHALL support filtering by date range, category, and member
3. WHEN requesting a list of expenses, THE System SHALL support sorting by date, amount, and category
4. THE System SHALL return pagination metadata (total count, current page, total pages) with list responses
5. THE System SHALL limit maximum page size to 100 items to prevent performance issues
6. WHEN no page size is specified, THE System SHALL default to 20 items per page

### Requirement 13: Security Implementation

**User Story:** As a system administrator, I want robust security measures implemented, so that user data remains protected.

#### Acceptance Criteria

1. THE System SHALL hash all passwords using bcrypt with a minimum cost factor of 10
2. THE System SHALL implement rate limiting of 100 requests per 15 minutes per IP address
3. THE System SHALL configure CORS to allow only whitelisted frontend origins
4. THE System SHALL set secure HTTP headers (Helmet.js) to prevent common vulnerabilities
5. THE System SHALL validate JWT signatures on all protected routes
6. THE System SHALL store refresh tokens securely and associate them with user sessions
7. WHEN a JWT is compromised, THE System SHALL provide a mechanism to revoke all tokens for a user
8. THE System SHALL transmit all data over HTTPS in production environments
9. THE System SHALL implement CSRF protection for state-changing operations

### Requirement 14: Database Design and Indexing

**User Story:** As a developer, I want an optimized database schema with proper indexing, so that queries remain fast as data grows.

#### Acceptance Criteria

1. THE System SHALL use MongoDB with Mongoose ODM for data modeling
2. THE System SHALL define indexes on frequently queried fields (user email, mess invite codes, expense dates)
3. THE System SHALL implement compound indexes for common query patterns (mess + date, mess + member)
4. THE System SHALL use appropriate data types for all fields (ObjectId for references, Date for timestamps, Number for amounts)
5. THE System SHALL implement referential integrity through Mongoose population and validation
6. THE System SHALL use embedded documents for tightly coupled data and references for loosely coupled data
7. THE System SHALL implement soft deletes for expenses and settlements to maintain audit trails

### Requirement 15: Production Deployment Configuration

**User Story:** As a DevOps engineer, I want clear deployment configuration and environment management, so that the application can be deployed reliably.

#### Acceptance Criteria

1. THE System SHALL use environment variables for all configuration (database URLs, JWT secrets, API keys)
2. THE System SHALL provide separate configuration for development, staging, and production environments
3. THE System SHALL include a production build script that optimizes frontend assets
4. THE System SHALL implement health check endpoints for monitoring
5. THE System SHALL configure logging to write to files in production and console in development
6. THE System SHALL provide clear documentation for deployment steps
7. THE System SHALL include database migration scripts for schema changes
8. THE System SHALL implement graceful shutdown handling for the Node.js server
