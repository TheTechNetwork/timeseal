import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip HTTPS redirect in development and E2E mode
  const isDev = process.env.NODE_ENV === 'development';
  const isE2E = process.env.NEXT_PUBLIC_IS_E2E === 'true';

  // Force HTTPS redirect (except in dev/E2E)
  if (!isDev && !isE2E && request.nextUrl.protocol === 'http:') {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  const response = NextResponse.next();

  // Cache-busting headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // CSP is set via Cloudflare Transform Rules

  return response;
}

export const config = {
  matcher: '/:path*',
};
