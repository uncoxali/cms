import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const db = getDb();

        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.email', email)
            .where('neurofy_users.status', 'active')
            .select(
                'neurofy_users.id',
                'neurofy_users.email',
                'neurofy_users.password_hash',
                'neurofy_users.first_name',
                'neurofy_users.last_name',
                'neurofy_users.avatar',
                'neurofy_users.role as role_id',
                'neurofy_roles.name as role_name',
                'neurofy_roles.admin_access',
                'neurofy_roles.app_access',
                'neurofy_roles.permissions_json'
            )
            .first();

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate Token
        const token = await generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.role_id,
            adminAccess: !!user.admin_access,
        });

        // Update last_access
        await db('neurofy_users').where('id', user.id).update({ last_access: new Date().toISOString() });

        // Set Cookie and Return Data
        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch { permissions = []; }

        const response = NextResponse.json({
            access_token: token,
            expires: 60 * 60 * 24 * 7,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || 'Admin',
                last_name: user.last_name || 'User',
                avatar: user.avatar || null,
                role: user.role_id,
                role_name: user.role_name,
                admin_access: !!user.admin_access,
                app_access: user.app_access !== 0,
                permissions,
            }
        });

        response.cookies.set('session', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return response;
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
