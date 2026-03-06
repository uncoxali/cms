import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest, requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users — list all users (admin only)
export async function GET(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();

    try {
        const users = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .select(
                'neurofy_users.id', 'neurofy_users.email',
                'neurofy_users.first_name', 'neurofy_users.last_name',
                'neurofy_users.status', 'neurofy_users.avatar',
                'neurofy_users.last_access', 'neurofy_users.created_at',
                'neurofy_users.role as role_id',
                'neurofy_roles.name as role_name',
                'neurofy_roles.admin_access'
            );

        return NextResponse.json({ data: users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/users — create/invite user (admin only)
export async function POST(request: NextRequest) {
    const check = requireAdmin(getAuthFromRequest(request));
    if (!check.authorized) return check.response;

    const db = getDb();
    const body = await request.json();

    try {
        const { email, password, first_name, last_name, role } = body;
        if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

        const existing = await db('neurofy_users').where('email', email).first();
        if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

        const id = `user_${Date.now().toString(36)}`;
        const password_hash = await bcrypt.hash(password, 10);

        await db('neurofy_users').insert({ id, email, password_hash, first_name, last_name, role, status: 'active' });

        await db('neurofy_activity').insert({
            action: 'create', user: check.auth.email, user_id: check.auth.userId,
            collection: 'neurofy_users', item: id,
            meta_json: JSON.stringify({ email, role }),
        });

        return NextResponse.json({ data: { id, email, first_name, last_name, role, status: 'active' } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
