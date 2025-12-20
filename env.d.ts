interface CloudflareEnv {
  DB: D1Database;
  MASTER_ENCRYPTION_KEY: string;
  R2_BUCKET?: R2Bucket;
}

declare module '@cloudflare/next-on-pages' {
  export function getRequestContext<T = CloudflareEnv>(): {
    env: T;
    cf: CfProperties;
    ctx: ExecutionContext;
  };
}
