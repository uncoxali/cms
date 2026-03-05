import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

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
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    return verifyToken(token);
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
