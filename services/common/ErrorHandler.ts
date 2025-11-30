/**
 * LidaCacau - Error Handler
 * 
 * Sistema centralizado de tratamento de erros com:
 * - Tipagem forte para categorias e severidade
 * - Logger colorido com buffer de memoria
 * - Mensagens amigaveis em Portugues
 * - Logica de retry com backoff exponencial
 * - Handler seguro para async operations
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorCategory = 'network' | 'auth' | 'validation' | 'storage' | 'unknown';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> & { shouldRetry: (error: Error) => boolean } = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Sem conexao com a internet. Verifique sua rede.',
  NETWORK_TIMEOUT: 'A conexao demorou muito. Tente novamente.',
  AUTH_INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  AUTH_EMAIL_EXISTS: 'Este email ja esta cadastrado.',
  AUTH_SESSION_EXPIRED: 'Sua sessao expirou. Faca login novamente.',
  AUTH_UNAUTHORIZED: 'Voce nao tem permissao para esta acao.',
  AUTH_NOT_FOUND: 'Usuario nao encontrado.',
  STORAGE_FULL: 'Armazenamento cheio. Libere espaco no dispositivo.',
  STORAGE_READ_ERROR: 'Erro ao ler dados. Tente novamente.',
  STORAGE_WRITE_ERROR: 'Erro ao salvar dados. Tente novamente.',
  VALIDATION_REQUIRED: 'Este campo e obrigatorio.',
  VALIDATION_INVALID_EMAIL: 'Email invalido.',
  VALIDATION_INVALID_PASSWORD: 'Senha deve ter no minimo 6 caracteres.',
  VALIDATION_INVALID_PHONE: 'Telefone invalido.',
  VALIDATION_INVALID_CPF: 'CPF invalido.',
  NOT_FOUND: 'Item nao encontrado.',
  CONFLICT: 'Este item ja existe.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  GENERIC_ERROR: 'Algo deu errado. Tente novamente.',
};

const MAX_ERROR_BUFFER = 100;
const errorBuffer: AppError[] = [];

const SEVERITY_COLORS = {
  info: '\x1b[36m',
  warning: '\x1b[33m',
  error: '\x1b[31m',
  critical: '\x1b[35m',
};

const RESET_COLOR = '\x1b[0m';

function getColoredPrefix(severity: ErrorSeverity): string {
  return `${SEVERITY_COLORS[severity]}[${severity.toUpperCase()}]${RESET_COLOR}`;
}

function addToBuffer(error: AppError): void {
  errorBuffer.push(error);
  if (errorBuffer.length > MAX_ERROR_BUFFER) {
    errorBuffer.shift();
  }
}

export function getUserMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.GENERIC_ERROR;
}

export function createAppError(
  code: string,
  message: string,
  category: ErrorCategory = 'unknown',
  severity: ErrorSeverity = 'error',
  context?: Record<string, unknown>
): AppError {
  return {
    code,
    message,
    userMessage: getUserMessage(code),
    severity,
    category,
    timestamp: new Date().toISOString(),
    context,
  };
}

export function logError(error: AppError): void {
  addToBuffer(error);
  
  if (__DEV__) {
    const prefix = getColoredPrefix(error.severity);
    console.log(
      `${prefix} [${error.category}] ${error.code}: ${error.message}`,
      error.context ? `\nContext: ${JSON.stringify(error.context, null, 2)}` : ''
    );
  }
}

export function logWarning(message: string, context?: Record<string, unknown>): void {
  const error = createAppError(
    'WARNING',
    message,
    'unknown',
    'warning',
    context
  );
  addToBuffer(error);
  
  if (__DEV__) {
    const prefix = getColoredPrefix('warning');
    console.log(
      `${prefix} ${message}`,
      context ? `\nContext: ${JSON.stringify(context, null, 2)}` : ''
    );
  }
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  const error = createAppError(
    'INFO',
    message,
    'unknown',
    'info',
    context
  );
  addToBuffer(error);
  
  if (__DEV__) {
    const prefix = getColoredPrefix('info');
    console.log(
      `${prefix} ${message}`,
      context ? `\nContext: ${JSON.stringify(context, null, 2)}` : ''
    );
  }
}

export function getErrorLog(): AppError[] {
  return [...errorBuffer];
}

export function clearErrorLog(): void {
  errorBuffer.length = 0;
}

export function getRecentErrors(count: number = 10): AppError[] {
  return errorBuffer
    .filter((e) => e.severity === 'error' || e.severity === 'critical')
    .slice(-count);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  let currentDelay = opts.delayMs;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const shouldRetry = opts.shouldRetry(lastError);
      const isLastAttempt = attempt === opts.maxAttempts;
      
      if (!shouldRetry || isLastAttempt) {
        logError(createAppError(
          'RETRY_FAILED',
          `Operation failed after ${attempt} attempt(s): ${lastError.message}`,
          'unknown',
          'error',
          { attempt, maxAttempts: opts.maxAttempts }
        ));
        throw lastError;
      }
      
      logWarning(`Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${currentDelay}ms...`, {
        error: lastError.message,
        nextDelay: currentDelay,
      });
      
      await sleep(currentDelay);
      currentDelay *= opts.backoffMultiplier;
    }
  }
  
  throw lastError || new Error('Retry failed with unknown error');
}

export async function createSafeHandler<T>(
  fn: () => Promise<T>,
  errorContext?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    logError(createAppError(
      errorCode,
      errorMessage,
      'unknown',
      'error',
      { ...errorContext, originalError: errorMessage }
    ));
    
    return null;
  }
}

export function categorizeError(error: Error | string): ErrorCategory {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
    return 'network';
  }
  if (lowerMessage.includes('auth') || lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('session')) {
    return 'auth';
  }
  if (lowerMessage.includes('valid') || lowerMessage.includes('required') || lowerMessage.includes('format')) {
    return 'validation';
  }
  if (lowerMessage.includes('storage') || lowerMessage.includes('async') || lowerMessage.includes('save') || lowerMessage.includes('load')) {
    return 'storage';
  }
  
  return 'unknown';
}

export function isNetworkError(error: Error): boolean {
  return categorizeError(error) === 'network';
}

export function isRetryableError(error: Error): boolean {
  const category = categorizeError(error);
  return category === 'network' || category === 'storage';
}

export const errorHandler = {
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
  ERROR_MESSAGES,
};

export default errorHandler;
