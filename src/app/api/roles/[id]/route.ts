import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

// PATCH /api/roles/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.admin_access !== undefined) updateData.admin_access = body.admin_access;
    if (body.app_access !== undefined) updateData.app_access = body.app_access;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.permissions !== undefined) {
        let perms = body.permissions;
        if (Array.isArray(perms)) {
            perms = { collections: perms, _modules: {}, _api: {}, _pages: {} };
        }
        updateData.permissions_json = JSON.stringify(perms);
    }

    await db('neurofy_roles').where('id', id).update(updateData);

    await db('neurofy_activity').insert({
        action: 'update', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_roles', item: id,
        meta_json: JSON.stringify(body),
    });

    const role = await db('neurofy_roles').where('id', id).first();
    return NextResponse.json({ data: { ...role, permissions: JSON.parse(role.permissions_json || '{}') } });
}

// DELETE /api/roles/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const db = getDb();

    // Check if any users have this role
    const users = await db('neurofy_users').where('role', id).count('* as count').first();
    const userCount = (users as any)?.count || 0;
    if (userCount > 0) {
        return NextResponse.json({
            error: `Cannot delete this role because ${userCount} user${userCount > 1 ? 's are' : ' is'} assigned to it. Please reassign or remove the users first.`
        }, { status: 400 });
    }

    await db('neurofy_roles').where('id', id).delete();
    return NextResponse.json({ success: true });
}
