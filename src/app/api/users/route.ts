import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users — list all users
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();

    try {
        const users = await db('directus_users')
            .leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
            .select(
                'directus_users.id', 'directus_users.email',
                'directus_users.first_name', 'directus_users.last_name',
                'directus_users.status', 'directus_users.avatar',
                'directus_users.last_access', 'directus_users.created_at',
                'directus_users.role as role_id',
                'directus_roles.name as role_name',
                'directus_roles.admin_access'
            );

        return NextResponse.json({ data: users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/users — create/invite user
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const db = getDb();
    const body = await request.json();

    try {
        const { email, password, first_name, last_name, role } = body;
        if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

        const existing = await db('directus_users').where('email', email).first();
        if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

        const id = `user_${Date.now().toString(36)}`;
        const password_hash = await bcrypt.hash(password, 10);

        await db('directus_users').insert({ id, email, password_hash, first_name, last_name, role, status: 'active' });

        await db('directus_activity').insert({
            action: 'create', user: auth.email, user_id: auth.userId,
            collection: 'directus_users', item: id,
            meta_json: JSON.stringify({ email, role }),
        });

        return NextResponse.json({ data: { id, email, first_name, last_name, role, status: 'active' } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
