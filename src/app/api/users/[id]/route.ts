import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const user = await db('neurofy_users')
        .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
        .where('neurofy_users.id', id)
        .select('neurofy_users.id', 'neurofy_users.email', 'neurofy_users.first_name', 'neurofy_users.last_name', 'neurofy_users.status', 'neurofy_users.role as role_id', 'neurofy_roles.name as role_name', 'neurofy_users.last_access')
        .first();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ data: user });
}

// PATCH /api/users/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    // Don't allow password update here (use separate endpoint)
    delete body.password_hash;
    delete body.password;

    await db('neurofy_users').where('id', id).update(body);

    await db('neurofy_activity').insert({
        action: 'update', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_users', item: id,
        meta_json: JSON.stringify(body),
    });

    const updated = await db('neurofy_users').where('id', id).first();
    return NextResponse.json({ data: updated });
}

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    if (id === auth.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

    await db('neurofy_users').where('id', id).delete();
    await db('neurofy_activity').insert({
        action: 'delete', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_users', item: id,
    });

    return NextResponse.json({ success: true });
}
