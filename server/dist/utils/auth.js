"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.decodeToken = decodeToken;
exports.extractToken = extractToken;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.requireEditor = requireEditor;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jose = __importStar(require("jose"));
const config_1 = require("../config");
const JWT_SECRET = new TextEncoder().encode(config_1.config.jwtSecret);
// Password hashing
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
// JWT Token operations
async function generateToken(payload, expirationDays = 7) {
    return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expirationDays}d`)
        .sign(JWT_SECRET);
}
async function verifyToken(token) {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload;
    }
    catch {
        return null;
    }
}
function decodeToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        return {
            userId: payload.userId,
            email: payload.email,
            roleId: payload.roleId,
            adminAccess: payload.adminAccess === true || payload.adminAccess === 1 || payload.adminAccess === '1',
        };
    }
    catch {
        return null;
    }
}
// Extract token from request
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const cookieToken = req.cookies?.session;
    if (cookieToken)
        return cookieToken;
    return null;
}
// Authentication middleware
function requireAuth(req, res, next) {
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
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.auth?.adminAccess) {
            res.status(403).json({ error: 'Forbidden - Admin access required' });
            return;
        }
        next();
    });
}
// Editor authorization middleware (admin or editor role)
function requireEditor(req, res, next) {
    requireAuth(req, res, async () => {
        if (req.auth?.adminAccess) {
            next();
            return;
        }
        // Import db here to avoid circular dependency
        const { db } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const role = await db('neurofy_roles').where('id', req.auth.roleId).first();
        if (!role) {
            res.status(403).json({ error: 'Forbidden - Role not found' });
            return;
        }
        let perms = [];
        try {
            perms = role.permissions_json ? JSON.parse(role.permissions_json) : [];
        }
        catch {
            perms = [];
        }
        if (Array.isArray(perms)) {
            const hasWrite = perms.some((p) => (p.create && p.create !== 'none') ||
                (p.update && p.update !== 'none') ||
                (p.delete && p.delete !== 'none'));
            if (hasWrite) {
                next();
                return;
            }
        }
        res.status(403).json({ error: 'Forbidden - Editor or admin access required' });
    });
}
//# sourceMappingURL=auth.js.map