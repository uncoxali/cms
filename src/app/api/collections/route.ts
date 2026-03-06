import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

const VALID_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const SYSTEM_TABLES = [
    'neurofy_users',
    'neurofy_roles',
    'neurofy_activity',
    'neurofy_files',
    'neurofy_folders',
    'neurofy_flows',
    'neurofy_flow_logs',
    'neurofy_settings',
    'neurofy_collections_meta',
];

export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const db = getDb();

        const tables = await db.raw(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`
        );

        const result: any[] = [];
        for (const t of tables) {
            const tableName = t.name;
            const columns = await db.raw(`PRAGMA table_info('${tableName}')`);
            const meta = await db('neurofy_collections_meta')
                .where('collection', tableName)
                .first()
                .catch(() => null);

            result.push({
                collection: tableName,
                label: meta?.label || tableName,
                icon: meta?.icon || (SYSTEM_TABLES.includes(tableName) ? 'settings' : 'database'),
                description: meta?.description || null,
                is_system: SYSTEM_TABLES.includes(tableName),
                hidden: meta?.hidden || false,
                fields: columns.map((c: any) => ({
                    name: c.name,
                    type: c.type || 'TEXT',
                    nullable: c.notnull === 0,
                    default_value: c.dflt_value,
                    is_primary_key: c.pk === 1,
                })),
            });
        }

        return NextResponse.json({ data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    try {
        const db = getDb();
        const body = await request.json();
        const { name, label, icon, fields } = body;

        if (!name || !VALID_NAME_REGEX.test(name)) {
            return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
        }

        const exists = await db.schema.hasTable(name);
        if (exists) return NextResponse.json({ error: 'Collection already exists' }, { status: 409 });

        await db.schema.createTable(name, (t) => {
            t.increments('id').primary();

            const RESERVED_COLS = ['id', 'date_created', 'date_updated'];
            if (Array.isArray(fields)) {
                for (const f of fields) {
                    const fieldName = (f?.name || f?.field || '').toString();
                    if (RESERVED_COLS.includes(fieldName)) continue;
                    if (!VALID_NAME_REGEX.test(fieldName)) throw new Error(`Invalid field name: ${fieldName}`);

                    const fieldType = (f?.type || 'string').toString().toLowerCase();
                    let col: any;
                    switch (fieldType) {
                        case 'integer':
                        case 'int':
                            col = t.integer(fieldName);
                            break;
                        case 'float':
                        case 'decimal':
                        case 'real':
                            col = t.float(fieldName);
                            break;
                        case 'boolean':
                        case 'bool':
                            col = t.boolean(fieldName);
                            break;
                        case 'text':
                            col = t.text(fieldName);
                            break;
                        case 'date':
                            col = t.date(fieldName);
                            break;
                        case 'datetime':
                        case 'timestamp':
                            col = t.timestamp(fieldName);
                            break;
                        case 'json':
                            col = t.text(fieldName);
                            break;
                        default:
                            col = t.string(fieldName);
                            break;
                    }
                    if (f?.required === true || f?.nullable === false) col.notNullable();
                    if (f?.unique === true) col.unique();
                    if (f?.default_value !== undefined) col.defaultTo(f.default_value);
                }
            }

            t.timestamp('date_created').defaultTo(db.fn.now());
            t.timestamp('date_updated').defaultTo(db.fn.now());
        });

        await db('neurofy_collections_meta').insert({
            collection: name,
            label: label || name,
            icon: icon || 'database',
            description: null,
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: auth.email,
            user_id: auth.userId,
            collection: 'neurofy_collections',
            item: name,
            meta_json: JSON.stringify({ label: label || name, fields: Array.isArray(fields) ? fields.length : 0 }),
        });

        return NextResponse.json({ success: true, collection: name });
    } catch (error: any) {
        console.error('Create Collection Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
