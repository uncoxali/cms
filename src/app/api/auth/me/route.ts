import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getDb();

        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', auth.userId)
            .select(
                'neurofy_users.id',
                'neurofy_users.email',
                'neurofy_users.first_name',
                'neurofy_users.last_name',
                'neurofy_users.status',
                'neurofy_users.avatar',
                'neurofy_users.role as role_id',
                'neurofy_roles.name as role_name',
                'neurofy_roles.admin_access',
                'neurofy_roles.app_access',
                'neurofy_roles.permissions_json'
            )
            .first();

        if (!user || user.status !== 'active') {
            return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
        }

        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch { permissions = []; }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                avatar: user.avatar || null,
                role_id: user.role_id,
                role_name: user.role_name,
                admin_access: !!user.admin_access,
                app_access: user.app_access !== 0,
                permissions,
            },
        });
    } catch (error: any) {
        console.error('[AUTH/ME]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
