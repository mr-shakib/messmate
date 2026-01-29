# Security Middleware and Configuration Implementation

## Overview
This document describes the security middleware and configuration implemented for the MessMate backend application.

## Implemented Features

### 1. Enhanced Security Headers (Helmet)
**Location:** `backend/src/app.ts`

Configured Helmet.js with comprehensive security headers:
- **Content Security Policy (CSP)**: Restricts resource loading to prevent XSS attacks
- **Cross-Origin Policies**: COEP, COOP, and CORP configured for enhanced isolation
- **DNS Prefetch Control**: Disabled to prevent information leakage
- **Frameguard**: Prevents clickjacking by denying iframe embedding
- **HSTS**: Enforces HTTPS with 1-year max-age and subdomain inclusion
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **Referrer Policy**: Strict origin policy for cross-origin requests
- **XSS Filter**: Additional XSS protection

### 2. CORS Configuration
**Location:** `backend/src/app.ts`

Enhanced CORS configuration with:
- **Whitelisted Origins**: Supports comma-separated list of allowed origins from environment variable
- **Dynamic Origin Validation**: Validates each request origin against whitelist
- **Credentials Support**: Allows cookies and authentication headers
- **Method Restrictions**: Only allows necessary HTTP methods
- **Header Controls**: Specifies allowed and exposed headers including X-CSRF-Token
- **Preflight Caching**: 10-minute cache for OPTIONS requests

**Environment Variable:**
```
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. CSRF Protection
**Location:** `backend/src/middleware/csrf.middleware.ts`

Implemented CSRF protection for state-changing operations:
- **Token Generation**: Generates unique CSRF tokens per session
- **Cookie-based Storage**: Stores token in XSRF-TOKEN cookie (readable by JavaScript)
- **Header Verification**: Validates X-CSRF-Token header on POST/PUT/DELETE/PATCH requests
- **Session Binding**: Ties tokens to user sessions or IP addresses
- **Automatic Exemption**: Skips verification for safe methods (GET, HEAD, OPTIONS)

**Endpoints:**
- `GET /api/csrf-token`: Retrieve CSRF token for authenticated requests
- All `/api/*` routes: Protected with CSRF verification for state-changing methods

**Client Integration:**
```javascript
// Frontend should:
1. Fetch CSRF token from /api/csrf-token or read from XSRF-TOKEN cookie
2. Include token in X-CSRF-Token header for all POST/PUT/DELETE/PATCH requests
```

### 4. Health Check Endpoints
**Location:** `backend/src/app.ts`

Two health check endpoints for monitoring:

#### Basic Health Check
**Endpoint:** `GET /health`

Returns:
```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": "2024-01-11T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "database": {
    "status": "connected" | "disconnected" | "connecting" | "error",
    "connected": true
  }
}
```

**Status Codes:**
- `200`: System healthy
- `503`: System degraded or error

#### Detailed Health Check
**Endpoint:** `GET /health/detailed`

Returns additional system information:
```json
{
  "status": "ok",
  "timestamp": "2024-01-11T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.17.0",
    "memory": {
      "total": "256 MB",
      "used": "128 MB"
    }
  },
  "database": {
    "status": "connected",
    "connected": true,
    "host": "localhost",
    "name": "messmate"
  }
}
```

### 5. Graceful Shutdown
**Location:** `backend/src/index.ts`

Enhanced graceful shutdown handling:

**Features:**
- **Signal Handling**: Responds to SIGTERM and SIGINT signals
- **Connection Tracking**: Tracks all active HTTP connections
- **Graceful Connection Closure**: Attempts to close connections gracefully
- **Database Cleanup**: Closes MongoDB connections properly
- **Timeout Protection**: Forces shutdown after 30 seconds if graceful shutdown fails
- **Error Handling**: Handles uncaught exceptions and unhandled promise rejections
- **Duplicate Prevention**: Prevents multiple shutdown attempts

**Shutdown Sequence:**
1. Stop accepting new connections
2. Close existing connections gracefully (1-second grace period)
3. Force close remaining connections
4. Close database connection
5. Exit process with appropriate code

**Timeout:** 30 seconds maximum for graceful shutdown

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (headers, CORS, CSRF)
2. **Principle of Least Privilege**: Restrictive CSP and CORS policies
3. **Secure Defaults**: Production-ready security settings
4. **Monitoring**: Health checks for system observability
5. **Graceful Degradation**: Proper error handling and shutdown procedures

## Configuration Requirements

### Environment Variables
```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Node Environment
NODE_ENV=production

# JWT Secrets (required in production)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
```

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Configure CORS_ORIGIN with production domains only
- [ ] Enable HTTPS (Helmet HSTS requires it)
- [ ] Set NODE_ENV=production
- [ ] Configure monitoring to use /health endpoint
- [ ] Set up log aggregation for security events
- [ ] Review and adjust CSP directives for your frontend needs

## Testing

### Manual Testing
```bash
# Test health check
curl http://localhost:5000/health

# Test detailed health check
curl http://localhost:5000/health/detailed

# Test CSRF token retrieval
curl http://localhost:5000/api/csrf-token

# Test CORS (should be blocked)
curl -H "Origin: http://malicious-site.com" http://localhost:5000/api/messes

# Test graceful shutdown
# Start server, then send SIGTERM
kill -TERM <pid>
```

### Integration Testing
The security middleware integrates with existing authentication and authorization:
- CSRF tokens work with JWT authentication
- Health checks don't require authentication
- CORS allows authenticated requests from whitelisted origins

## Future Enhancements

1. **CSRF Token Storage**: Move from in-memory to Redis for distributed systems
2. **Rate Limiting**: Already implemented in auth routes, consider expanding
3. **Security Headers**: Fine-tune CSP directives based on frontend requirements
4. **Monitoring**: Add metrics collection for security events
5. **Audit Logging**: Enhanced logging for security-related events

## References

- Requirements: 13.3, 13.4, 13.9, 15.4, 15.8
- Design Document: Security section
- Helmet.js: https://helmetjs.github.io/
- CSRF Protection: https://github.com/pillarjs/csrf
