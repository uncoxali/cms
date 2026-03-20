import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-key-change-this'
);

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function generateToken(payload: any): Promise<string> {
    return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (err) {
        return null;
    }
}

export async function getSession(request?: NextRequest) {
    const cookieStore = request ? request.cookies : await cookies();
    const token =
        request?.headers.get('Authorization')?.replace('Bearer ', '') ||
        cookieStore.get('session')?.value;

    if (!token) return null;

    return verifyToken(token);
}

type AuthResult = { userId: string; email: string; roleId: string; adminAccess: boolean };
type AuthCheck = { authorized: true; auth: AuthResult } | { authorized: false; response: NextResponse };

function deny(error: string, status: number): { authorized: false; response: NextResponse } {
    return { authorized: false, response: NextResponse.json({ error }, { status }) };
}

export function requireAdmin(auth: AuthResult | null): AuthCheck {
    if (!auth) return deny('Unauthorized', 401);
    if (!auth.adminAccess) return deny('Admin access required', 403);
    return { authorized: true, auth };
}

export async function requireEditor(auth: AuthResult | null): Promise<AuthCheck> {
    if (!auth) return deny('Unauthorized', 401);
    if (auth.adminAccess) return { authorized: true, auth };

    // Check actual role permissions from DB
    const { getDb } = await import('@/lib/db');
    const db = getDb();
    const role = await db('neurofy_roles').where('id', auth.roleId).first().catch(() => null);
    if (!role) return deny('Role not found', 403);

    let perms: any = [];
    try { perms = role.permissions_json ? JSON.parse(role.permissions_json) : []; } catch { perms = []; }

    // Legacy _all format
    if (!Array.isArray(perms) && perms._all) {
        if (perms._all.create || perms._all.update || perms._all.delete) {
            return { authorized: true, auth };
        }
        return deny('Editor or admin access required', 403);
    }

    // Array format: check if any collection has write access
    if (Array.isArray(perms)) {
        const hasWrite = perms.some((p: any) =>
            (p.create && p.create !== 'none') ||
            (p.update && p.update !== 'none') ||
            (p.delete && p.delete !== 'none')
        );
        if (hasWrite) return { authorized: true, auth };
    }

    return deny('Editor or admin access required', 403);
}

export function getAuthFromRequest(request: NextRequest): {
    userId: string;
    email: string;
    roleId: string;
    adminAccess: boolean;
} | null {
    // Prefer explicit Authorization header over cookie to avoid stale cookie sessions
    // overriding the current client token (e.g. after switching accounts).
    const token =
        request.headers.get('Authorization')?.replace('Bearer ', '') ||
        request.cookies.get('session')?.value;

    if (!token) return null;

    try {
        // jose.jwtVerify is async, but we do a synchronous decode for middleware use
        // The token is already verified by middleware; here we just decode the payload.
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

        const rawAdminAccess = payload.adminAccess ?? payload.admin_access;
        const adminAccess =
            rawAdminAccess === true ||
            rawAdminAccess === 1 ||
            rawAdminAccess === '1' ||
            rawAdminAccess === 'true';

        return {
            userId: payload.userId,
            email: payload.email,
            roleId: payload.roleId,
            adminAccess,
        };
    } catch {
        return null;
    }
}
