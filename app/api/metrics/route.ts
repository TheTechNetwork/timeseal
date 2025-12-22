import { NextRequest } from 'next/server';
import { handleMetricsRequest } from '@/lib/metrics';

const METRICS_SECRET = process.env.METRICS_SECRET;

export async function GET(request: NextRequest) {
  if (!METRICS_SECRET || METRICS_SECRET === 'dev-secret') {
    return new Response('Metrics disabled', { status: 404 });
  }
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== METRICS_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return handleMetricsRequest();
}
