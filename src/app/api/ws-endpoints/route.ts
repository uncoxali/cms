import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const rows = await db('neurofy_ws_endpoints').orderBy('created_at', 'desc');
    const data = rows.map((r: any) => ({
        ...r,
        events: JSON.parse(r.events_json || '[]'),
        roles: JSON.parse(r.roles_json || '[]'),
    }));
    return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    const body = await request.json();
    const id = `wse_${uuid().replace(/-/g, '').slice(0, 12)}`;

    const row = {
        id,
        name: body.name || 'Untitled Endpoint',
        path: body.path || `/ws/${id}`,
        collection: body.collection || null,
        events_json: JSON.stringify(body.events || []),
        auth_required: body.auth_required !== false ? 1 : 0,
        roles_json: JSON.stringify(body.roles || []),
        status: body.status || 'active',
        description: body.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await db('neurofy_ws_endpoints').insert(row);
    return NextResponse.json({ data: { ...row, events: body.events || [], roles: body.roles || [] } }, { status: 201 });
}
