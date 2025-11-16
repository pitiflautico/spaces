/**
 * API Route: Save Space
 * POST /api/spaces/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveSpace } from '@/lib/storage';
import type { Space } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const space: Space = await request.json();

    if (!space || !space.id) {
      return NextResponse.json(
        { error: 'Invalid space data' },
        { status: 400 }
      );
    }

    await saveSpace(space);

    return NextResponse.json({
      success: true,
      message: `Space "${space.name}" saved successfully`,
    });
  } catch (error: any) {
    console.error('[API] Error saving space:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save space' },
      { status: 500 }
    );
  }
}
