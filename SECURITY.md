# LidaCacau - Security Documentation

## Overview

This document outlines security practices, secret management, and operational procedures for the LidaCacau application.

## Authentication Security

### Password Handling

- **Hashing Algorithm**: SHA-256 with PBKDF2-style iterations
- **Salt**: Random 32-character salt per password
- **Iterations**: 10,000 rounds for key stretching
- **Storage**: Hashed passwords stored in `password` field, never plain text

```typescript
// Password is hashed before storage
const hashedPassword = await hashPassword(plainPassword);
// Verification compares against stored hash
const isValid = await verifyPassword(plainPassword, storedHash);
```

### Session Management

- **Token Storage**: Uses `expo-secure-store` on native platforms
- **Web Fallback**: AsyncStorage with security warning (development only)
- **Session Data**: Only user ID and token stored securely, not full user object
- **Logout**: Clears both SecureStore and AsyncStorage data

### Rate Limiting

Pre-configured limiters protect against abuse:

| Limiter | Requests | Window | Use Case |
|---------|----------|--------|----------|
| `authLimiter` | 5 | 1 minute | Login/Register (brute force protection) |
| `apiLimiter` | 30 | 1 minute | General API calls |
| `storageLimiter` | 100 | 1 minute | Local storage operations |

## Input Validation

All user inputs are validated before processing:

- **Email**: Format validation with specific error messages
- **Password**: Min 8 chars, uppercase, lowercase, number required
- **Phone**: Brazilian format (10-11 digits)
- **CPF**: Full check digit validation algorithm
- **Names**: Min 2 chars, letters and spaces only

```typescript
import { validateEmail, validatePassword, validateCPF } from '@/services/common';

const emailResult = validateEmail(input);
if (!emailResult.isValid) {
  showError(emailResult.error); // Portuguese message
}
```

## Error Handling

### Error Logging

All errors are logged with:
- Severity level (info, warning, error, critical)
- Category (network, auth, validation, storage, unknown)
- Timestamp and context
- User-friendly Portuguese message

```typescript
import { logError, createAppError, getUserMessage } from '@/services/common';

logError(createAppError('AUTH_INVALID_CREDENTIALS', 'Login failed', 'error', 'auth'));
```

### Error Buffer

- Last 100 errors stored in memory for debugging
- Access via `getErrorLog()` or `getRecentErrors(count)`
- Clear with `clearErrorLog()`

## Secret Management

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Production |
| `SESSION_SECRET` | Session encryption key | Production |
| `OPENPIX_APP_ID` | Payment processing | Production |

### Development Secrets

Stored in Replit Secrets:
- Never commit to version control
- Access via `process.env.SECRET_NAME`
- Rotate periodically (recommended: 90 days)

### Production Secrets Rotation

1. Generate new secret value
2. Update in Replit Secrets panel
3. Restart application
4. Verify functionality
5. Invalidate old sessions if needed

## Service Architecture

### Abstraction Layer

The service factory pattern enables security improvements without frontend changes:

```typescript
// Current: Mock services with AsyncStorage
const authService = serviceFactory.getAuthService();

// Future: API services with proper backend
// Just update ServiceFactory to return ApiAuthService
```

### Migration Path to Production

1. Deploy backend API using `server/db/schema.sql`
2. Create `ApiAuthService` implementing `IAuthService`
3. Update `ServiceFactory.setProvider('api')`
4. Configure `AppConfiguration.api.baseUrl`
5. Store API tokens in SecureStore

## Incident Response

### Security Incident Types

1. **Unauthorized Access**: User reports suspicious activity
2. **Data Breach**: Potential exposure of user data
3. **Brute Force Attack**: Multiple failed login attempts
4. **Session Hijacking**: Token theft or reuse

### Response Procedures

1. **Identify**: Check error logs and rate limiter stats
2. **Contain**: Disable affected accounts/features
3. **Eradicate**: Fix vulnerability, rotate secrets
4. **Recover**: Restore service, notify affected users
5. **Document**: Update this documentation

### Emergency Contacts

- Technical Lead: [Configure in Replit]
- Security Team: [Configure in Replit]

## Compliance Notes

### Data Storage

- User data stored in AsyncStorage (local) or PostgreSQL (production)
- Passwords never stored in plain text
- Sensitive tokens use SecureStore when available

### Privacy

- Minimal data collection
- Location data only with user permission
- No third-party analytics without consent

## Checklist: Production Deployment

- [ ] All secrets configured in production environment
- [ ] DATABASE_URL points to production PostgreSQL
- [ ] Auto-login disabled (already done)
- [ ] Rate limiting configured
- [ ] Error logging to external service (optional)
- [ ] SSL/TLS enabled for API calls
- [ ] Session token rotation implemented
- [ ] Backup strategy for database
- [ ] Monitoring and alerting configured

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11 | Initial security documentation |
