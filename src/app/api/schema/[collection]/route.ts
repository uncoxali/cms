import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

type RouteParams = { params: Promise<Record<string, string>> }

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
        const meta = await db('neurofy_collections_meta').where('collection', collection).first().catch(() => null);
        const relations = await db('neurofy_relations').where('collection', collection).catch(() => []);

        const fields = columns.map((col: any) => {
            const fk = foreignKeys.find((fk: any) => fk.from === col.name);
            const rel = relations.find((r: any) => r.field === col.name);
            return {
                name: col.name,
                type: col.type || 'TEXT',
                nullable: col.notnull === 0,
                default_value: col.dflt_value,
                is_primary_key: col.pk === 1,
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

        const relationFields: any[] = [];

        // Create table
        await db.schema.createTable(collection, (t) => {
            t.increments('id').primary();

            const RESERVED_COLS = ['id', 'date_created', 'date_updated'];
            if (fields && Array.isArray(fields)) {
                for (const field of fields) {
                    if (RESERVED_COLS.includes(field.name)) continue;

                    if (field.type === 'relation' && field.relation) {
                        const col = t.integer(field.name).unsigned();
                        if (field.nullable === false || field.relation.required) col.notNullable();
                        else col.nullable();
                        relationFields.push({ name: field.name, ...field.relation });
                        continue;
                    }

                    let col;
                    switch (field.type?.toLowerCase()) {
                        case 'integer': case 'int': col = t.integer(field.name); break;
                        case 'float': case 'decimal': case 'real': col = t.float(field.name); break;
                        case 'boolean': case 'bool': col = t.boolean(field.name); break;
                        case 'text': col = t.text(field.name); break;
                        case 'date': col = t.date(field.name); break;
                        case 'datetime': case 'timestamp': col = t.timestamp(field.name); break;
                        case 'json': col = t.text(field.name); break;
                        default: col = t.string(field.name); break;
                    }
                    if (field.nullable === false) col.notNullable();
                    if (field.default_value !== undefined) col.defaultTo(field.default_value);
                    if (field.unique) col.unique();
                }
            }

            t.timestamp('date_created').defaultTo(db.fn.now());
            t.timestamp('date_updated').defaultTo(db.fn.now());
        });

        // Save relation metadata
        for (const rel of relationFields) {
            await db('neurofy_relations').insert({
                collection,
                field: rel.name,
                related_collection: rel.related_collection,
                related_field: rel.related_field || 'id',
                display_field: rel.display_field || 'id',
                on_delete: rel.on_delete || 'SET NULL',
                required: rel.required ? 1 : 0,
            });
        }

        // Save metadata
        await db('neurofy_collections_meta').insert({
            collection,
            label: label || collection,
            icon: icon || 'database',
            description: description || null,
        });

        // Log activity
        await db('neurofy_activity').insert({
            action: 'create',
            user: auth.email,
            user_id: auth.userId,
            collection: 'neurofy_collections',
            item: collection,
            meta_json: JSON.stringify({ label, fields: fields?.length || 0 }),
        });

        return NextResponse.json({ success: true, collection });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/schema/[collection] — add or remove columns
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const auth = getAuthFromRequest(request);
    if (!auth?.adminAccess) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { collection } = await params;
    const db = getDb();
    const body = await request.json();

    try {
        const exists = await db.schema.hasTable(collection);
        if (!exists) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

        if (body.action === 'add_field' && body.field) {
            const { name, type, nullable, default_value, unique, relation } = body.field;
            const RESERVED = ['id', 'date_created', 'date_updated'];
            if (RESERVED.includes(name)) return NextResponse.json({ error: 'Cannot add reserved column name' }, { status: 400 });
            if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return NextResponse.json({ error: 'Invalid field name' }, { status: 400 });

            if (type === 'relation' && relation) {
                const relatedExists = await db.schema.hasTable(relation.related_collection);
                if (!relatedExists) return NextResponse.json({ error: `Related collection "${relation.related_collection}" does not exist` }, { status: 400 });

                // Check if column already exists
                const columns = await db.raw(`PRAGMA table_info('${collection}')`);
                const columnExists = columns.some((c: any) => c.name === name);

                if (!columnExists) {
                    await db.schema.alterTable(collection, (t) => {
                        const col = t.integer(name).unsigned();
                        if (nullable === false || relation.required) col.notNullable().defaultTo(0);
                        else col.nullable();
                    });
                }

                // Check if relation metadata already exists
                const existingRel = await db('neurofy_relations')
                    .where({ collection, field: name }).first();

                if (existingRel) {
                    await db('neurofy_relations').where({ collection, field: name }).update({
                        related_collection: relation.related_collection,
                        related_field: relation.related_field || 'id',
                        display_field: relation.display_field || 'id',
                        on_delete: relation.on_delete || 'SET NULL',
                        required: relation.required ? 1 : 0,
                    });
                } else {
                    await db('neurofy_relations').insert({
                        collection,
                        field: name,
                        related_collection: relation.related_collection,
                        related_field: relation.related_field || 'id',
                        display_field: relation.display_field || 'id',
                        on_delete: relation.on_delete || 'SET NULL',
                        required: relation.required ? 1 : 0,
                    });
                }

                await db('neurofy_activity').insert({
                    action: 'create', user: auth.email, user_id: auth.userId,
                    collection: 'neurofy_fields', item: `${collection}.${name}`,
                    meta_json: JSON.stringify({ field: name, type: 'relation', relation }),
                });

                return NextResponse.json({ success: true, message: `Relation field "${name}" added` });
            }

            // Check if column already exists
            const existingCols = await db.raw(`PRAGMA table_info('${collection}')`);
            if (existingCols.some((c: any) => c.name === name)) {
                return NextResponse.json({ error: `Column "${name}" already exists` }, { status: 409 });
            }

            await db.schema.alterTable(collection, (t) => {
                let col;
                switch ((type || 'string').toLowerCase()) {
                    case 'integer': case 'int': col = t.integer(name); break;
                    case 'float': case 'decimal': case 'real': col = t.float(name); break;
                    case 'boolean': case 'bool': col = t.boolean(name); break;
                    case 'text': col = t.text(name); break;
                    case 'date': col = t.date(name); break;
                    case 'datetime': case 'timestamp': col = t.timestamp(name); break;
                    default: col = t.string(name); break;
                }
                if (nullable === false) col.notNullable().defaultTo(default_value ?? '');
                else col.nullable();
                if (default_value !== undefined && nullable !== false) col.defaultTo(default_value);
                if (unique) col.unique();
            });

            await db('neurofy_activity').insert({
                action: 'create', user: auth.email, user_id: auth.userId,
                collection: 'neurofy_fields', item: `${collection}.${name}`,
                meta_json: JSON.stringify({ field: name, type }),
            });

            return NextResponse.json({ success: true, message: `Field "${name}" added` });
        }

        if (body.action === 'drop_field' && body.field_name) {
            const PROTECTED = ['id', 'date_created', 'date_updated'];
            if (PROTECTED.includes(body.field_name)) return NextResponse.json({ error: 'Cannot remove protected column' }, { status: 400 });

            await db.schema.alterTable(collection, (t) => {
                t.dropColumn(body.field_name);
            });

            // Clean up relation metadata if it was a relation field
            await db('neurofy_relations')
                .where({ collection, field: body.field_name })
                .delete()
                .catch(() => {});

            await db('neurofy_activity').insert({
                action: 'delete', user: auth.email, user_id: auth.userId,
                collection: 'neurofy_fields', item: `${collection}.${body.field_name}`,
            });

            return NextResponse.json({ success: true, message: `Field "${body.field_name}" removed` });
        }

        return NextResponse.json({ error: 'Invalid action. Use "add_field" or "drop_field"' }, { status: 400 });
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
        const systemTables = [
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
        if (systemTables.includes(collection)) {
            return NextResponse.json({ error: 'Cannot delete system collections' }, { status: 403 });
        }

        // Drop main table
        await db.schema.dropTableIfExists(collection);

        // Clean up metadata and relations referencing this collection
        await db('neurofy_collections_meta').where('collection', collection).delete();
        await db('neurofy_relations')
            .where('collection', collection)
            .orWhere('related_collection', collection)
            .delete()
            .catch(() => {});

        await db('neurofy_activity').insert({
            action: 'delete',
            user: auth.email,
            user_id: auth.userId,
            collection: 'neurofy_collections',
            item: collection,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
