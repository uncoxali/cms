import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { resolved, resolvedBy } = body;

    const db = getDb();
    const updateData: Record<string, any> = {};

    if (typeof resolved === 'boolean') {
      updateData.resolved = resolved ? 1 : 0;
      updateData.resolved_at = resolved ? new Date().toISOString() : null;
      if (resolvedBy) updateData.resolved_by = resolvedBy;
    }

    await db('field_comments').where({ id }).update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Comment PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    await db('field_comments').where({ id }).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Comment DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
