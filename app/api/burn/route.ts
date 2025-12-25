import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/apiHandler';
import { createAPIRoute } from '@/lib/routeHelper';
import { ErrorCode, createErrorResponse } from '@/lib/errors';
import { RATE_LIMIT_BURN } from '@/lib/constants';

export async function POST(request: NextRequest) {
  console.log('[Burn API] Request received');
  return createAPIRoute(async ({ container, request: ctx, ip }) => {
    try {
      console.log('[Burn API] Parsing request body');
      const { pulseToken } = await ctx.json() as { pulseToken: string };
      console.log('[Burn API] Pulse token received:', pulseToken ? 'yes' : 'no');

      if (!pulseToken) {
        console.error('[Burn API] No pulse token provided');
        return createErrorResponse(ErrorCode.INVALID_INPUT, 'Pulse token required');
      }

      console.log('[Burn API] Calling burnSeal');
      const sealService = container.sealService;
      await sealService.burnSeal(pulseToken, ip);
      console.log('[Burn API] Seal burned successfully');

      return jsonResponse({
        success: true,
        message: 'Seal burned successfully',
      });
    } catch (error) {
      console.error('[Burn API] Error:', error);
      console.error('[Burn API] Error type:', typeof error);
      console.error('[Burn API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[Burn API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, `Burn failed: ${errorMessage}`);
    }
  }, { rateLimit: RATE_LIMIT_BURN })(request);
}
