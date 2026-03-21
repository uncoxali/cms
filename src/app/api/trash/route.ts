import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/trash — list trashed items
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');

    try {
        // Check if neurofy_trash table exists
        let hasTrashTable = false;
        try {
            const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='neurofy_trash'");
            hasTrashTable = tables.length > 0 || (tables[0] && tables[0].name);
        } catch {
            hasTrashTable = false;
        }

        // Create trash table if it doesn't exist
        if (!hasTrashTable) {
            await db.schema.createTable('neurofy_trash', (table) => {
                table.increments('trash_id').primary();
                table.string('item_id').notNullable();
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('deleted_by');
                table.timestamp('deleted_at').defaultTo(db.fn.now());
                table.timestamp('expires_at');
            });
            // Create unique index
            await db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
            return NextResponse.json({ data: [] });
        }
        
        // Check if columns exist and add missing ones
        try {
            const columns = await db.raw("PRAGMA table_info('neurofy_trash')");
            const colNames = columns.map((c: any) => c.name);
            
            if (!colNames.includes('trash_id')) {
                await db.schema.table('neurofy_trash', (table) => {
                    table.increments('trash_id');
                });
            }
            if (!colNames.includes('item_id')) {
                await db.schema.table('neurofy_trash', (table) => {
                    table.string('item_id');
                });
            }
        } catch {}

        let query = db('neurofy_trash').select('*');
        if (collection) query = query.where('collection', collection);

        const items = await query.orderBy('deleted_at', 'desc');

        // Get collections for labels
        let collections: Record<string, string> = {};
        try {
            const cols = await db('neurofy_collections').select('name', 'label');
            cols.forEach((c: any) => { collections[c.name] = c.label || c.name; });
        } catch {}

        const data = items.map((item: any) => ({
            id: item.item_id || item.id,
            trashId: item.trash_id,
            collection: item.collection,
            collectionLabel: collections[item.collection] || item.collection,
            data: item.data_json ? JSON.parse(item.data_json) : {},
            deletedBy: item.deleted_by || 'Unknown',
            deletedAt: item.deleted_at,
            expiresAt: item.expires_at,
        }));

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/trash — empty trash (batch action)
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    try {
        if (body.action === 'empty') {
            await db('neurofy_trash').delete();
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
