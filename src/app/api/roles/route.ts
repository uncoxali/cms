import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/roles
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const roles = await db('neurofy_roles').select('*');

    // Get user counts per role
    const userCounts = await db('neurofy_users')
        .select('role')
        .count('* as count')
        .groupBy('role');
    const countMap: Record<string, number> = {};
    for (const row of userCounts) {
        countMap[row.role] = Number((row as any).count);
    }

    const data = roles.map((r: any) => ({
        ...r,
        user_count: countMap[r.id] || 0,
        permissions: r.permissions_json ? JSON.parse(r.permissions_json) : {},
        permissions_json: undefined,
    }));

    return NextResponse.json({ data });
}

// POST /api/roles
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = getDb();
    const body = await request.json();
    const id = `role_${Date.now().toString(36)}`;

    const rawPerms = body.permissions || [];
    const permissionsPayload =
        Array.isArray(rawPerms)
            ? { collections: rawPerms, _modules: {}, _api: {}, _pages: {} }
            : {
                collections: Array.isArray(rawPerms.collections) ? rawPerms.collections : [],
                _modules: rawPerms._modules || {},
                _api: rawPerms._api || {},
                _pages: rawPerms._pages || {},
            };

    await db('neurofy_roles').insert({
        id,
        name: body.name,
        description: body.description || null,
        admin_access: body.admin_access || false,
        app_access: body.app_access !== false,
        icon: body.icon || 'supervised_user_circle',
        permissions_json: JSON.stringify(permissionsPayload),
    });

    // Fetch the newly created role to return proper data
    const newRole = await db('neurofy_roles').where('id', id).first();

    await db('neurofy_activity').insert({
        action: 'create', user: auth.email, user_id: auth.userId,
        collection: 'neurofy_roles', item: id,
        meta_json: JSON.stringify({ name: body.name }),
    });

    // Return the actual role data from DB
    return NextResponse.json({ 
        data: {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            app_access: newRole.app_access,
            admin_access: newRole.admin_access,
            icon: newRole.icon,
            user_count: 0,
            permissions: JSON.parse(newRole.permissions_json || '{}'),
        }
    }, { status: 201 });
}
