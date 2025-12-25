import { NextRequest, NextResponse } from 'next/server';
import { createAPIRoute } from '@/lib/routeHelper';
import { AnalyticsService } from '@/lib/analytics';


const VALID_EVENT_TYPES = ['page_view', 'seal_created', 'seal_unlocked', 'pulse_received'];

export async function POST(request: NextRequest) {
  console.log('[Analytics] POST request received');
  return createAPIRoute(async ({ container }) => {
    try {
      console.log('[Analytics] Inside createAPIRoute handler');
      console.log('[Analytics] Container:', container ? 'exists' : 'null');
      console.log('[Analytics] Container.db:', container?.db ? 'exists' : 'null');
      
      const body = await request.json();
      console.log('[Analytics] Body parsed:', JSON.stringify(body));
      const { eventType, path, referrer } = body;

      // Validate event type
      if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
        console.log('[Analytics] Invalid event type:', eventType);
        return NextResponse.json({ success: false, error: 'Invalid event type' }, { status: 400 });
      }

      // Validate path length
      if (path && path.length > 500) {
        console.log('[Analytics] Path too long');
        return NextResponse.json({ success: false, error: 'Path too long' }, { status: 400 });
      }

      // Validate referrer length
      if (referrer && referrer.length > 500) {
        console.log('[Analytics] Referrer too long');
        return NextResponse.json({ success: false, error: 'Referrer too long' }, { status: 400 });
      }

      console.log('[Analytics] Creating AnalyticsService');
      const analytics = new AnalyticsService(container.db);
      const country = request.headers.get('cf-ipcountry') || undefined;

      console.log('[Analytics] Tracking event:', { eventType, path, country });
      await analytics.trackEvent({ eventType, path, referrer, country });
      console.log('[Analytics] Event tracked successfully');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[Analytics API] Error caught:', error);
      console.error('[Analytics API] Error type:', typeof error);
      console.error('[Analytics API] Error name:', error instanceof Error ? error.name : 'unknown');
      console.error('[Analytics API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[Analytics API] Stack:', error instanceof Error ? error.stack : 'No stack');
      return NextResponse.json({ success: false, error: 'Internal error' }, { status: 200 });
    }
  }, { rateLimit: { limit: 100, window: 60000 } })(request);
}
