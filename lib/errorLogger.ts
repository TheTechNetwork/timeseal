// Enhanced Error Logging Utility
export interface ErrorLogContext {
  component?: string;
  action?: string;
  userId?: string;
  sealId?: string;
  [key: string]: any;
}

export class ErrorLogger {
  private static isDev = process.env.NODE_ENV !== 'production';

  static log(error: unknown, context?: ErrorLogContext): void {
    const timestamp = new Date().toISOString();
    const errorInfo = this.extractErrorInfo(error);
    
    const logEntry = {
      timestamp,
      level: 'ERROR',
      ...context,
      error: errorInfo,
    };

    // Console output with formatting
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`🔴 ERROR [${timestamp}]`);
    if (context?.component) console.error(`📦 Component: ${context.component}`);
    if (context?.action) console.error(`⚡ Action: ${context.action}`);
    console.error(`💥 Message: ${errorInfo.message}`);
    if (errorInfo.code) console.error(`🔢 Code: ${errorInfo.code}`);
    if (this.isDev && errorInfo.stack) {
      console.error(`📚 Stack Trace:\n${errorInfo.stack}`);
    }
    if (context) {
      const contextWithoutStandard = { ...context };
      delete contextWithoutStandard.component;
      delete contextWithoutStandard.action;
      if (Object.keys(contextWithoutStandard).length > 0) {
        console.error(`📋 Context:`, contextWithoutStandard);
      }
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Structured JSON for log aggregation
    if (this.isDev) {
      console.error('[ERROR_JSON]', JSON.stringify(logEntry));
    }
  }

  private static extractErrorInfo(error: unknown): {
    message: string;
    code?: string;
    stack?: string;
    type: string;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      return {
        message: err.message || err.error || JSON.stringify(error),
        code: err.code,
        stack: err.stack,
        type: 'Object',
      };
    }

    return {
      message: String(error),
      type: typeof error,
    };
  }

  static info(message: string, context?: ErrorLogContext): void {
    if (this.isDev) {
      console.log(`ℹ️  [INFO] ${message}`, context || '');
    }
  }

  static warn(message: string, context?: ErrorLogContext): void {
    console.warn(`⚠️  [WARN] ${message}`, context || '');
  }
}
