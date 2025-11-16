/**
 * API Route: List All Spaces
 * GET /api/spaces/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSpaces } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const spaces = await getAllSpaces();

    return NextResponse.json({
      success: true,
      spaces,
    });
  } catch (error: any) {
    console.error('[API] Error listing spaces:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list spaces' },
      { status: 500 }
    );
  }
}
