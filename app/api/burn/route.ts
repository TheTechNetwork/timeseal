import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/apiHandler';
import { createAPIRoute } from '@/lib/routeHelper';
import { ErrorCode, createErrorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return createAPIRoute(async ({ container, request: ctx, ip }) => {
    const { pulseToken } = await ctx.json() as { pulseToken: string };

    if (!pulseToken) {
      return createErrorResponse(ErrorCode.INVALID_INPUT, 'Pulse token required');
    }

    const sealService = container.sealService;
    await sealService.burnSeal(pulseToken, ip);

    return jsonResponse({
      success: true,
      message: 'Seal burned successfully',
    });
  }, { rateLimit: { limit: 10, window: 60000 } })(request);
}
