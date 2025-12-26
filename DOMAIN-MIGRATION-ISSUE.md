# TimeSeal Domain Migration Issue - Detailed Analysis

## Problem Summary
After migrating TimeSeal from `timeseal.teycir-932.workers.dev` to `timeseal.online`, the API returns `403 Forbidden` with `{"error":"Invalid origin"}` when trying to create seals. The origin validation is rejecting requests from the new domain.

## Root Cause
The `NEXT_PUBLIC_APP_URL` environment variable is hardcoded as `https://timeseal.teycir-932.workers.dev` in the deployed server bundle, even though we've updated all configuration files. This causes the origin validation in `lib/appConfig.ts` to reject requests from `timeseal.online`.

## Evidence
```bash
# Deployed server bundle still contains old URL:
$ grep -o "https://timeseal\.[^\"]*" .open-next/server-functions/default/.next/server/chunks/797.js
https://timeseal.teycir-932.workers.dev

# But configuration files have correct URL:
$ cat .dev.vars | grep NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL=https://timeseal.online

$ cat .env.production | grep NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL=https://timeseal.online

$ cat wrangler.jsonc | grep NEXT_PUBLIC_APP_URL
"NEXT_PUBLIC_APP_URL": "https://timeseal.online"
```

## Technical Details

### Build Process
1. `npm run deploy:prod` executes: `NEXT_PUBLIC_APP_URL=https://timeseal.online npx @opennextjs/cloudflare build && npx wrangler deploy`
2. `@opennextjs/cloudflare build` internally calls `next build`
3. `next build` reads `process.env.NEXT_PUBLIC_APP_URL` and bakes it into the bundle
4. The baked value ends up in `.open-next/server-functions/default/.next/server/chunks/797.js`

### Origin Validation Code
File: `lib/appConfig.ts`

```typescript
export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const isProduction = process.env.NODE_ENV === "production";

  // Get app URL from environment or use default
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (isDevelopment ? "http://localhost:3000" : "");

  if (!appUrl && isProduction) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production");
  }

  // Build allowed origins list
  const allowedOrigins = [
    appUrl,
    ...(isDevelopment
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ].filter(Boolean);

  cachedConfig = {
    appUrl,
    allowedOrigins,
    isDevelopment,
    isProduction,
  };

  return cachedConfig;
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;

  const config = getAppConfig();
  const normalizedOrigin = origin.replace(/\/$/, "");

  // Check exact match
  for (const allowed of config.allowedOrigins) {
    const normalizedAllowed = allowed.replace(/\/$/, "");
    if (normalizedOrigin === normalizedAllowed) {
      return true;
    }
  }

  // Check if origin matches the domain (including www subdomain)
  try {
    const originUrl = new URL(normalizedOrigin);
    const appUrl = new URL(config.appUrl);

    const originHost = originUrl.hostname.replace(/^www\./, "");
    const appHost = appUrl.hostname.replace(/^www\./, "");

    return originHost === appHost;
  } catch (error) {
    // URL parsing failed - invalid origin format
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}
```

### Current Test Results
```bash
$ curl -X POST https://timeseal.online/api/create-seal \
  -H "Content-Type: application/json" \
  -H "Origin: https://timeseal.online" \
  -d '{"test":"data"}'

{"error":"Invalid origin"}
HTTP Status: 403
```

## Configuration Files

### package.json (deploy script)
```json
{
  "scripts": {
    "deploy:prod": "NEXT_PUBLIC_APP_URL=https://timeseal.online npx @opennextjs/cloudflare build && npx wrangler deploy"
  }
}
```

### .prod.vars (production environment variables)
```
NEXTJS_ENV=production
NEXT_PUBLIC_APP_URL=https://timeseal.online
MASTER_ENCRYPTION_KEY=I7P7xgYToBXcgS1ZBG8XMt7kWYIxeyUJEB6RfRltphQ=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACHzq8TngxZwCTuD
TURNSTILE_SECRET_KEY=0x4AAAAAACHzq-2YjQt7pL5TPWWo9bbwthM
```

### .dev.vars (development environment variables)
```
NEXTJS_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
MASTER_ENCRYPTION_KEY=local-dev-key-for-testing-only
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACHzq8TngxZwCTuD
TURNSTILE_SECRET_KEY=0x4AAAAAACHzq-2YjQt7pL5TPWWo9bbwthM
```

### .env.production
```
NEXT_PUBLIC_APP_URL=https://timeseal.online
```

### wrangler.jsonc (runtime environment variables)
```json
{
  "vars": {
    "NEXT_PUBLIC_APP_URL": "https://timeseal.online"
  }
}
```

## Attempted Solutions (All Failed)

1. ✗ Set `NEXT_PUBLIC_APP_URL` in `wrangler.jsonc` vars (runtime only, not build-time)
2. ✗ Created `.env.production` file (not read by OpenNext build)
3. ✗ Created `.prod.vars` and copied to `.dev.vars` before build (timing issue)
4. ✗ Set environment variable in deploy script (may not be propagating correctly)
5. ✗ Removed hardcoded domain checks from `appConfig.ts` (but old URL still in bundle)
6. ✗ Multiple clean builds with `rm -rf .open-next .next` (cache persists somewhere)

## Key Constraints

1. **No hardcoded URLs allowed** - Must be configurable via environment variables
2. **No temporary hacks** - No file swapping, no git checkout tricks
3. **Proper error handling** - No bare catch blocks, must check error types and re-throw unexpected errors
4. **Clean architecture** - Separate dev and prod configs without manual intervention

## Questions for Claude Opus

1. **Why is the old URL still in the bundle?** Even after setting `NEXT_PUBLIC_APP_URL=https://timeseal.online` in the deploy command and cleaning `.open-next` and `.next` directories, the deployed bundle still contains `https://timeseal.teycir-932.workers.dev`.

2. **Where is Next.js reading the environment variable from?** We've set it in:
   - Shell environment (`NEXT_PUBLIC_APP_URL=https://timeseal.online npx ...`)
   - `.env.production` file
   - `.dev.vars` file
   - `wrangler.jsonc` vars
   
   Yet the build still uses the old value.

3. **Is there a hidden cache?** Could there be a Next.js cache, OpenNext cache, or Wrangler cache that's persisting the old value?

4. **What's the correct way to set build-time environment variables for `@opennextjs/cloudflare`?** The tool doesn't seem to have a `--vars-file` flag or similar.

## Expected Behavior

After deployment, the server should:
1. Read `NEXT_PUBLIC_APP_URL=https://timeseal.online` from environment
2. Accept requests with `Origin: https://timeseal.online` header
3. Accept requests with `Origin: https://www.timeseal.online` header (www subdomain)
4. Reject requests from other origins

## Current Behavior

The server:
1. Has `https://timeseal.teycir-932.workers.dev` hardcoded in the bundle
2. Rejects all requests from `timeseal.online` with 403 Forbidden
3. Only accepts requests from the old domain (which no longer routes to the app)

## Project Structure

```
TimeSeal/
├── .amazonq/rules/error-handling.md  # Error handling rules
├── .dev.vars                          # Development environment variables
├── .env.production                    # Production environment variables
├── .prod.vars                         # Production vars (for deployment)
├── lib/
│   ├── appConfig.ts                   # Origin validation logic
│   └── security.ts                    # Security utilities
├── package.json                       # Deploy scripts
├── wrangler.jsonc                     # Cloudflare Workers config
└── wrangler.prod.jsonc               # Production-specific config (unused)
```

## Deployment Command

```bash
npm run deploy:prod
# Executes: NEXT_PUBLIC_APP_URL=https://timeseal.online npx @opennextjs/cloudflare build && npx wrangler deploy
```

## Request for Help

Please provide a solution that:
1. Correctly sets `NEXT_PUBLIC_APP_URL` at build time so it's baked into the bundle
2. Works with the `@opennextjs/cloudflare` build tool
3. Doesn't require hardcoded URLs or temporary file manipulation
4. Maintains separate dev and prod configurations cleanly
5. Follows the error handling rules in `.amazonq/rules/error-handling.md`

The solution should explain WHY the current approach isn't working and provide a step-by-step fix.
