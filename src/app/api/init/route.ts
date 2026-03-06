import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrate';
import { seed } from '@/lib/db/seed';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        // Ensure data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const db = getDb();

        // Run migrations
        await runMigrations(db);

        // Run seed
        await seed(db);

        return NextResponse.json({ success: true, message: 'Database initialized successfully' });
    } catch (error: any) {
        console.error('[INIT]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// GET to check if DB is initialized
export async function GET() {
    try {
        const db = getDb();
        const hasUsers = await db.schema.hasTable('neurofy_users');
        if (!hasUsers) {
            return NextResponse.json({ initialized: false });
        }
        const users = await db('neurofy_users').count('* as count').first();
        return NextResponse.json({
            initialized: true,
            userCount: users?.count || 0,
        });
    } catch {
        return NextResponse.json({ initialized: false });
    }
}
