// Resilience Patterns Library (Circuit Breaker, Retry, Timeout)

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponential?: boolean;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.threshold = config.threshold ?? 5;
    this.timeout = config.timeout ?? 60000;
    this.resetTimeout = config.resetTimeout ?? 30000;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await withTimeout(operation(), this.timeout);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | number;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timeout')), ms);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponential = true,
  } = config;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = exponential
          ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
          : baseDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export function createResilientOperation<T>(
  operation: () => Promise<T>,
  circuitBreaker?: CircuitBreaker,
  retryConfig?: RetryConfig
): () => Promise<T> {
  return async () => {
    const execute = async () => {
      if (circuitBreaker) {
        return circuitBreaker.execute(operation);
      }
      return operation();
    };

    if (retryConfig) {
      return withRetry(execute, retryConfig);
    }

    return execute();
  };
}
