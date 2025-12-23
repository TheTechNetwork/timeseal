// Unified Logging Library
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  AUDIT = 'audit',
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

export interface LoggerConfig {
  minLevel?: LogLevel;
  redactPaths?: string[];
  enableAudit?: boolean;
  isDev?: boolean;
}

export class UnifiedLogger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel ?? LogLevel.INFO,
      redactPaths: config.redactPaths ?? [],
      enableAudit: config.enableAudit ?? true,
      isDev: config.isDev ?? process.env.NODE_ENV !== 'production',
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.AUDIT];
    return levels.indexOf(level) >= levels.indexOf(this.config.minLevel);
  }

  private redact(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const redacted = { ...data };
    for (const path of this.config.redactPaths) {
      if (path in redacted) {
        redacted[path] = '[REDACTED]';
      }
    }
    return redacted;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;
    if (level === LogLevel.AUDIT && !this.config.enableAudit) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.redact(context) : undefined,
    };

    console.log(JSON.stringify(entry));
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message,
      stack: this.config.isDev ? error?.stack : undefined,
    });
  }

  audit(event: string, context?: LogContext): void {
    this.log(LogLevel.AUDIT, event, context);
  }

  child(childContext: LogContext): UnifiedLogger {
    // Create child logger with inherited context
    const child = new UnifiedLogger(this.config);
    const originalLog = child.log.bind(child);
    child.log = (level, message, context) => {
      originalLog(level, message, { ...childContext, ...context });
    };
    return child;
  }
}

// Factory function
export function createLogger(config?: LoggerConfig): UnifiedLogger {
  return new UnifiedLogger(config);
}

// Default logger instance
export const logger = createLogger({
  redactPaths: ['keyA', 'keyB', 'encryptedBlob', 'MASTER_ENCRYPTION_KEY', 'password', 'secret'],
});
