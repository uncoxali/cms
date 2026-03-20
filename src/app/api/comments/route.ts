import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const collection = searchParams.get('collection');
  const itemId = searchParams.get('itemId');

  if (!collection || !itemId) {
    return NextResponse.json({ error: 'Missing collection or itemId' }, { status: 400 });
  }

  try {
    const db = getDb();
    const comments = await db('field_comments')
      .where({ collection, item_id: itemId })
      .orderBy('created_at', 'desc')
      .select('*');

    const data = (comments as any[]).map(c => ({
      id: c.id,
      collection: c.collection,
      itemId: c.item_id,
      fieldName: c.field_name,
      userId: c.user_id,
      userName: c.user_name,
      userAvatar: c.user_avatar,
      content: c.content,
      timestamp: c.created_at,
      resolved: Boolean(c.resolved),
      resolvedBy: c.resolved_by,
      resolvedAt: c.resolved_at,
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('Comments GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collection, itemId, fieldName, userId, userName, userAvatar, content } = body;

    if (!collection || !itemId || !fieldName || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const timestamp = new Date().toISOString();

    await db('field_comments').insert({
      id,
      collection,
      item_id: String(itemId),
      field_name: fieldName,
      user_id: String(userId),
      user_name: userName,
      user_avatar: userAvatar || null,
      content,
      resolved: 0,
      created_at: timestamp,
    });

    const data = {
      id,
      collection,
      itemId,
      fieldName,
      userId,
      userName,
      userAvatar,
      content,
      timestamp,
      resolved: false,
    };

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('Comments POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
