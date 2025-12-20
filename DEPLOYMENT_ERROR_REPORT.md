# Cloudflare Pages Deployment Error Report

**Date:** 2025-12-20  
**Deployment URL:** https://5b4dd286.time-seal.pages.dev  
**Status:** Build Successful, Runtime Errors

---

## 🔴 Current Issues

### 1. All API Routes Return 500 Internal Server Error

**Affected Endpoints:**
- `/api/health` - Returns "Internal Server Error"
- `/api/debug` - Returns "Internal Server Error"
- All other API routes (untested but likely affected)

**HTTP Response:**
```
HTTP/2 500
content-type: text/plain;charset=UTF-8
content-length: 21
```

---

## 🔍 Possible Causes

### A. Cloudflare Bindings Not Configured

**Issue:** D1 Database binding may not be set up in Cloudflare Pages project settings.

**Evidence:**
- `getRequestContext()` is called in `lib/routeHelper.ts`
- Routes expect `env.DB` to be available
- No error during build, only at runtime

**What's Missing:**
```typescript
// Expected in Cloudflare Pages settings:
DB = <D1_DATABASE_ID>
MASTER_ENCRYPTION_KEY = <secret_key>
```

### B. Database Schema Not Initialized

**Issue:** D1 database exists but tables not created.

**Evidence:**
- SQL queries in `lib/database.ts` expect `seals` table
- Table structure removed `hmac` column but may not exist at all

**Required Schema:**
```sql
CREATE TABLE seals (
  id TEXT PRIMARY KEY,
  unlock_time INTEGER NOT NULL,
  is_dms INTEGER NOT NULL,
  pulse_interval INTEGER,
  last_pulse INTEGER,
  key_b TEXT NOT NULL,
  iv TEXT NOT NULL,
  pulse_token TEXT,
  created_at INTEGER NOT NULL
);
```

### C. Environment Detection Issue

**Issue:** `process.env.NODE_ENV` may not work correctly in Cloudflare Workers.

**Evidence:**
```typescript
// lib/database.ts line 203
if (process.env.NODE_ENV === 'production' && env?.DB) {
  return new SealDatabase(env.DB);
}
return new MockDatabase();
```

**Problem:** In Cloudflare Workers, `process.env.NODE_ENV` might be undefined or not set to "production", causing MockDatabase to be used even in production.

### D. Missing Environment Variables

**Issue:** `MASTER_ENCRYPTION_KEY` not set in Cloudflare Pages.

**Evidence:**
- `lib/keyEncryption.ts` calls `getMasterKey()`
- Key used for encrypting keyB values
- Missing key would cause encryption failures

---

## ❓ Questions for Help

### 1. Cloudflare Pages Configuration

**Q1:** Is the D1 database binding configured in Cloudflare Pages project settings?
- Go to: Cloudflare Dashboard → Pages → time-seal → Settings → Functions
- Check: "D1 database bindings" section
- Expected: `DB` → `<your-d1-database-name>`

**Q2:** Is the D1 database ID correct?
- Current ID in wrangler.toml: `07ad5c32-1de4-410f-aa5d-82366405fe66`
- Verify: `wrangler d1 list`

### 2. Database Schema

**Q3:** Has the database schema been initialized?
```bash
# Check if tables exist
wrangler d1 execute <DB_NAME> --command "SELECT name FROM sqlite_master WHERE type='table';"

# If missing, initialize:
wrangler d1 execute <DB_NAME> --file=schema.sql
```

**Q4:** Does the schema match the code after removing `hmac`?
- Code expects 9 columns (no hmac)
- Database might still have 10 columns (with hmac)

### 3. Environment Variables

**Q5:** Is `MASTER_ENCRYPTION_KEY` set as a secret?
```bash
# Check secrets (won't show values)
wrangler pages secret list --project-name=time-seal

# If missing, set it:
wrangler pages secret put MASTER_ENCRYPTION_KEY --project-name=time-seal
```

**Q6:** Should we use a different method to detect production environment?
```typescript
// Instead of process.env.NODE_ENV, use:
if (env?.DB) {
  return new SealDatabase(env.DB);
}
return new MockDatabase();
```

### 4. Deployment Configuration

**Q7:** Is `wrangler.toml` being used by Cloudflare Pages?
- Pages deployments may ignore `wrangler.toml`
- Bindings must be configured in dashboard

**Q8:** Are there any deployment logs available?
```bash
# Try to get logs
wrangler pages deployment list --project-name=time-seal
wrangler pages deployment tail --project-name=time-seal --deployment-id=<ID>
```

---

## 🔧 Recommended Actions

### Immediate Steps

1. **Verify D1 Binding:**
   ```bash
   # List D1 databases
   wrangler d1 list
   
   # Check if binding exists in Pages
   # Go to Cloudflare Dashboard → Pages → time-seal → Settings → Functions
   ```

2. **Initialize Database Schema:**
   ```bash
   # Create schema.sql with table definition (without hmac)
   wrangler d1 execute time-seal-db --file=schema.sql
   ```

3. **Set Environment Variables:**
   ```bash
   # Generate and set master key
   openssl rand -base64 32 | wrangler pages secret put MASTER_ENCRYPTION_KEY --project-name=time-seal
   ```

4. **Fix Environment Detection:**
   - Update `lib/database.ts` line 203 to not rely on `process.env.NODE_ENV`

### Testing Steps

After fixes:
```bash
# Redeploy
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name=time-seal

# Test endpoints
curl https://<deployment-url>/api/health
curl https://<deployment-url>/api/debug
```

---

## 📋 Files to Check

1. `lib/database.ts` - Environment detection logic
2. `lib/routeHelper.ts` - getRequestContext() usage
3. `lib/keyEncryption.ts` - MASTER_ENCRYPTION_KEY usage
4. `wrangler.toml` - D1 binding configuration
5. Cloudflare Dashboard - Pages project settings

---

## 🎯 Expected Behavior

After fixes, `/api/debug` should return:
```json
{
  "hasDB": true,
  "hasKey": true,
  "bindings": ["DB", "MASTER_ENCRYPTION_KEY"],
  "timestamp": "2025-12-20T22:00:00.000Z"
}
```

And `/api/health` should return:
```json
{
  "status": "healthy",
  "timestamp": 1734732000000,
  "version": "0.1.0",
  "services": {
    "storage": "closed",
    "database": "operational"
  }
}
```
