import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/templates — list templates
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const url = new URL(request.url);
    const collection = url.searchParams.get('collection');

    try {
        // Check if templates table exists
        let hasTable = false;
        try {
            const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='neurofy_templates'");
            hasTable = tables.length > 0 || (tables[0] && tables[0].name);
        } catch {
            hasTable = false;
        }

        if (!hasTable) {
            await db.schema.createTable('neurofy_templates', (table) => {
                table.string('id').primary();
                table.string('name').notNullable();
                table.text('description');
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('category').defaultTo('general');
                table.string('created_by');
                table.timestamp('created_at').defaultTo(db.fn.now());
                table.timestamp('updated_at').defaultTo(db.fn.now());
            });
            return NextResponse.json({ data: [] });
        }

        let query = db('neurofy_templates').select('*');
        if (collection) query = query.where('collection', collection);

        const templates = await query.orderBy('created_at', 'desc');

        const data = templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            collection: t.collection,
            data: t.data_json ? JSON.parse(t.data_json) : {},
            category: t.category || 'general',
            createdAt: t.created_at,
            updatedAt: t.updated_at,
        }));

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/templates — create template
export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const body = await request.json();

    try {
        const id = uuidv4();
        const now = new Date().toISOString();

        await db('neurofy_templates').insert({
            id,
            name: body.name,
            description: body.description || '',
            collection: body.collection,
            data_json: JSON.stringify(body.data || {}),
            category: body.category || 'general',
            created_by: auth.email,
            created_at: now,
            updated_at: now,
        });

        return NextResponse.json({ data: { id } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
