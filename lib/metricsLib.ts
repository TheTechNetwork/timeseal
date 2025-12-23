// Metrics Collection Library

export interface MetricValue {
  count: number;
  lastUpdated: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  [key: string]: MetricValue | number;
}

export interface MetricsConfig {
  enableRates?: boolean;
  rateWindow?: number; // milliseconds
}

export class MetricsCollector {
  private metrics = new Map<string, MetricValue>();
  private startTime = Date.now();
  private config: Required<MetricsConfig>;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      enableRates: config.enableRates ?? true,
      rateWindow: config.rateWindow ?? 3600000, // 1 hour
    };
  }

  increment(key: string, amount: number = 1): void {
    const current = this.metrics.get(key) || { count: 0, lastUpdated: Date.now() };
    this.metrics.set(key, {
      count: current.count + amount,
      lastUpdated: Date.now(),
    });
  }

  decrement(key: string, amount: number = 1): void {
    this.increment(key, -amount);
  }

  set(key: string, value: number): void {
    this.metrics.set(key, {
      count: value,
      lastUpdated: Date.now(),
    });
  }

  get(key: string): number {
    return this.metrics.get(key)?.count ?? 0;
  }

  getSnapshot(): MetricsSnapshot {
    const snapshot: any = { timestamp: Date.now() };
    
    for (const [key, value] of Array.from(this.metrics.entries())) {
      snapshot[key] = { ...value };
    }

    return snapshot;
  }

  getWithRates(): Record<string, any> {
    const snapshot = this.getSnapshot();
    const uptime = Date.now() - this.startTime;

    if (!this.config.enableRates) {
      return snapshot;
    }

    const rates: Record<string, number> = {};
    for (const [key, value] of Object.entries(snapshot)) {
      if (key !== 'timestamp' && typeof value === 'object' && 'count' in value) {
        rates[`${key}PerHour`] = (value.count / uptime) * this.config.rateWindow;
      }
    }

    return {
      ...snapshot,
      uptime,
      rates,
    };
  }

  reset(key?: string): void {
    if (key) {
      this.metrics.delete(key);
    } else {
      this.metrics.clear();
      this.startTime = Date.now();
    }
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  toJSON(): string {
    return JSON.stringify(this.getWithRates());
  }
}

// Predefined metric keys for type safety
export const MetricKeys = {
  SEALS_CREATED: 'sealsCreated',
  SEALS_UNLOCKED: 'sealsUnlocked',
  SEALS_ACCESSED: 'sealsAccessed',
  PULSES_RECEIVED: 'pulsesReceived',
  FAILED_UNLOCKS: 'failedUnlocks',
  RATE_LIMIT_HITS: 'rateLimitHits',
  ERRORS: 'errors',
} as const;

// Singleton instance
export const metrics = new MetricsCollector();

// Helper functions
export function trackSealCreated(): void {
  metrics.increment(MetricKeys.SEALS_CREATED);
}

export function trackSealUnlocked(): void {
  metrics.increment(MetricKeys.SEALS_UNLOCKED);
}

export function trackSealAccessed(): void {
  metrics.increment(MetricKeys.SEALS_ACCESSED);
}

export function trackPulseReceived(): void {
  metrics.increment(MetricKeys.PULSES_RECEIVED);
}

export function trackFailedUnlock(): void {
  metrics.increment(MetricKeys.FAILED_UNLOCKS);
}

export function trackRateLimitHit(): void {
  metrics.increment(MetricKeys.RATE_LIMIT_HITS);
}

export function trackError(): void {
  metrics.increment(MetricKeys.ERRORS);
}
