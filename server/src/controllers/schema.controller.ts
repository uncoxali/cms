import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../utils/auth';

const SYSTEM_TABLES = [
    'neurofy_users', 'neurofy_roles', 'neurofy_activity',
    'neurofy_files', 'neurofy_folders', 'neurofy_flows',
    'neurofy_flow_logs', 'neurofy_settings', 'neurofy_collections_meta',
];

// GET /api/schema — introspect all tables
export async function getSchema(req: AuthenticatedRequest, res: Response) {
    try {
        const tables = await db.raw(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name`
        );

        const collections: Record<string, any> = {};
        const allRelations = await db('neurofy_relations').select('*').catch(() => []);

        for (const t of tables) {
            const tableName = t.name;
            const isSystem = SYSTEM_TABLES.includes(tableName);

            const columns = await db.raw(`PRAGMA table_info('${tableName}')`);
            const foreignKeys = await db.raw(`PRAGMA foreign_key_list('${tableName}')`);
            const indexes = await db.raw(`PRAGMA index_list('${tableName}')`);
            const meta = await db('neurofy_collections_meta')
                .where('collection', tableName).first().catch(() => null);
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

        res.json({ collections });
    } catch (error: any) {
        console.error('[SCHEMA]', error);
        res.status(500).json({ error: error.message });
    }
}

// GET /api/schema/:collection — introspect single table
export async function getCollectionSchema(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection } = req.params;
        const exists = await db.schema.hasTable(collection);
        if (!exists) return res.status(404).json({ error: 'Collection not found' });

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

        res.json({
            collection,
            label: meta?.label || collection,
            icon: meta?.icon || 'database',
            description: meta?.description || null,
            fields,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/schema/:collection — create new table
export async function createCollection(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection } = req.params;
        const { label, icon, description, fields } = req.body;

        if (!collection || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(collection)) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }

        const exists = await db.schema.hasTable(collection);
        if (exists) return res.status(409).json({ error: 'Collection already exists' });

        const relationFields: any[] = [];

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
                    switch ((field.type || 'string').toLowerCase()) {
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

        await db('neurofy_collections_meta').insert({
            collection,
            label: label || collection,
            icon: icon || 'database',
            description: description || null,
        });

        await db('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: collection,
            meta_json: JSON.stringify({ label, fields: fields?.length || 0 }),
        });

        res.json({ success: true, collection });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// PATCH /api/schema/:collection — add or remove columns
export async function updateCollectionSchema(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection } = req.params;
        const body = req.body;

        const exists = await db.schema.hasTable(collection);
        if (!exists) return res.status(404).json({ error: 'Collection not found' });

        if (body.action === 'add_field' && body.field) {
            const { name, type, nullable, default_value, unique, relation } = body.field;
            const RESERVED = ['id', 'date_created', 'date_updated'];
            if (RESERVED.includes(name)) return res.status(400).json({ error: 'Cannot add reserved column name' });
            if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return res.status(400).json({ error: 'Invalid field name' });

            if (type === 'relation' && relation) {
                const relatedExists = await db.schema.hasTable(relation.related_collection);
                if (!relatedExists) return res.status(400).json({ error: `Related collection "${relation.related_collection}" does not exist` });

                const columns = await db.raw(`PRAGMA table_info('${collection}')`);
                const columnExists = columns.some((c: any) => c.name === name);

                if (!columnExists) {
                    await db.schema.alterTable(collection, (t) => {
                        const col = t.integer(name).unsigned();
                        if (nullable === false || relation.required) col.notNullable().defaultTo(0);
                        else col.nullable();
                    });
                }

                const existingRel = await db('neurofy_relations').where({ collection, field: name }).first();
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
                    action: 'create', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                    collection: 'neurofy_fields', item: `${collection}.${name}`,
                    meta_json: JSON.stringify({ field: name, type: 'relation', relation }),
                });

                return res.json({ success: true, message: `Relation field "${name}" added` });
            }

            const existingCols = await db.raw(`PRAGMA table_info('${collection}')`);
            if (existingCols.some((c: any) => c.name === name)) {
                return res.status(409).json({ error: `Column "${name}" already exists` });
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
                action: 'create', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                collection: 'neurofy_fields', item: `${collection}.${name}`,
                meta_json: JSON.stringify({ field: name, type }),
            });

            return res.json({ success: true, message: `Field "${name}" added` });
        }

        if (body.action === 'drop_field' && body.field_name) {
            const PROTECTED = ['id', 'date_created', 'date_updated'];
            if (PROTECTED.includes(body.field_name)) return res.status(400).json({ error: 'Cannot remove protected column' });

            await db.schema.alterTable(collection, (t) => {
                t.dropColumn(body.field_name);
            });

            await db('neurofy_relations').where({ collection, field: body.field_name }).delete().catch(() => {});

            await db('neurofy_activity').insert({
                action: 'delete', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                collection: 'neurofy_fields', item: `${collection}.${body.field_name}`,
            });

            return res.json({ success: true, message: `Field "${body.field_name}" removed` });
        }

        res.status(400).json({ error: 'Invalid action. Use "add_field" or "drop_field"' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// DELETE /api/schema/:collection — drop table
export async function deleteCollection(req: AuthenticatedRequest, res: Response) {
    try {
        const { collection } = req.params;

        if (SYSTEM_TABLES.includes(collection)) {
            return res.status(403).json({ error: 'Cannot delete system collections' });
        }

        await db.raw(`DROP TABLE IF EXISTS "${collection}"`);
        await db('neurofy_collections_meta').where('collection', collection).delete();
        await db('neurofy_relations')
            .where('collection', collection)
            .orWhere('related_collection', collection)
            .delete().catch(() => {});
        await db('neurofy_activity').where('collection', collection).delete().catch(() => {});
        await db('neurofy_translations').where('collection', collection).delete().catch(() => {});

        const roles = await db('neurofy_roles').select('id', 'permissions_json');
        for (const role of roles) {
            try {
                const perms = JSON.parse(role.permissions_json || '{}');
                if (perms[collection]) {
                    delete perms[collection];
                    await db('neurofy_roles').where('id', role.id)
                        .update({ permissions_json: JSON.stringify(perms) });
                }
            } catch {}
        }

        await db('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: collection,
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
