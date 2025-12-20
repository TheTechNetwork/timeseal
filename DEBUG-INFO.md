# TIME-SEAL Deployment Debug Information

## Problem
Next.js app deployed to Cloudflare Pages returns "Internal Server Error" on all API routes.

## Setup Complete
- ✅ D1 Database: `time-seal-db` (ID: `07ad5c32-1de4-410f-aa5d-82366405fe66`)
- ✅ Production Secret: `MASTER_ENCRYPTION_KEY` set in Cloudflare Pages
- ✅ Compatibility Flag: `nodejs_compat` set in Production
- ✅ Deployment: https://time-seal.pages.dev
- ✅ wrangler.toml configured with D1 binding

## Current Error
All API endpoints return "Internal Server Error" including simple `/api/health` endpoint.

## Key Files

### wrangler.toml
```toml
name = "time-seal"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "time-seal-db"
database_id = "07ad5c32-1de4-410f-aa5d-82366405fe66"
```

### lib/routeHelper.ts (Current - NOT WORKING)
```typescript
import { NextRequest } from 'next/server';
import { createContainer } from './container';
import { createHandler, HandlerContext } from './apiHandler';
import { withRateLimit } from './rateLimit';

interface RouteHandlerOptions {
  rateLimit?: { limit: number; window: number };
}

// Access Cloudflare bindings in Next.js edge runtime
function getCloudflareContext() {
  // @ts-ignore - Cloudflare bindings
  return globalThis as any;
}

export function createAPIRoute(
  handler: (ctx: HandlerContext & { container: any }) => Promise<Response>,
  options: RouteHandlerOptions = {}
) {
  return async (request: NextRequest, routeParams?: any) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    const wrappedHandler = async () => {
      const apiHandler = createHandler(async (ctx: HandlerContext) => {
        // Get Cloudflare bindings from global context
        const cfContext = getCloudflareContext();
        const env = cfContext.DB ? cfContext : {};
        const container = createContainer(env);
        return handler({ ...ctx, container });
      });
      
      const cfContext = getCloudflareContext();
      const env = cfContext.DB ? cfContext : {};
      return apiHandler({ request, ip, env });
    };

    if (options.rateLimit) {
      return withRateLimit(request, wrappedHandler, options.rateLimit);
    }
    
    return wrappedHandler();
  };
}
```

### Example API Route (app/api/seal/[id]/route.ts)
```typescript
import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/apiHandler';
import { createAPIRoute } from '@/lib/routeHelper';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createAPIRoute(async ({ container, ip }) => {
    const { id: sealId } = await params;
    const sealService: any = container.resolve('sealService');
    const metadata = await sealService.getSeal(sealId, ip);
    // ... rest of handler
  }, { rateLimit: { limit: 20, window: 60000 } })(request);
}
```

## Question for Gemini

**How do I correctly access Cloudflare D1 database bindings in Next.js 14 App Router with edge runtime on Cloudflare Pages?**

The D1 binding is named "DB" in wrangler.toml. I need to access it in my API routes to pass to the container.

Current attempts:
1. `process.env` - doesn't work
2. `globalThis.DB` - doesn't work
3. Passing `undefined` - doesn't work

What's the correct way to access the `DB` binding in Next.js edge runtime on Cloudflare Pages?

## Framework Details
- Next.js 14.2.35
- @cloudflare/next-on-pages 1.13.16
- Edge runtime (not Node.js)
- Deployed via `npx @cloudflare/next-on-pages` then `wrangler pages deploy`

## Expected Behavior
The `DB` binding should be accessible in API routes so I can:
```typescript
const env = { DB: /* D1 database binding */ };
const container = createContainer(env);
```

## Additional Context
- The app works locally with mock storage
- Cloudflare dashboard shows D1 database is properly bound
- Compatibility flag `nodejs_compat` is set in Production
- All secrets are configured correctly
