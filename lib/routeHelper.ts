import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createContainer } from './container';
import { createHandler, HandlerContext } from './apiHandler';
import { withRateLimit } from './rateLimit';
import { getRequestFingerprint } from './security';

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
    const fingerprint = getRequestFingerprint(request);
    
    const wrappedHandler = async () => {
      const apiHandler = createHandler(async (ctx: HandlerContext) => {
        const { env } = await getCloudflareContext<{ env: CloudflareEnv }>();
        const container = createContainer(env);
        return handler({ ...ctx, container });
      });
      
      const { env } = await getCloudflareContext<{ env: CloudflareEnv }>();
      return apiHandler({ request, ip, env });
    };

    if (options.rateLimit) {
      return withRateLimit(request, wrappedHandler, { ...options.rateLimit, key: fingerprint });
    }
    
    return wrappedHandler();
  };
}
