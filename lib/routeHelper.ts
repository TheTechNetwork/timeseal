import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createContainer } from './container';
import { createHandler, HandlerContext } from './apiHandler';
import { withRateLimit } from './rateLimit';
import { getRequestFingerprint } from './security';
import { createDatabase } from './database';

interface RouteHandlerOptions {
  rateLimit?: { limit: number; window: number };
}

interface CloudflareEnv {
  DB: any;
  MASTER_ENCRYPTION_KEY?: string;
}

export function createAPIRoute(
  handler: (ctx: HandlerContext & { container: any }) => Promise<Response>,
  options: RouteHandlerOptions = {}
) {
  return async (request: NextRequest, routeParams?: any) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const fingerprint = await getRequestFingerprint(request);
    const { env } = await getCloudflareContext<{ env: CloudflareEnv }>();
    
    const wrappedHandler = async () => {
      const apiHandler = createHandler(async (ctx: HandlerContext) => {
        const container = createContainer(env);
        return handler({ ...ctx, container });
      });
      
      return apiHandler({ request, ip, env });
    };

    if (options.rateLimit) {
      const db = createDatabase(env);
      return withRateLimit(request, wrappedHandler, { ...options.rateLimit, key: fingerprint, db });
    }
    
    return wrappedHandler();
  };
}
