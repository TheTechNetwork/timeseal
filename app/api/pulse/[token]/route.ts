import { NextRequest, NextResponse } from 'next/server';
import { Database, createMockDB } from '@/lib/database';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: pulseToken } = await params;
    
    const db = new Database(createMockDB());
    const seal = await db.getSealByPulseToken(pulseToken);
    
    if (!seal || !seal.pulseToken || seal.pulseToken !== pulseToken) {
      return NextResponse.json(
        { error: 'Invalid pulse token' },
        { status: 404 }
      );
    }

    if (!seal.pulseDuration) {
      return NextResponse.json(
        { error: 'Seal is not configured for pulse updates' },
        { status: 400 }
      );
    }

    const newUnlockTime = Date.now() + seal.pulseDuration;
    const success = await db.updateUnlockTime(pulseToken, newUnlockTime);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update pulse' },
        { status: 500 }
      );
    }

    console.log(`[MOCK R2] Extended retention for seal until ${new Date(newUnlockTime)}`);

    return NextResponse.json({
      success: true,
      newUnlockTime,
      message: 'Pulse updated successfully',
    });

  } catch (error) {
    console.error('Error updating pulse:', error);
    return NextResponse.json(
      { error: 'Failed to update pulse' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: pulseToken } = await params;
    
    const db = new Database(createMockDB());
    const seal = await db.getSealByPulseToken(pulseToken);
    
    if (!seal) {
      return NextResponse.json(
        { error: 'Invalid pulse token' },
        { status: 404 }
      );
    }

    const now = Date.now();
    const timeRemaining = seal.unlockTime - now;

    return NextResponse.json({
      unlockTime: seal.unlockTime,
      timeRemaining: Math.max(0, timeRemaining),
      pulseDuration: seal.pulseDuration,
    });

  } catch (error) {
    console.error('Error fetching pulse status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pulse status' },
      { status: 500 }
    );
  }
}