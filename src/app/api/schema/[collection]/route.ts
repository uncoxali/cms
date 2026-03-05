import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ collection: string }>;
}

// GET /api/schema/[collection] — introspect single table
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { collection } = await params;
    const db = getDb();

    try {
        const exists = await db.schema.hasTable(collection);
        if (!exists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

        const columns = await db.raw(`PRAGMA table_info('${collection}')`);
        const foreignKeys = await db.raw(`PRAGMA foreign_key_list('${collection}')`);
        const meta = await db('directus_collections_meta').where('collection', collection).first().catch(() => null);

        const fields = columns.map((col: any) => {
            const fk = foreignKeys.find((fk: any) => fk.from === col.name);
            return {
                name: col.name,
                type: col.type || 'TEXT',
                nullable: col.notnull === 0,
                default_value: col.dflt_value,
                is_primary_key: col.pk === 1,
                foreign_key: fk ? { table: fk.table, column: fk.to } : null,
            };
        });

        return NextResponse.json({
            collection,
            label: meta?.label || collection,
            icon: meta?.icon || 'database',
            description: meta?.description || null,
            fields,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/schema/[collection] — create new table
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { collection } = await params;
    const db = getDb();
    const body = await request.json();
    const { label, icon, description, fields } = body;

    try {
        const exists = await db.schema.hasTable(collection);
        if (exists) return NextResponse.json({ error: 'Collection already exists' }, { status: 409 });

        // Create table
        await db.schema.createTable(collection, (t) => {
            // Always add id
            t.increments('id').primary();

            if (fields && Array.isArray(fields)) {
                for (const field of fields) {
                    let col;
                    switch (field.type?.toLowerCase()) {
                        case 'integer': case 'int': col = t.integer(field.name); break;
                        case 'float': case 'decimal': case 'real': col = t.float(field.name); break;
                        case 'boolean': case 'bool': col = t.boolean(field.name); break;
                        case 'text': col = t.text(field.name); break;
                        case 'date': col = t.date(field.name); break;
                        case 'datetime': case 'timestamp': col = t.timestamp(field.name); break;
                        case 'json': col = t.text(field.name); break; // SQLite stores JSON as TEXT
                        default: col = t.string(field.name); break;
                    }
                    if (field.nullable === false) col.notNullable();
                    if (field.default_value !== undefined) col.defaultTo(field.default_value);
                    if (field.unique) col.unique();
                }
            }

            // Auto-add timestamps
            t.timestamp('date_created').defaultTo(db.fn.now());
            t.timestamp('date_updated').defaultTo(db.fn.now());
        });

        // Save metadata
        await db('directus_collections_meta').insert({
            collection,
            label: label || collection,
            icon: icon || 'database',
            description: description || null,
        });

        // Log activity
        await db('directus_activity').insert({
            action: 'create',
            user: auth.email,
            user_id: auth.userId,
            collection: 'directus_collections',
            item: collection,
            meta_json: JSON.stringify({ label, fields: fields?.length || 0 }),
        });

        return NextResponse.json({ success: true, collection });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/schema/[collection] — drop table
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { collection } = await params;
    const db = getDb();

    try {
        const systemTables = ['directus_users', 'directus_roles', 'directus_activity', 'directus_files', 'directus_folders', 'directus_flows', 'directus_flow_logs', 'directus_settings', 'directus_collections_meta'];
        if (systemTables.includes(collection)) {
            return NextResponse.json({ error: 'Cannot delete system collections' }, { status: 403 });
        }

        await db.schema.dropTableIfExists(collection);
        await db('directus_collections_meta').where('collection', collection).delete();

        await db('directus_activity').insert({
            action: 'delete',
            user: auth.email,
            user_id: auth.userId,
            collection: 'directus_collections',
            item: collection,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
