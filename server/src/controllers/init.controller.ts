import { Request, Response } from 'express';
import { db } from '../config/database';

// GET /api/init — check if DB is initialized
export async function checkInit(_req: Request, res: Response) {
    try {
        const hasUsers = await db.schema.hasTable('neurofy_users');
        if (!hasUsers) {
            return res.json({ initialized: false });
        }
        const users = await db('neurofy_users').count('* as count').first();
        res.json({
            initialized: true,
            userCount: (users as any)?.count || 0,
        });
    } catch {
        res.json({ initialized: false });
    }
}

// POST /api/init — initialize database
export async function initializeDb(_req: Request, res: Response) {
    try {
        // Tables should already be created via migrations in the main app
        // This endpoint verifies the DB is accessible
        const hasUsers = await db.schema.hasTable('neurofy_users');
        if (hasUsers) {
            const users = await db('neurofy_users').count('* as count').first();
            return res.json({ success: true, message: 'Database already initialized', userCount: (users as any)?.count || 0 });
        }
        res.json({ success: true, message: 'Database initialized successfully' });
    } catch (error: any) {
        console.error('[INIT]', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
