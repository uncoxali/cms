import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!roomId) {
        return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
    }

    let query = db('neurofy_chat_messages')
        .where({ room_id: roomId })
        .orderBy('created_at', 'desc')
        .limit(limit);

    if (before) {
        query = query.where('created_at', '<', before);
    }

    const messages = await query;

    await db('neurofy_chat_rooms')
        .where({ id: roomId })
        .update({ updated_at: new Date().toISOString() });

    return NextResponse.json({ data: messages.reverse() });
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    if (!body.room_id || !body.message) {
        return NextResponse.json({ error: 'room_id and message are required' }, { status: 400 });
    }

    const [id] = await db('neurofy_chat_messages').insert({
        room_id: body.room_id,
        user_id: auth.userId,
        user_email: auth.email,
        message: body.message,
        type: body.type || 'text',
        created_at: new Date().toISOString(),
    });

    await db('neurofy_chat_rooms')
        .where({ id: body.room_id })
        .update({ updated_at: new Date().toISOString() });

    return NextResponse.json({
        data: {
            id,
            room_id: body.room_id,
            user_id: auth.userId,
            user_email: auth.email,
            message: body.message,
            type: body.type || 'text',
            created_at: new Date().toISOString(),
        },
    }, { status: 201 });
}
