// Reusable Middleware Library
export interface Context {
  request: Request;
  env?: any;
  ip: string;
  [key: string]: any;
}

export type Handler = (ctx: Context) => Promise<Response>;
export type Middleware = (ctx: Context, next: Handler) => Promise<Response>;

export function compose(...middlewares: Middleware[]): Middleware {
  return async (ctx, next) => {
    let index = 0;

    async function dispatch(i: number): Promise<Response> {
      if (i >= middlewares.length) return next(ctx);
      return middlewares[i](ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

export function createMiddleware(
  fn: (ctx: Context, next: Handler) => Promise<Response>
): Middleware {
  return fn;
}

export function chain(...handlers: Middleware[]): Handler {
  const middleware = compose(...handlers);
  return (ctx) => middleware(ctx, async () => new Response('Not Found', { status: 404 }));
}
