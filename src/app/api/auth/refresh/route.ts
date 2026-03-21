import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, generateToken } from '@/lib/auth';

// POST /api/auth/refresh — refresh JWT token
export async function POST(request: NextRequest) {
    try {
        // Get the current token from Authorization header or cookie
        const token =
            request.headers.get('Authorization')?.replace('Bearer ', '') ||
            request.cookies.get('session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        // Verify the current token
        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const db = getDb();

        // Fetch fresh user data from DB
        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', payload.userId as string)
            .where('neurofy_users.status', 'active')
            .select(
                'neurofy_users.id',
                'neurofy_users.email',
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
            return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
        }

        // Get token expiration from settings
        let tokenExpirationDays = 7;
        try {
            const settings = await db('neurofy_settings').where('key', 'token_expiration').first();
            if (settings && settings.value) {
                tokenExpirationDays = parseInt(settings.value) || 7;
            }
        } catch {}

        // Generate new token with fresh user data
        const newToken = await generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.role_id,
            adminAccess: !!user.admin_access,
        }, tokenExpirationDays);

        // Parse permissions
        let permissions = [];
        try {
            permissions = user.permissions_json ? JSON.parse(user.permissions_json) : [];
        } catch {
            permissions = [];
        }

        const response = NextResponse.json({
            access_token: newToken,
            expires: 60 * 60 * 24 * tokenExpirationDays,
            token_expiration_days: tokenExpirationDays,
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

        // Update session cookie
        response.cookies.set('session', newToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * tokenExpirationDays,
            path: '/'
        });

        return response;
    } catch (error: any) {
        console.error('Token Refresh Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
