// Input Validation
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = Number.parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
const MAX_DURATION_DAYS = Number.parseInt(process.env.MAX_SEAL_DURATION_DAYS || '365');
const MIN_UNLOCK_DELAY = 60 * 1000; // 1 minute
const MAX_REQUEST_SIZE = 30 * 1024 * 1024; // 30MB (25MB file + overhead)

export function validateRequestSize(contentLength: number): ValidationResult {
  if (contentLength > MAX_REQUEST_SIZE) {
    return { valid: false, error: 'Request too large' };
  }
  return { valid: true };
}

export function validateSealId(sealId: string): ValidationResult {
  if (!/^[a-f0-9]{32}$/.test(sealId)) {
    return { valid: false, error: 'Invalid seal ID format' };
  }
  return { valid: true };
}

export function validateKey(key: string, name: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: `${name} is required` };
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(key)) {
    return { valid: false, error: `${name} must be base64 encoded` };
  }
  if (key.length < 32 || key.length > 100) {
    return { valid: false, error: `${name} has invalid length` };
  }
  return { valid: true };
}

export function validateTimestamp(timestamp: number): ValidationResult {
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    return { valid: false, error: 'Invalid timestamp' };
  }
  const maxFuture = Date.now() + (100 * 365 * 24 * 60 * 60 * 1000); // 100 years
  if (timestamp > maxFuture) {
    return { valid: false, error: 'Timestamp too far in future' };
  }
  return { valid: true };
}

export function validateFileSize(size: number): ValidationResult {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

export function validateUnlockTime(unlockTime: number): ValidationResult {
  const now = Date.now();

  if (unlockTime <= now + MIN_UNLOCK_DELAY) {
    return {
      valid: false,
      error: 'Unlock time must be at least 1 minute in the future',
    };
  }

  const maxUnlockTime = now + MAX_DURATION_DAYS * 24 * 60 * 60 * 1000;
  if (unlockTime > maxUnlockTime) {
    return {
      valid: false,
      error: `Unlock time cannot exceed ${MAX_DURATION_DAYS} days`,
    };
  }

  return { valid: true };
}

export function validatePulseInterval(interval: number): ValidationResult {
  const minInterval = 3600 * 1000; // 1 hour in ms
  const maxInterval = 90 * 24 * 3600 * 1000; // 90 days in ms

  if (interval < minInterval) {
    return { valid: false, error: 'Pulse interval must be at least 1 hour' };
  }

  if (interval > maxInterval) {
    return { valid: false, error: 'Pulse interval cannot exceed 90 days' };
  }

  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}
