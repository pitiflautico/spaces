/**
 * API Route: Load Space
 * GET /api/spaces/load/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadSpace } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spaceId = params.id;

    if (!spaceId) {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      );
    }

    const space = await loadSpace(spaceId);

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      space,
    });
  } catch (error: any) {
    console.error('[API] Error loading space:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load space' },
      { status: 500 }
    );
  }
}
