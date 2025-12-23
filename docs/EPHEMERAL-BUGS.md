# Ephemeral Seals - Bug Report

## 🐛 Critical Bugs Found

### 1. **Type Casting Violation in recordViewAndCheck** (CRITICAL)
**File:** `lib/ephemeral.ts:127`
**Issue:** Unsafe type casting breaks abstraction layer
```typescript
await (db as any).db.prepare(`
  UPDATE seals 
  SET view_count = ?,
      first_viewed_at = COALESCE(first_viewed_at, ?),
      first_viewer_fingerprint = COALESCE(first_viewer_fingerprint, ?)
  WHERE id = ?
`).bind(newViewCount, now, fingerprint, sealId).run();
```

**Problem:**
- Assumes `db` has `.db` property (only true for `SealDatabase`)
- Breaks with `MockDatabase` (no `.db` property)
- Violates `DatabaseProvider` interface abstraction
- Will crash in tests and development

**Impact:** HIGH - Tests will fail, MockDatabase unusable

**Fix:** Add method to `DatabaseProvider` interface

---

### 2. **Race Condition in View Counting** (HIGH)
**File:** `lib/ephemeral.ts:115-127`
**Issue:** Non-atomic read-modify-write operation

**Flow:**
1. Read `currentViewCount` from seal
2. Calculate `newViewCount = currentViewCount + 1`
3. Write `newViewCount` to database

**Problem:**
```
Thread A: Read viewCount=0
Thread B: Read viewCount=0
Thread A: Write viewCount=1
Thread B: Write viewCount=1  ← Should be 2!
```

**Impact:** HIGH - Multiple concurrent viewers can bypass maxViews limit

**Fix:** Use SQL `view_count = view_count + 1` instead of passing value

---

### 3. **Missing Blob Deletion on Exhaustion** (MEDIUM)
**File:** `lib/sealService.ts:336-345`
**Issue:** Only deletes database record, not blob storage

```typescript
if (viewCheck.shouldDelete) {
  await deleteIfExhausted(
    this.db,
    sealId,
    seal.isEphemeral || false,
    viewCheck.viewCount,
    viewCheck.maxViews,
  );
  // ❌ Blob still exists in storage!
}
```

**Problem:**
- Database record deleted
- Blob remains in storage (orphaned)
- Wastes storage space
- Potential data leak (blob accessible if ID known)

**Impact:** MEDIUM - Storage bloat, potential security issue

**Fix:** Delete blob before/after database deletion

---

### 4. **Inconsistent Access Count Tracking** (MEDIUM)
**File:** `lib/sealService.ts:323-325`
**Issue:** Ephemeral seals don't increment `accessCount`

```typescript
// Only increment access count on unlock (already done in recordViewAndCheck for ephemeral)
if (!seal.isEphemeral) {
  await this.db.incrementAccessCount(sealId);
}
```

**Problem:**
- Comment says "already done in recordViewAndCheck"
- But `recordViewAndCheck` only updates `view_count`, NOT `access_count`
- Ephemeral seals will always show `accessCount: 0`
- Breaks analytics/metrics

**Impact:** MEDIUM - Incorrect metrics, broken analytics

**Fix:** Either increment `accessCount` for ephemeral OR clarify they use `viewCount` instead

---

### 5. **Missing Error Handling in recordViewAndCheck** (MEDIUM)
**File:** `lib/ephemeral.ts:127`
**Issue:** SQL update can fail silently

```typescript
await (db as any).db.prepare(`...`).bind(...).run();
// ❌ No error checking
```

**Problem:**
- If UPDATE fails, function returns success
- View count not incremented but user gets access
- Can bypass maxViews limit

**Impact:** MEDIUM - Security bypass possible

**Fix:** Check `.run()` result for success

---

### 6. **Fingerprint Collision Risk** (LOW)
**File:** `lib/ephemeral.ts:51-59`
**Issue:** Fingerprint uses only 3 headers

```typescript
const ip = request.headers.get('cf-connecting-ip') || 'unknown';
const ua = request.headers.get('user-agent') || 'unknown';
const lang = request.headers.get('accept-language') || 'unknown';
```

**Problem:**
- Users behind same NAT + same browser = same fingerprint
- Office/school networks = everyone has same fingerprint
- First viewer locks out everyone else

**Impact:** LOW - UX issue, not security issue

**Mitigation:** Document limitation, consider adding timestamp salt

---

### 7. **Missing Validation in API Route** (LOW)
**File:** `app/api/create-seal/route.ts:38-40`
**Issue:** No validation before parseInt

```typescript
const maxViews = formData.get("maxViews")
  ? parseInt(formData.get("maxViews") as string, 10)
  : null;
```

**Problem:**
- `parseInt("abc")` returns `NaN`
- `NaN` passed to service layer
- Validation happens later, but error message unclear

**Impact:** LOW - Poor error messages

**Fix:** Validate before parseInt or check for NaN

---

## 🔧 Fixes Required

### Fix 1: Add Database Method (CRITICAL)
```typescript
// lib/database.ts - Add to DatabaseProvider interface
export interface DatabaseProvider {
  // ... existing methods
  recordEphemeralView(
    sealId: string, 
    fingerprint: string, 
    timestamp: number
  ): Promise<number>; // Returns new view count
}

// SealDatabase implementation
async recordEphemeralView(
  sealId: string, 
  fingerprint: string, 
  timestamp: number
): Promise<number> {
  const result = await this.db.prepare(`
    UPDATE seals 
    SET view_count = view_count + 1,
        first_viewed_at = COALESCE(first_viewed_at, ?),
        first_viewer_fingerprint = COALESCE(first_viewer_fingerprint, ?)
    WHERE id = ?
    RETURNING view_count
  `).bind(timestamp, fingerprint, sealId).first();
  
  if (!result) throw new Error('Failed to record view');
  return result.view_count as number;
}

// MockDatabase implementation
async recordEphemeralView(
  sealId: string, 
  fingerprint: string, 
  timestamp: number
): Promise<number> {
  const seal = this.store.getSeals().get(sealId);
  if (!seal) throw new Error('Seal not found');
  
  seal.viewCount = (seal.viewCount || 0) + 1;
  if (!seal.firstViewedAt) {
    seal.firstViewedAt = timestamp;
    seal.firstViewerFingerprint = fingerprint;
  }
  this.store.getSeals().set(sealId, seal);
  return seal.viewCount;
}
```

### Fix 2: Use Atomic SQL (HIGH)
```typescript
// lib/ephemeral.ts - Update recordViewAndCheck
export async function recordViewAndCheck(
  db: DatabaseProvider,
  sealId: string,
  fingerprint: string,
  isEphemeral: boolean,
  currentViewCount: number,
  maxViews: number | null
): Promise<ViewCheckResult> {
  if (!isEphemeral) {
    return {
      allowed: true,
      viewCount: currentViewCount,
      maxViews: null,
      shouldDelete: false,
    };
  }

  if (maxViews !== null && currentViewCount >= maxViews) {
    return {
      allowed: false,
      viewCount: currentViewCount,
      maxViews,
      shouldDelete: false,
    };
  }

  const now = Date.now();
  
  // ✅ Atomic increment using new method
  const newViewCount = await db.recordEphemeralView(sealId, fingerprint, now);

  const shouldDelete = maxViews !== null && newViewCount >= maxViews;

  return {
    allowed: true,
    viewCount: newViewCount,
    maxViews,
    shouldDelete,
  };
}
```

### Fix 3: Delete Blob on Exhaustion (MEDIUM)
```typescript
// lib/sealService.ts - Update getSeal
if (viewCheck.shouldDelete) {
  // Delete blob first (idempotent)
  try {
    await this.storage.deleteBlob(sealId);
  } catch (error) {
    logger.error('blob_delete_failed', error as Error, { sealId });
  }
  
  // Then delete database record
  await deleteIfExhausted(
    this.db,
    sealId,
    seal.isEphemeral || false,
    viewCheck.viewCount,
    viewCheck.maxViews,
  );

  sealEvents.emit('seal:exhausted', {
    sealId,
    viewCount: viewCheck.viewCount,
  });
}
```

### Fix 4: Consistent Access Count (MEDIUM)
**Option A:** Always increment accessCount
```typescript
// lib/sealService.ts
// Remove the if statement, always increment
await this.db.incrementAccessCount(sealId);
```

**Option B:** Document that ephemeral uses viewCount
```typescript
// lib/sealService.ts
// Ephemeral seals use viewCount instead of accessCount
if (!seal.isEphemeral) {
  await this.db.incrementAccessCount(sealId);
}
// Return viewCount as accessCount for ephemeral
return {
  // ...
  accessCount: seal.isEphemeral ? viewCheck.viewCount : seal.accessCount,
};
```

### Fix 5: Validate maxViews in API (LOW)
```typescript
// app/api/create-seal/route.ts
const maxViewsStr = formData.get("maxViews") as string;
const maxViews = maxViewsStr 
  ? (() => {
      const parsed = parseInt(maxViewsStr, 10);
      if (isNaN(parsed)) {
        return createErrorResponse(
          ErrorCode.INVALID_INPUT,
          "maxViews must be a number"
        );
      }
      return parsed;
    })()
  : null;

if (maxViews instanceof Response) return maxViews; // Error response
```

---

## 📊 Bug Priority Summary

| Bug | Severity | Impact | Fix Effort |
|-----|----------|--------|------------|
| Type casting violation | CRITICAL | Tests fail | 30 min |
| Race condition | HIGH | Security bypass | 30 min |
| Missing blob deletion | MEDIUM | Storage bloat | 15 min |
| Inconsistent access count | MEDIUM | Broken metrics | 10 min |
| Missing error handling | MEDIUM | Security bypass | 10 min |
| Fingerprint collision | LOW | UX issue | Document only |
| Missing validation | LOW | Poor UX | 5 min |

**Total fix time:** ~2 hours

---

## ✅ Testing Checklist

After fixes, verify:
- [ ] All unit tests pass
- [ ] MockDatabase works correctly
- [ ] Concurrent access handled properly
- [ ] Blob deleted when seal exhausted
- [ ] Access count tracked correctly
- [ ] Error handling works
- [ ] Invalid input rejected with clear errors

---

## 🎯 Recommendation

**Priority order:**
1. Fix type casting (CRITICAL) - Blocks all testing
2. Fix race condition (HIGH) - Security issue
3. Fix blob deletion (MEDIUM) - Storage leak
4. Fix access count (MEDIUM) - Metrics broken
5. Add error handling (MEDIUM) - Security hardening
6. Document fingerprint limitation (LOW)
7. Add input validation (LOW) - UX improvement

**Estimated total effort:** 2 hours to fix all bugs

---

**Status:** 🔴 7 bugs found, 0 fixed  
**Blocker:** Type casting violation prevents testing  
**Next step:** Implement Fix 1 immediately
