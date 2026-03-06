import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const rooms = await db('neurofy_chat_rooms').orderBy('updated_at', 'desc');

    const data = rooms
        .map((r: any) => ({
            ...r,
            members: JSON.parse(r.members_json || '[]'),
        }))
        .filter((r: any) => r.type === 'group' || r.members.includes(auth.userId));

    return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();
    const id = `room_${uuid().replace(/-/g, '').slice(0, 12)}`;

    const members = body.members || [auth.userId];
    if (!members.includes(auth.userId)) members.push(auth.userId);

    const row = {
        id,
        name: body.name || (body.type === 'direct' ? 'Direct Message' : 'Group Chat'),
        type: body.type || 'group',
        members_json: JSON.stringify(members),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await db('neurofy_chat_rooms').insert(row);

    await db('neurofy_chat_messages').insert({
        room_id: id,
        user_id: 'system',
        user_email: null,
        message: `Room created by ${auth.email}`,
        type: 'system',
        created_at: new Date().toISOString(),
    });

    return NextResponse.json({ data: { ...row, members } }, { status: 201 });
}
