import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
    roleId: string;
    adminAccess: boolean;
}
export interface AuthenticatedRequest extends Request {
    auth?: JwtPayload;
}
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateToken(payload: JwtPayload, expirationDays?: number): Promise<string>;
export declare function verifyToken(token: string): Promise<JwtPayload | null>;
export declare function decodeToken(token: string): JwtPayload | null;
export declare function extractToken(req: Request): string | null;
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireEditor(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
