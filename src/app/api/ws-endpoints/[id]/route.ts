import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const row = await db('neurofy_ws_endpoints').where({ id }).first();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
        data: {
            ...row,
            events: JSON.parse(row.events_json || '[]'),
            roles: JSON.parse(row.roles_json || '[]'),
        },
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const updates: any = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.path !== undefined) updates.path = body.path;
    if (body.collection !== undefined) updates.collection = body.collection;
    if (body.events !== undefined) updates.events_json = JSON.stringify(body.events);
    if (body.auth_required !== undefined) updates.auth_required = body.auth_required ? 1 : 0;
    if (body.roles !== undefined) updates.roles_json = JSON.stringify(body.roles);
    if (body.status !== undefined) updates.status = body.status;
    if (body.description !== undefined) updates.description = body.description;

    await db('neurofy_ws_endpoints').where({ id }).update(updates);
    const updated = await db('neurofy_ws_endpoints').where({ id }).first();
    return NextResponse.json({
        data: {
            ...updated,
            events: JSON.parse(updated.events_json || '[]'),
            roles: JSON.parse(updated.roles_json || '[]'),
        },
    });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const { id } = await params;
    const db = getDb();
    await db('neurofy_ws_endpoints').where({ id }).delete();
    return NextResponse.json({ success: true });
}
