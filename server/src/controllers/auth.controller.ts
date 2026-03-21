import { Response } from 'express';
import { db } from '../config/database';
import { verifyPassword, generateToken, verifyToken, hashPassword, AuthenticatedRequest } from '../utils/auth';
import { toDbDate } from '../utils/date';

export async function login(req: AuthenticatedRequest, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.email', email)
            .where('neurofy_users.status', 'active')
            .select(
                'neurofy_users.*',
                'neurofy_roles.name as role_name',
                'neurofy_roles.admin_access',
                'neurofy_roles.app_access',
                'neurofy_roles.permissions_json'
            )
            .first();

        if (!user) {
            console.log(`[AUTH] Login failed: User not found for email: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await verifyPassword(password, user.password_hash);
        if (!isMatch) {
            console.log(`[AUTH] Login failed: Password mismatch for email: ${email}`);
            console.log(`[AUTH] Provided: ${password.length} chars, Hash in DB: ${user.password_hash}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get token expiration from settings
        let tokenExpirationDays = 7;
        try {
            const settings = await db('neurofy_settings').first();
            if (settings?.token_expiration) tokenExpirationDays = settings.token_expiration;
        } catch {}

        const token = await generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.role,
            adminAccess: !!user.admin_access,
        }, tokenExpirationDays);

        // Update last access
    await db('neurofy_users').where('id', user.id).update({ last_access: toDbDate() });

        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch {}

        res.json({
            access_token: token,
            expires: 60 * 60 * 24 * tokenExpirationDays,
            token_expiration_days: tokenExpirationDays,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || 'Admin',
                last_name: user.last_name || 'User',
                avatar: user.avatar || null,
                role: user.role,
                role_name: user.role_name,
                admin_access: !!user.admin_access,
                app_access: user.app_access !== 0,
                permissions,
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
    res.clearCookie('session');
    res.json({ success: true });
}

export async function refreshToken(req: AuthenticatedRequest, res: Response) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || (req as any).cookies?.session;
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const payload = await verifyToken(token);
        if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', payload.userId)
            .where('neurofy_users.status', 'active')
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.app_access', 'neurofy_roles.permissions_json')
            .first();

        if (!user) return res.status(401).json({ error: 'User not found' });

        let tokenExpirationDays = 7;
        try {
            const settings = await db('neurofy_settings').first();
            if (settings?.token_expiration) tokenExpirationDays = settings.token_expiration;
        } catch {}

        const newToken = await generateToken({
            userId: user.id,
            email: user.email,
            roleId: user.role,
            adminAccess: !!user.admin_access,
        }, tokenExpirationDays);

        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch {}

        res.json({
            access_token: newToken,
            expires: 60 * 60 * 24 * tokenExpirationDays,
            token_expiration_days: tokenExpirationDays,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar: user.avatar,
                role: user.role,
                role_name: user.role_name,
                admin_access: !!user.admin_access,
                app_access: user.app_access !== 0,
                permissions,
            }
        });
    } catch (error: any) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
    try {
        const user = await db('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', req.auth!.userId)
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.app_access', 'neurofy_roles.permissions_json')
            .first();

        if (!user) return res.status(404).json({ error: 'User not found' });

        let permissions = [];
        try { permissions = user.permissions_json ? JSON.parse(user.permissions_json) : []; } catch {}

        res.json({
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar: user.avatar,
                role_id: user.role,
                role_name: user.role_name,
                admin_access: !!user.admin_access,
                app_access: user.app_access !== 0,
                permissions,
            }
        });
    } catch (error: any) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
