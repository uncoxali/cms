import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const JWT_SECRET = new TextEncoder().encode(config.jwtSecret);

export interface JwtPayload {
    userId: string;
    email: string;
    roleId: string;
    adminAccess: boolean;
}

export interface AuthenticatedRequest extends Request {
    auth?: JwtPayload;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// JWT Token operations
export async function generateToken(payload: JwtPayload, expirationDays: number = 7): Promise<string> {
    return new jose.SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expirationDays}d`)
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload as unknown as JwtPayload;
    } catch {
        return null;
    }
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        return {
            userId: payload.userId,
            email: payload.email,
            roleId: payload.roleId,
            adminAccess: payload.adminAccess === true || payload.adminAccess === 1 || payload.adminAccess === '1',
        };
    } catch {
        return null;
    }
}

// Extract token from request
export function extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    const cookieToken = (req as any).cookies?.session;
    if (cookieToken) return cookieToken;
    
    return null;
}

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = extractToken(req);
    
    if (!token) {
        res.status(401).json({ error: 'Unauthorized - No token provided' });
        return;
    }

    const payload = decodeToken(token);
    if (!payload) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
    }

    req.auth = payload;
    next();
}

// Admin authorization middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    requireAuth(req, res, () => {
        if (!req.auth?.adminAccess) {
            res.status(403).json({ error: 'Forbidden - Admin access required' });
            return;
        }
        next();
    });
}

// Editor authorization middleware (admin or editor role)
export function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    requireAuth(req, res, async () => {
        if (req.auth?.adminAccess) {
            next();
            return;
        }

        // Import db here to avoid circular dependency
        const { db } = await import('../config/database');
        const role = await db('neurofy_roles').where('id', req.auth!.roleId).first();
        
        if (!role) {
            res.status(403).json({ error: 'Forbidden - Role not found' });
            return;
        }

        let perms: any = [];
        try { 
            perms = role.permissions_json ? JSON.parse(role.permissions_json) : []; 
        } catch { 
            perms = []; 
        }

        if (Array.isArray(perms)) {
            const hasWrite = perms.some((p: any) =>
                (p.create && p.create !== 'none') ||
                (p.update && p.update !== 'none') ||
                (p.delete && p.delete !== 'none')
            );
            if (hasWrite) {
                next();
                return;
            }
        }

        res.status(403).json({ error: 'Forbidden - Editor or admin access required' });
    });
}
