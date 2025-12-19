// Metrics Collection
interface Metrics {
  sealsCreated: number;
  sealsUnlocked: number;
  pulsesReceived: number;
  failedUnlocks: number;
  lastReset: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    sealsCreated: 0,
    sealsUnlocked: 0,
    pulsesReceived: 0,
    failedUnlocks: 0,
    lastReset: Date.now(),
  };

  incrementSealCreated(): void {
    this.metrics.sealsCreated++;
  }

  incrementSealUnlocked(): void {
    this.metrics.sealsUnlocked++;
  }

  incrementPulseReceived(): void {
    this.metrics.pulsesReceived++;
  }

  incrementFailedUnlock(): void {
    this.metrics.failedUnlocks++;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      sealsCreated: 0,
      sealsUnlocked: 0,
      pulsesReceived: 0,
      failedUnlocks: 0,
      lastReset: Date.now(),
    };
  }
}

export const metrics = new MetricsCollector();

// Metrics endpoint handler
export function handleMetricsRequest(): Response {
  const data = metrics.getMetrics();
  const uptime = Date.now() - data.lastReset;
  
  return new Response(
    JSON.stringify({
      ...data,
      uptimeMs: uptime,
      rates: {
        sealsPerHour: (data.sealsCreated / uptime) * 3600000,
        unlocksPerHour: (data.sealsUnlocked / uptime) * 3600000,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
