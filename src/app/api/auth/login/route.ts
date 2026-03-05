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

        const user = await db('directus_users')
            .leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
            .where('directus_users.email', email)
            .where('directus_users.status', 'active')
            .select(
                'directus_users.id',
                'directus_users.email',
                'directus_users.password_hash',
                'directus_users.first_name',
                'directus_users.last_name',
                'directus_users.role as role_id',
                'directus_roles.name as role_name',
                'directus_roles.admin_access'
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
        await db('directus_users').where('id', user.id).update({ last_access: new Date().toISOString() });

        // Set Cookie and Return Data
        const response = NextResponse.json({
            access_token: token,
            expires: 60 * 60 * 24 * 7,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || 'Admin',
                last_name: user.last_name || 'User',
                role: user.role_id,
                role_name: user.role_name,
                admin_access: user.admin_access ?? false,
            }
        });

        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
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
