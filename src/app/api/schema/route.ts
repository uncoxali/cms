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
            'neurofy_users', 'neurofy_roles', 'neurofy_activity',
            'neurofy_files', 'neurofy_folders', 'neurofy_flows',
            'neurofy_flow_logs', 'neurofy_settings', 'neurofy_collections_meta',
        ];

        const collections: Record<string, any> = {};

        // Load all relations at once
        const allRelations = await db('neurofy_relations').select('*').catch(() => []);

        for (const table of tables) {
            const tableName = table.name;
            const isSystem = systemTables.includes(tableName);

            const columns = await db.raw(`PRAGMA table_info('${tableName}')`);
            const foreignKeys = await db.raw(`PRAGMA foreign_key_list('${tableName}')`);
            const indexes = await db.raw(`PRAGMA index_list('${tableName}')`);

            const meta = await db('neurofy_collections_meta')
                .where('collection', tableName)
                .first()
                .catch(() => null);

            const tableRelations = allRelations.filter((r: any) => r.collection === tableName);

            const fields = columns.map((col: any) => {
                const fk = foreignKeys.find((fk: any) => fk.from === col.name);
                const rel = tableRelations.find((r: any) => r.field === col.name);
                return {
                    name: col.name,
                    type: col.type || 'TEXT',
                    nullable: col.notnull === 0,
                    default_value: col.dflt_value,
                    is_primary_key: col.pk === 1,
                    is_unique: indexes.some((idx: any) => idx.unique && idx.name?.includes(col.name)),
                    foreign_key: fk ? { table: fk.table, column: fk.to } : null,
                    relation: rel ? {
                        related_collection: rel.related_collection,
                        related_field: rel.related_field,
                        display_field: rel.display_field,
                        on_delete: rel.on_delete,
                        required: !!rel.required,
                    } : null,
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
