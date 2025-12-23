// Time Utilities Library

export interface TimeComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface FormatOptions {
  includeMilliseconds?: boolean;
  short?: boolean;
  compact?: boolean;
}

export function parseMilliseconds(ms: number): TimeComponents {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = ms % 1000;

  return { days, hours, minutes, seconds, milliseconds };
}

export function formatDuration(ms: number, options: FormatOptions = {}): string {
  const { short = false, compact = false, includeMilliseconds = false } = options;
  const { days, hours, minutes, seconds, milliseconds } = parseMilliseconds(ms);

  if (compact) {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  const parts: string[] = [];

  if (days > 0) parts.push(short ? `${days}d` : `${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(short ? `${hours}h` : `${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(short ? `${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) {
    parts.push(short ? `${seconds}s` : `${seconds} second${seconds !== 1 ? 's' : ''}`);
  }
  if (includeMilliseconds && milliseconds > 0) {
    parts.push(short ? `${milliseconds}ms` : `${milliseconds} millisecond${milliseconds !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

export function formatTime(ms: number): string {
  return formatDuration(ms, { short: true });
}

export function formatTimeShort(ms: number): string {
  const { days, hours, minutes } = parseMilliseconds(ms);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTimestamp(timestamp: number, format: 'iso' | 'locale' | 'relative' = 'iso'): string {
  const date = new Date(timestamp);

  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'locale':
      return date.toLocaleString();
    case 'relative':
      return formatRelativeTime(timestamp);
    default:
      return date.toISOString();
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);

  if (absDiff < 60000) return 'just now';
  if (absDiff < 3600000) return `${Math.floor(absDiff / 60000)} minutes ago`;
  if (absDiff < 86400000) return `${Math.floor(absDiff / 3600000)} hours ago`;
  if (absDiff < 604800000) return `${Math.floor(absDiff / 86400000)} days ago`;
  
  return formatTimestamp(timestamp, 'locale');
}

export function getTimeRemaining(unlockTime: number): number {
  return Math.max(0, unlockTime - Date.now());
}

export function isUnlocked(unlockTime: number): boolean {
  return Date.now() >= unlockTime;
}

export function addDuration(timestamp: number, duration: { days?: number; hours?: number; minutes?: number; seconds?: number }): number {
  const ms = 
    (duration.days ?? 0) * 24 * 60 * 60 * 1000 +
    (duration.hours ?? 0) * 60 * 60 * 1000 +
    (duration.minutes ?? 0) * 60 * 1000 +
    (duration.seconds ?? 0) * 1000;
  
  return timestamp + ms;
}

export class CountdownTimer {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(remaining: number) => void> = new Set();
  private unlockCallbacks: Set<() => void> = new Set();

  constructor(private unlockTime: number) {}

  start(interval: number = 1000): void {
    if (this.intervalId) return;

    this.tick();
    this.intervalId = setInterval(() => this.tick(), interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const remaining = getTimeRemaining(this.unlockTime);
    
    this.callbacks.forEach(cb => cb(remaining));

    if (remaining === 0) {
      this.unlockCallbacks.forEach(cb => cb());
      this.stop();
    }
  }

  onChange(callback: (remaining: number) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  onUnlock(callback: () => void): () => void {
    this.unlockCallbacks.add(callback);
    return () => this.unlockCallbacks.delete(callback);
  }

  getRemaining(): number {
    return getTimeRemaining(this.unlockTime);
  }

  isUnlocked(): boolean {
    return isUnlocked(this.unlockTime);
  }
}
