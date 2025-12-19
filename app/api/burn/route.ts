import { NextRequest, NextResponse } from 'next/server';
import { Database, createMockDB } from '@/lib/database';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { pulseToken } = await request.json();
    
    if (!pulseToken) {
      return NextResponse.json(
        { error: 'Pulse token required' },
        { status: 400 }
      );
    }

    const db = new Database(createMockDB());
    const seal = await db.getSealByPulseToken(pulseToken);
    
    if (!seal) {
      return NextResponse.json(
        { error: 'Invalid pulse token' },
        { status: 404 }
      );
    }

    const success = await db.deactivateSeal(seal.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to burn seal' },
        { status: 500 }
      );
    }

    console.log(`[MOCK R2] Seal ${seal.id} burned - marked for deletion`);

    return NextResponse.json({
      success: true,
      message: 'Seal permanently destroyed',
    });

  } catch (error) {
    console.error('Error burning seal:', error);
    return NextResponse.json(
      { error: 'Failed to burn seal' },
      { status: 500 }
    );
  }
}
