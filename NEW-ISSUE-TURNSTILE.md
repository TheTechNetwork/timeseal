# NEW ISSUE: Turnstile Token Missing After Domain Migration

## Problem
After successfully fixing the origin validation issue by switching from build-time `NEXT_PUBLIC_APP_URL` to runtime `APP_URL`, the `/api/create-seal` endpoint now returns:

```json
{"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred. Please try again."}}
```

User reports: **"the turnstile now is gone"**

## Context

### What Was Fixed (v1)
- **Root cause**: `NEXT_PUBLIC_APP_URL` was baked into bundle at build time with old domain `timeseal.teycir-932.workers.dev`
- **Solution**: Changed `lib/appConfig.ts` to use runtime `process.env.APP_URL` instead
- **Result**: Origin validation now passes (no more 403 "Invalid origin" error)

### Current State (v2)
- Origin validation: ✅ WORKING
- Turnstile validation: ❌ BROKEN
- Error: Generic "INTERNAL_ERROR" from `/api/create-seal`

## Technical Details

### Environment Variables
**wrangler.jsonc:**
```json
{
  "vars": {
    "APP_URL": "https://timeseal.online"
  }
}
```

**Secrets (set via wrangler):**
- `MASTER_ENCRYPTION_KEY` - ✅ Set
- `TURNSTILE_SECRET_KEY` - ❓ Unknown if set correctly

### API Endpoint
- **URL**: `POST https://timeseal.online/api/create-seal`
- **Expected behavior**: Validate Turnstile token before creating seal
- **Current behavior**: Returns generic internal error

### Test Request
```bash
curl -X POST https://timeseal.online/api/create-seal \
  -H "Content-Type: application/json" \
  -H "Origin: https://timeseal.online" \
  -d '{
    "encryptedBlob": "test_blob_data",
    "encryptedKeyB": "test_key_b",
    "iv": "test_iv_value",
    "unlockTime": "2025-01-20T12:00:00Z",
    "mode": "TIMED",
    "turnstileToken": "dummy_token_for_testing"
  }'
```

**Response:**
```json
{"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred. Please try again."}}
```

## Hypothesis

### Possible Causes
1. **Turnstile secret key not set in production environment**
   - May have been set for old domain but not migrated
   - Check: `wrangler secret list`

2. **Turnstile widget configuration issue**
   - Widget may still be configured for old domain
   - Cloudflare dashboard may need hostname update

3. **Turnstile validation endpoint changed**
   - API may be using hardcoded old domain for validation
   - Check `lib/turnstile.ts` or similar validation code

4. **Environment variable not accessible at runtime**
   - Similar to `APP_URL` issue, Turnstile secret may need runtime access
   - Check if using `process.env.TURNSTILE_SECRET_KEY` correctly

## Investigation Needed

### Files to Check
1. **Turnstile validation logic**: Find where Turnstile token is validated
2. **Environment variable access**: Verify `TURNSTILE_SECRET_KEY` is read at runtime
3. **Error logging**: Check if there's more detailed error info being suppressed
4. **Cloudflare dashboard**: Verify Turnstile widget hostname configuration

### Questions for User
1. Was `TURNSTILE_SECRET_KEY` re-set after domain migration?
2. Is Turnstile widget configured for `timeseal.online` in Cloudflare dashboard?
3. Are there any error logs in Cloudflare Workers dashboard?

## Expected Solution Pattern
Based on the previous fix, likely need to:
1. Verify Turnstile secret is set: `wrangler secret list`
2. Check if Turnstile validation code uses correct domain
3. Ensure runtime access to `TURNSTILE_SECRET_KEY`
4. Update Turnstile widget hostname in Cloudflare dashboard if needed

## Error Handling Note
Per `.amazonq/rules/error-handling.md`, the code should NOT be using bare catch blocks. If the error is being caught and returning generic "INTERNAL_ERROR", we need to:
1. Check error type explicitly
2. Re-throw unexpected errors
3. Log errors with context
4. Only catch expected error types (e.g., `TurnstileValidationError`)
