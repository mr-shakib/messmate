# Error Handling Guide

## Overview

The MessMate backend implements a centralized error handling system that provides consistent error responses, proper logging, and security-conscious error messages.

## Error Response Format

All errors follow this consistent format:

```typescript
{
  success: false,
  error: {
    code: string,        // Machine-readable error code
    message: string,     // Human-readable error message
    details?: any,       // Additional error details (omitted in production)
    timestamp: Date,     // When the error occurred
    path: string        // Request path where error occurred
  }
}
```

## Error Categories

### 1. Validation Errors (400 Bad Request)
- Missing required fields
- Invalid data types or formats
- Business rule violations

**Example:**
```typescript
import { createValidationError } from '../utils/errors';

throw createValidationError('Invalid input', [
  { field: 'email', message: 'Invalid email format' }
]);
```

### 2. Authentication Errors (401 Unauthorized)
- Missing or invalid JWT token
- Expired access token
- Invalid credentials

**Example:**
```typescript
import { createInvalidCredentialsError } from '../utils/errors';

throw createInvalidCredentialsError();
```

### 3. Authorization Errors (403 Forbidden)
- Insufficient permissions
- Attempting to access resources from different mess

**Example:**
```typescript
import { createAuthorizationError } from '../utils/errors';

throw createAuthorizationError('Only owners can delete messes');
```

### 4. Not Found Errors (404 Not Found)
- Requested resource doesn't exist

**Example:**
```typescript
import { createNotFoundError } from '../utils/errors';

throw createNotFoundError('User');
```

### 5. Conflict Errors (409 Conflict)
- Duplicate email registration
- Duplicate mess membership
- Mess at capacity

**Example:**
```typescript
import { createDuplicateError } from '../utils/errors';

throw createDuplicateError('Email', email);
```

### 6. Business Logic Errors (422 Unprocessable Entity)
- Complex business rule violations

**Example:**
```typescript
import { createBusinessLogicError } from '../utils/errors';

throw createBusinessLogicError('Settlement amount exceeds balance');
```

### 7. Rate Limit Errors (429 Too Many Requests)
- Exceeded rate limit threshold

**Example:**
```typescript
import { createRateLimitError } from '../utils/errors';

throw createRateLimitError();
```

### 8. Server Errors (500 Internal Server Error)
- Unexpected errors
- Database connection failures

## Using AppError

### Basic Usage

```typescript
import { AppError } from '../middleware/errorHandler';

throw new AppError('Custom error message', 400, 'CUSTOM_ERROR_CODE');
```

### With Details

```typescript
throw new AppError(
  'Validation failed',
  400,
  'VALIDATION_ERROR',
  { fields: ['email', 'password'] }
);
```

## Using Error Utility Functions

The `utils/errors.ts` file provides convenient functions for common error scenarios:

```typescript
import {
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  createDuplicateError,
  // ... other error creators
} from '../utils/errors';

// Validation error
throw createValidationError('Invalid input');

// Not found error
throw createNotFoundError('User');

// Authorization error
throw createAuthorizationError('Insufficient permissions');

// Duplicate error
throw createDuplicateError('Email', 'test@example.com');
```

## Automatic Error Handling

The error handler automatically converts certain error types:

### Mongoose Validation Errors
```typescript
// Mongoose validation errors are automatically converted to 400 errors
const user = new User({ email: 'invalid' });
await user.save(); // Throws ValidationError, converted to AppError
```

### Mongoose Cast Errors
```typescript
// Invalid ObjectId automatically converted to 400 error
await User.findById('invalid-id'); // Throws CastError, converted to AppError
```

### MongoDB Duplicate Key Errors
```typescript
// Duplicate key errors automatically converted to 409 errors
await User.create({ email: 'existing@example.com' }); // Throws duplicate key error
```

### JWT Errors
```typescript
// JWT errors automatically converted to 401 errors
verifyToken('invalid-token'); // Throws JsonWebTokenError, converted to AppError
```

## Error Logging

All errors are automatically logged with:
- Error message and stack trace
- HTTP method and path
- Request body, params, and query
- User ID (if authenticated)
- Status code

Example log output:
```
Error: User not found
  method: GET
  path: /api/users/123
  statusCode: 404
  user: user123
  stack: Error: User not found...
```

## Production vs Development

### Development Mode
- Full error messages
- Stack traces included
- Error details visible

### Production Mode
- Sanitized error messages
- No stack traces
- Sensitive information removed
- Generic messages for internal errors

## Best Practices

1. **Use specific error creators** instead of generic `throw new Error()`
2. **Include relevant details** for debugging (they're hidden in production)
3. **Use appropriate status codes** for different error types
4. **Provide user-friendly messages** that don't expose system internals
5. **Log errors with context** for debugging

## Example Service Implementation

```typescript
import {
  createNotFoundError,
  createAuthorizationError,
  createValidationError,
} from '../utils/errors';

class UserService {
  async getUser(userId: string, requesterId: string) {
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createValidationError('Invalid user ID');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw createNotFoundError('User');
    }

    // Check authorization
    if (user._id.toString() !== requesterId) {
      throw createAuthorizationError('Cannot view other users');
    }

    return user;
  }
}
```

## Testing Error Handling

```typescript
describe('UserService', () => {
  it('should throw not found error for non-existent user', async () => {
    await expect(
      userService.getUser('nonexistent', 'requester')
    ).rejects.toThrow('User not found');
  });

  it('should throw authorization error for unauthorized access', async () => {
    await expect(
      userService.getUser('user1', 'user2')
    ).rejects.toThrow('Cannot view other users');
  });
});
```

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| INVALID_ID | 400 | Invalid ObjectId or identifier |
| REQUIRED_FIELD | 400 | Required field missing |
| AUTHENTICATION_ERROR | 401 | Authentication failed |
| INVALID_CREDENTIALS | 401 | Wrong email or password |
| TOKEN_EXPIRED | 401 | JWT token expired |
| INVALID_TOKEN | 401 | Invalid JWT token |
| AUTHORIZATION_ERROR | 403 | Insufficient permissions |
| INSUFFICIENT_PERMISSIONS | 403 | Cannot perform action |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| DUPLICATE_KEY | 409 | Duplicate value |
| BUSINESS_LOGIC_ERROR | 422 | Business rule violation |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
