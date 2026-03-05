import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/schema — introspect all tables and their columns
export async function GET(request: NextRequest) {
    const auth = getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = getDb();

        // Get all tables
        const tables = await db.raw(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`
        );

        const systemTables = [
            'directus_users', 'directus_roles', 'directus_activity',
            'directus_files', 'directus_folders', 'directus_flows',
            'directus_flow_logs', 'directus_settings', 'directus_collections_meta',
        ];

        const collections: Record<string, any> = {};

        for (const table of tables) {
            const tableName = table.name;
            const isSystem = systemTables.includes(tableName);

            // Get column info
            const columns = await db.raw(`PRAGMA table_info('${tableName}')`);
            // Get foreign keys
            const foreignKeys = await db.raw(`PRAGMA foreign_key_list('${tableName}')`);
            // Get indexes
            const indexes = await db.raw(`PRAGMA index_list('${tableName}')`);

            // Get metadata if exists
            const meta = await db('directus_collections_meta')
                .where('collection', tableName)
                .first()
                .catch(() => null);

            const fields = columns.map((col: any) => {
                const fk = foreignKeys.find((fk: any) => fk.from === col.name);
                return {
                    name: col.name,
                    type: col.type || 'TEXT',
                    nullable: col.notnull === 0,
                    default_value: col.dflt_value,
                    is_primary_key: col.pk === 1,
                    is_unique: indexes.some((idx: any) => idx.unique && idx.name?.includes(col.name)),
                    foreign_key: fk ? { table: fk.table, column: fk.to } : null,
                };
            });

            collections[tableName] = {
                collection: tableName,
                label: meta?.label || tableName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                icon: meta?.icon || (isSystem ? 'settings' : 'database'),
                description: meta?.description || null,
                is_system: isSystem,
                hidden: meta?.hidden || false,
                fields,
                field_count: fields.length,
            };
        }

        return NextResponse.json({ collections });
    } catch (error: any) {
        console.error('[SCHEMA]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
