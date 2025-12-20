import { NextRequest } from 'next/server';
import { createContainer } from './container';
import { createHandler, HandlerContext } from './apiHandler';
import { withRateLimit } from './rateLimit';

interface RouteHandlerOptions {
  rateLimit?: { limit: number; window: number };
}

export function createAPIRoute(
  handler: (ctx: HandlerContext & { container: any }) => Promise<Response>,
  options: RouteHandlerOptions = {}
) {
  return async (request: NextRequest, routeParams?: any) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    const wrappedHandler = async () => {
      const apiHandler = createHandler(async (ctx: HandlerContext) => {
        const container = createContainer(ctx.env);
        return handler({ ...ctx, container });
      });
      
      return apiHandler({ request, ip, env: undefined });
    };

    if (options.rateLimit) {
      return withRateLimit(request, wrappedHandler, options.rateLimit);
    }
    
    return wrappedHandler();
  };
}
