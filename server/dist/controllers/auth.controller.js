"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.refreshToken = refreshToken;
exports.getMe = getMe;
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const date_1 = require("../utils/date");
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await (0, database_1.db)('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.email', email)
            .where('neurofy_users.status', 'active')
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.app_access', 'neurofy_roles.permissions_json')
            .first();
        if (!user || !(await (0, auth_1.verifyPassword)(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Get token expiration from settings
        let tokenExpirationDays = 7;
        try {
            const settings = await (0, database_1.db)('neurofy_settings').first();
            if (settings?.token_expiration)
                tokenExpirationDays = settings.token_expiration;
        }
        catch { }
        const token = await (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            roleId: user.role,
            adminAccess: !!user.admin_access,
        }, tokenExpirationDays);
        // Update last access
        await (0, database_1.db)('neurofy_users').where('id', user.id).update({ last_access: (0, date_1.toDbDate)() });
        let permissions = [];
        try {
            permissions = user.permissions_json ? JSON.parse(user.permissions_json) : [];
        }
        catch { }
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
async function logout(req, res) {
    res.clearCookie('session');
    res.json({ success: true });
}
async function refreshToken(req, res) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.session;
        if (!token)
            return res.status(401).json({ error: 'No token provided' });
        const payload = await (0, auth_1.verifyToken)(token);
        if (!payload)
            return res.status(401).json({ error: 'Invalid or expired token' });
        const user = await (0, database_1.db)('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', payload.userId)
            .where('neurofy_users.status', 'active')
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.app_access', 'neurofy_roles.permissions_json')
            .first();
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        let tokenExpirationDays = 7;
        try {
            const settings = await (0, database_1.db)('neurofy_settings').first();
            if (settings?.token_expiration)
                tokenExpirationDays = settings.token_expiration;
        }
        catch { }
        const newToken = await (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            roleId: user.role,
            adminAccess: !!user.admin_access,
        }, tokenExpirationDays);
        let permissions = [];
        try {
            permissions = user.permissions_json ? JSON.parse(user.permissions_json) : [];
        }
        catch { }
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
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMe(req, res) {
    try {
        const user = await (0, database_1.db)('neurofy_users')
            .leftJoin('neurofy_roles', 'neurofy_users.role', 'neurofy_roles.id')
            .where('neurofy_users.id', req.auth.userId)
            .select('neurofy_users.*', 'neurofy_roles.name as role_name', 'neurofy_roles.admin_access', 'neurofy_roles.app_access', 'neurofy_roles.permissions_json')
            .first();
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        let permissions = [];
        try {
            permissions = user.permissions_json ? JSON.parse(user.permissions_json) : [];
        }
        catch { }
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
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=auth.controller.js.map