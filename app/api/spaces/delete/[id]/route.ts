/**
 * API Route: Delete Space
 * DELETE /api/spaces/delete/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteSpace } from '@/lib/storage';

export async function DELETE(
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

    await deleteSpace(spaceId);

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully',
    });
  } catch (error: any) {
    console.error('[API] Error deleting space:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete space' },
      { status: 500 }
    );
  }
}
