const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 100;

function createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function addToHistory(entry: LogEntry) {
  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
}

export const logger = {
  debug(message: string, data?: unknown) {
    if (isDev) {
      const entry = createLogEntry('debug', message, data);
      addToHistory(entry);
      console.log(`[DEBUG] ${message}`, data ?? '');
    }
  },

  info(message: string, data?: unknown) {
    if (isDev) {
      const entry = createLogEntry('info', message, data);
      addToHistory(entry);
      console.log(`[INFO] ${message}`, data ?? '');
    }
  },

  warn(message: string, data?: unknown) {
    const entry = createLogEntry('warn', message, data);
    addToHistory(entry);
    if (isDev) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  },

  error(message: string, error?: unknown) {
    const entry = createLogEntry('error', message, error);
    addToHistory(entry);
    if (isDev) {
      console.error(`[ERROR] ${message}`, error ?? '');
    }
  },

  getHistory(): LogEntry[] {
    return [...logHistory];
  },

  clearHistory() {
    logHistory.length = 0;
  },

  getLastErrors(count = 10): LogEntry[] {
    return logHistory
      .filter((entry) => entry.level === 'error')
      .slice(-count);
  },
};

export default logger;
