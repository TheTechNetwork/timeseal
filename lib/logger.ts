// Structured Logging for Audit Trails
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  AUDIT = 'audit',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  sealId?: string;
  userId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private log(entry: LogEntry): void {
    if (process.env.ENABLE_AUDIT_LOGS === 'false' && entry.level === LogLevel.AUDIT) {
      return;
    }
    console.log(JSON.stringify(entry));
  }

  audit(event: string, data: Partial<LogEntry>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.AUDIT,
      event,
      ...data,
    });
  }

  info(event: string, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      event,
      metadata,
    });
  }

  error(event: string, error: Error, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      event,
      metadata: {
        ...metadata,
        error: error.message,
        stack: error.stack,
      },
    });
  }

  warn(event: string, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      event,
      metadata,
    });
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
);

// Audit event helpers
export function auditSealCreated(sealId: string, ip: string, isDMS: boolean): void {
  logger.audit('seal_created', {
    sealId,
    ip,
    metadata: { isDMS },
  });
}

export function auditSealAccessed(sealId: string, ip: string, status: 'locked' | 'unlocked'): void {
  logger.audit('seal_accessed', {
    sealId,
    ip,
    metadata: { status },
  });
}

export function auditPulseReceived(sealId: string, ip: string): void {
  logger.audit('pulse_received', {
    sealId,
    ip,
  });
}
