import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const user = await db('directus_users')
        .leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
        .where('directus_users.id', id)
        .select('directus_users.id', 'directus_users.email', 'directus_users.first_name', 'directus_users.last_name', 'directus_users.status', 'directus_users.role as role_id', 'directus_roles.name as role_name', 'directus_users.last_access')
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

    await db('directus_users').where('id', id).update(body);

    await db('directus_activity').insert({
        action: 'update', user: auth.email, user_id: auth.userId,
        collection: 'directus_users', item: id,
        meta_json: JSON.stringify(body),
    });

    const updated = await db('directus_users').where('id', id).first();
    return NextResponse.json({ data: updated });
}

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    if (id === auth.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

    await db('directus_users').where('id', id).delete();
    await db('directus_activity').insert({
        action: 'delete', user: auth.email, user_id: auth.userId,
        collection: 'directus_users', item: id,
    });

    return NextResponse.json({ success: true });
}
