# Easy Security Enhancements for TimeSeal

## Quick Wins (Easy to Implement)

### 1. ✅ IMPLEMENTED - Seal ID Length Validation
**Status**: Already secure (16-byte random IDs)

### 2. ⚠️ MISSING - Request Size Limits
**Risk**: Large requests could cause DoS
**Implementation**: 2 lines of code

```typescript
// lib/validation.ts
export function validateRequestSize(contentLength: number): ValidationResult {
  const MAX_REQUEST_SIZE = 30 * 1024 * 1024; // 30MB (25MB file + overhead)
  if (contentLength > MAX_REQUEST_SIZE) {
    return { valid: false, error: 'Request too large' };
  }
  return { valid: true };
}
```

**Usage in API routes**:
```typescript
const contentLength = parseInt(request.headers.get('content-length') || '0');
if (!validateRequestSize(contentLength).valid) {
  return jsonResponse({ error: 'Request too large' }, { status: 413 });
}
```

---

### 3. ⚠️ MISSING - Seal ID Format Validation
**Risk**: Invalid seal IDs could cause database errors
**Implementation**: 3 lines of code

```typescript
// lib/validation.ts
export function validateSealId(sealId: string): ValidationResult {
  if (!/^[a-f0-9]{32}$/.test(sealId)) {
    return { valid: false, error: 'Invalid seal ID format' };
  }
  return { valid: true };
}
```

---

### 4. ⚠️ MISSING - Key Format Validation
**Risk**: Malformed keys could cause crypto errors
**Implementation**: 5 lines of code

```typescript
// lib/validation.ts
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
```

---

### 5. ⚠️ MISSING - Timestamp Validation
**Risk**: Far-future timestamps could cause integer overflow
**Implementation**: 4 lines of code

```typescript
// lib/validation.ts
export function validateTimestamp(timestamp: number): ValidationResult {
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    return { valid: false, error: 'Invalid timestamp' };
  }
  if (timestamp > Date.now() + (100 * 365 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Timestamp too far in future (max 100 years)' };
  }
  return { valid: true };
}
```

---

### 6. ⚠️ MISSING - User-Agent Logging
**Risk**: Hard to detect bot attacks without UA tracking
**Implementation**: 1 line of code

```typescript
// lib/logger.ts - Add to audit logs
const userAgent = request.headers.get('user-agent') || 'unknown';
```

---

### 7. ⚠️ MISSING - IP Validation
**Risk**: Spoofed IPs could bypass rate limiting
**Implementation**: 5 lines of code

```typescript
// lib/security.ts
export function validateIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  // Basic IPv4/IPv6 validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i;
  return ipv4.test(ip) || ipv6.test(ip);
}
```

---

### 8. ⚠️ MISSING - Content-Type Header Enforcement
**Risk**: API accepts any content type
**Implementation**: Already exists but not enforced in all routes

```typescript
// Add to all POST routes
if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
  return jsonResponse({ error: 'Invalid content type' }, { status: 415 });
}
```

---

### 9. ⚠️ MISSING - Pulse Token Expiry
**Risk**: Pulse tokens never expire
**Implementation**: Already has 5-minute window, but should be documented

**Current**: Token validation checks 5-minute window ✅
**Enhancement**: Add explicit expiry field in token

---

### 10. ⚠️ MISSING - Database Query Timeouts
**Risk**: Slow queries could cause DoS
**Implementation**: Cloudflare D1 has built-in timeouts, but add explicit limits

```typescript
// lib/database.ts
const QUERY_TIMEOUT = 5000; // 5 seconds
// D1 automatically times out, but we can add application-level timeout
```

---

## Medium Effort Enhancements

### 11. Honeypot Seals
**Purpose**: Detect seal ID enumeration attacks
**Implementation**: 20 lines of code

```typescript
// Create fake seals with known IDs
const HONEYPOT_IDS = ['00000000000000000000000000000000', 'ffffffffffffffffffffffffffffffff'];

export function isHoneypot(sealId: string): boolean {
  return HONEYPOT_IDS.includes(sealId);
}

// In API route
if (isHoneypot(sealId)) {
  logger.warn('honeypot_accessed', { ip, sealId });
  // Return fake "locked" response to waste attacker's time
  return jsonResponse({ isLocked: true, unlockTime: Date.now() + 999999999 });
}
```

---

### 12. Geolocation-Based Anomaly Detection
**Purpose**: Detect suspicious access patterns
**Implementation**: Use Cloudflare's CF-IPCountry header

```typescript
const country = request.headers.get('cf-ipcountry');
if (country && ['XX', 'T1'].includes(country)) {
  // Tor or unknown country
  logger.warn('suspicious_country', { ip, country });
}
```

---

### 13. Failed Access Attempt Tracking
**Purpose**: Detect brute force on seal IDs
**Implementation**: 15 lines of code

```typescript
class FailedAccessTracker {
  private attempts = new Map<string, number>();
  
  track(ip: string): boolean {
    const count = (this.attempts.get(ip) || 0) + 1;
    this.attempts.set(ip, count);
    
    if (count > 10) { // 10 failed attempts
      return false; // Block
    }
    return true;
  }
}
```

---

### 14. Seal Creation Limits Per IP
**Purpose**: Prevent spam seal creation
**Implementation**: Extend existing rate limiter

```typescript
// Already have rate limiting, but add daily limit
const DAILY_SEAL_LIMIT = 100;
// Track in separate rate limiter with 24h window
```

---

### 15. Encrypted Blob Integrity Check
**Purpose**: Detect blob corruption or tampering
**Implementation**: Add HMAC to encrypted blobs (already done via AEAD)

**Status**: ✅ Already protected by AES-GCM authentication tag

---

## Priority Implementation Order

### Immediate (< 1 hour):
1. ✅ Request size validation
2. ✅ Seal ID format validation  
3. ✅ Key format validation
4. ✅ Timestamp validation

### Short-term (< 1 day):
5. ✅ User-Agent logging
6. ✅ IP validation
7. ✅ Content-Type enforcement
8. ✅ Honeypot seals

### Medium-term (< 1 week):
9. ✅ Failed access tracking
10. ✅ Geolocation anomaly detection
11. ✅ Daily seal creation limits

---

## Implementation Checklist

```typescript
// lib/validation.ts - Add these functions
export function validateRequestSize(contentLength: number): ValidationResult
export function validateSealId(sealId: string): ValidationResult
export function validateKey(key: string, name: string): ValidationResult
export function validateTimestamp(timestamp: number): ValidationResult

// lib/security.ts - Add these functions
export function validateIP(ip: string): boolean
export function isHoneypot(sealId: string): boolean

// lib/logger.ts - Add user-agent to logs
const userAgent = request.headers.get('user-agent') || 'unknown';

// app/api/create-seal/route.ts - Add validations
validateRequestSize(contentLength)
validateKey(keyB, 'Key B')
validateKey(iv, 'IV')
validateTimestamp(unlockTime)

// app/api/seal/[id]/route.ts - Add validations
validateSealId(sealId)
isHoneypot(sealId) // Return fake response

// All POST routes - Enforce content-type
if (!request.headers.get('content-type')?.includes('expected-type')) {
  return 415 error
}
```

---

## Estimated Impact

| Enhancement | Effort | Security Gain | Priority |
|-------------|--------|---------------|----------|
| Request size validation | 5 min | Medium | High |
| Seal ID validation | 5 min | High | High |
| Key validation | 10 min | High | High |
| Timestamp validation | 5 min | Medium | High |
| User-Agent logging | 2 min | Low | Medium |
| IP validation | 10 min | Medium | Medium |
| Content-Type enforcement | 5 min | Low | Medium |
| Honeypot seals | 30 min | Medium | Low |
| Failed access tracking | 20 min | Medium | Low |
| Geolocation detection | 15 min | Low | Low |

**Total implementation time for high-priority items: ~35 minutes**

---

## Testing

```bash
# Test invalid seal ID
curl https://timeseal.dev/api/seal/invalid

# Test oversized request
curl -X POST https://timeseal.dev/api/create-seal \
  -F "encryptedBlob=@huge-file.bin"

# Test invalid key format
curl -X POST https://timeseal.dev/api/create-seal \
  -F "keyB=not-base64!!!"

# Test honeypot
curl https://timeseal.dev/api/seal/00000000000000000000000000000000
```

---

## Monitoring

After implementation, monitor:
- Number of validation failures per endpoint
- Honeypot access attempts
- Failed access patterns by IP
- Unusual geolocation patterns
- Request size distribution

Add to metrics:
```typescript
metrics.incrementValidationFailure(type: string)
metrics.incrementHoneypotAccess()
metrics.incrementFailedAccess(ip: string)
```
