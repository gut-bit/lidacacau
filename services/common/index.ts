/**
 * LidaCacau - Common Exports
 */

export * from './types';
export { storageAdapter, StorageKeys, AsyncStorageAdapter } from './AsyncStorageAdapter';
export { secureStorageAdapter, SecureStorageKeys, type SecureStorageKey } from './SecureStorageAdapter';
export { sessionManager, type Session } from './SessionManager';
export { ApiAdapter, getApiAdapter, initializeApiAdapter, type ApiConfig } from './ApiAdapter';
export { hashPassword, verifyPassword, isPasswordHashed } from './PasswordUtils';
export {
  type ValidationResult,
  isValidEmail,
  validateEmail,
  isValidPassword,
  validatePassword,
  isValidPhone,
  validatePhone,
  formatPhone,
  isValidCPF,
  validateCPF,
  formatCPF,
  isValidName,
  validateName,
  sanitizeInput,
  isNotEmpty,
} from './ValidationUtils';
export {
  type ErrorSeverity,
  type ErrorCategory,
  type AppError,
  type RetryOptions,
  ERROR_MESSAGES,
  logError,
  logWarning,
  logInfo,
  getErrorLog,
  clearErrorLog,
  getRecentErrors,
  createAppError,
  getUserMessage,
  withRetry,
  createSafeHandler,
  categorizeError,
  isNetworkError,
  isRetryableError,
  errorHandler,
} from './ErrorHandler';
export {
  type RateLimiterConfig,
  type RateLimitStatus,
  type CanMakeRequestResult,
  RateLimiter,
  apiLimiter,
  authLimiter,
  storageLimiter,
  withRateLimit,
} from './RateLimiter';
