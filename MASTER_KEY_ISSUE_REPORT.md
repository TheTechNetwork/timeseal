# MASTER_ENCRYPTION_KEY Analysis Report

**Date:** 2025-12-20  
**Issue:** Potential environment variable access problem in Cloudflare Workers

---

## 🔴 Critical Problem Identified

### The Issue: `process.env` in Cloudflare Workers

**Location:** `lib/keyEncryption.ts` lines 89-95

```typescript
export function getMasterKey(): string {
  const key = process.env.MASTER_ENCRYPTION_KEY;  // ❌ PROBLEM
  if (!key) {
    throw new Error('MASTER_ENCRYPTION_KEY not configured');
  }
  return key;
}
```

**Why This Fails:**
- In Cloudflare Workers/Pages, `process.env` is NOT available at runtime
- Environment variables must be accessed through `env` object from `getRequestContext()`
- The secret is set correctly in Cloudflare (`wrangler pages secret list` confirms it exists)
- But the code tries to read it from `process.env` which is always undefined

---

## 📊 Current Usage Pattern

### Where getMasterKey() is Called

1. **`lib/sealService.ts` line 58:**
   ```typescript
   const pulseToken = request.isDMS ? await generatePulseToken(sealId, getMasterKey()) : undefined;
   ```

2. **`lib/sealService.ts` line 60:**
   ```typescript
   const encryptedKeyB = await encryptKeyB(request.keyB, getMasterKey(), sealId);
   ```

3. **`lib/sealService.ts` line 141:**
   ```typescript
   const isValid = await validatePulseToken(pulseToken, sealId, getMasterKey());
   ```

### The Flow

```
API Route (has env from getRequestContext)
    ↓
createAPIRoute (lib/routeHelper.ts)
    ↓
createContainer (lib/container.ts) - passes env
    ↓
SealService (lib/sealService.ts)
    ↓
getMasterKey() - tries to read process.env ❌ FAILS
```

---

## 🔍 Root Cause

**The key is available in `env.MASTER_ENCRYPTION_KEY` but not in `process.env.MASTER_ENCRYPTION_KEY`**

### Evidence:

1. **Secret exists in Cloudflare:**
   ```bash
   $ npx wrangler pages secret list --project-name=time-seal
   - MASTER_ENCRYPTION_KEY: Value Encrypted ✓
   ```

2. **Container receives env:**
   ```typescript
   // lib/routeHelper.ts line 27
   const { env } = getRequestContext<CloudflareEnv>();
   const container = createContainer(env);  // env.MASTER_ENCRYPTION_KEY exists here
   ```

3. **But getMasterKey() looks in wrong place:**
   ```typescript
   // lib/keyEncryption.ts
   const key = process.env.MASTER_ENCRYPTION_KEY;  // undefined in Workers
   ```

---

## 🔧 Required Fix

### Option 1: Pass env through dependency injection (RECOMMENDED)

**Step 1:** Update `lib/keyEncryption.ts`:

```typescript
// Remove these functions:
export function getMasterKey(): string { ... }
export function getMasterKeys(): string[] { ... }

// Replace with functions that accept masterKey parameter:
export async function encryptKeyB(
  keyB: string, 
  masterKey: string,  // Already has this ✓
  sealId: string
): Promise<string> { ... }

export async function decryptKeyBWithFallback(
  encryptedKeyB: string, 
  sealId: string,
  masterKeys: string[]  // Add this parameter
): Promise<string> { ... }
```

**Step 2:** Update `lib/sealService.ts`:

```typescript
export class SealService {
  constructor(
    private storage: StorageProvider,
    private db: DatabaseProvider,
    private masterKey: string,  // Add this
    private auditLogger?: AuditLogger
  ) {}

  async createSeal(request: CreateSealRequest, ip: string) {
    // Use this.masterKey instead of getMasterKey()
    const pulseToken = request.isDMS 
      ? await generatePulseToken(sealId, this.masterKey) 
      : undefined;
    
    const encryptedKeyB = await encryptKeyB(request.keyB, this.masterKey, sealId);
  }

  async getSeal(sealId: string, ip: string) {
    if (isUnlocked) {
      decryptedKeyB = await decryptKeyBWithFallback(seal.keyB, sealId, [this.masterKey]);
    }
  }

  async pulseSeal(pulseToken: string, ip: string) {
    const isValid = await validatePulseToken(pulseToken, sealId, this.masterKey);
  }
}
```

**Step 3:** Update `lib/container.ts`:

```typescript
export function createContainer(env: any) {
  const container = new Container();
  
  const masterKey = env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('MASTER_ENCRYPTION_KEY not configured');
  }

  container.register('sealService', () => {
    return new SealService(
      storage,
      db,
      masterKey,  // Pass it here
      auditLogger
    );
  });

  return container;
}
```

### Option 2: Global env store (NOT RECOMMENDED)

Create a global store that's set once per request - this is hacky and not thread-safe.

---

## 🎯 Impact Analysis

### What Breaks Without This Fix:

1. **Creating seals:** `encryptKeyB()` fails → 500 error
2. **Unlocking seals:** `decryptKeyBWithFallback()` fails → 500 error  
3. **Pulse updates:** `validatePulseToken()` fails → 500 error

### What Works:

- `/api/health` - doesn't use encryption ✓
- `/api/debug` - only checks if key exists ✓
- Static pages ✓

---

## ✅ Verification Steps

After implementing the fix:

1. **Test seal creation:**
   ```bash
   curl -X POST https://time-seal.pages.dev/api/create-seal \
     -F "encryptedBlob=@test.bin" \
     -F "keyB=test" \
     -F "iv=test" \
     -F "unlockTime=1735000000000"
   ```

2. **Check debug endpoint:**
   ```bash
   curl https://time-seal.pages.dev/api/debug
   # Should show: "MASTER_ENCRYPTION_KEY": true
   ```

3. **Verify no errors in logs:**
   ```bash
   npx wrangler pages deployment tail --project-name=time-seal
   ```

---

## 📋 Files That Need Changes

1. ✅ `lib/keyEncryption.ts` - Remove getMasterKey(), update function signatures
2. ✅ `lib/sealService.ts` - Accept masterKey in constructor, use it instead of getMasterKey()
3. ✅ `lib/container.ts` - Extract masterKey from env, pass to SealService
4. ✅ `lib/security.ts` - Update generatePulseToken/validatePulseToken if they use getMasterKey()

---

## 🚨 Summary

**Problem:** Code tries to read `process.env.MASTER_ENCRYPTION_KEY` which doesn't exist in Cloudflare Workers.

**Solution:** Pass `env.MASTER_ENCRYPTION_KEY` through dependency injection from container to SealService.

**Priority:** CRITICAL - All encryption operations fail without this fix.

**Estimated Fix Time:** 15 minutes

**Risk:** Low - straightforward refactor, no logic changes needed.
