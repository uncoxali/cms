"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchema = getSchema;
exports.getCollectionSchema = getCollectionSchema;
exports.createCollection = createCollection;
exports.updateCollectionSchema = updateCollectionSchema;
exports.deleteCollection = deleteCollection;
const database_1 = require("../config/database");
const db_1 = require("../utils/db");
const SYSTEM_TABLES = [
    'neurofy_users', 'neurofy_roles', 'neurofy_activity',
    'neurofy_files', 'neurofy_folders', 'neurofy_flows',
    'neurofy_flow_logs', 'neurofy_settings', 'neurofy_collections_meta',
];
// GET /api/schema — introspect all tables
async function getSchema(req, res) {
    try {
        const mysql = (0, db_1.isMySQL)();
        const tables = await (0, db_1.getTables)();
        const collections = {};
        const allRelations = await (0, database_1.db)('neurofy_relations').select('*').catch(() => []);
        for (const t of tables) {
            const tableName = t.name;
            const isSystem = SYSTEM_TABLES.includes(tableName);
            const columnsInfo = await (0, database_1.db)(tableName).columnInfo();
            let foreignKeys = [];
            let indexes = [];
            if (mysql) {
                const [fkRows] = await database_1.db.raw(`
                    SELECT COLUMN_NAME as \`from\`, REFERENCED_TABLE_NAME as \`table\`, REFERENCED_COLUMN_NAME as \`to\`
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
                `, [database_1.db.client.connectionSettings.database, tableName]);
                foreignKeys = fkRows;
                const [idxRows] = await database_1.db.raw(`SHOW INDEX FROM ${tableName}`);
                indexes = idxRows.map((idx) => ({
                    name: idx.Key_name,
                    unique: idx.Non_unique === 0,
                    column: idx.Column_name
                }));
            }
            else {
                foreignKeys = await database_1.db.raw(`PRAGMA foreign_key_list('${tableName}')`);
                const idxList = await database_1.db.raw(`PRAGMA index_list('${tableName}')`);
                for (const idx of idxList) {
                    const idxInfo = await database_1.db.raw(`PRAGMA index_info('${idx.name}')`);
                    indexes.push({
                        name: idx.name,
                        unique: idx.unique === 1,
                        columns: idxInfo.map((ii) => ii.name)
                    });
                }
            }
            const meta = await (0, database_1.db)('neurofy_collections_meta')
                .where('collection', tableName).first().catch(() => null);
            const tableRelations = allRelations.filter((r) => r.collection === tableName);
            const fields = Object.entries(columnsInfo).map(([colName, info]) => {
                const fk = foreignKeys.find((fk) => fk.from === colName);
                const rel = tableRelations.find((r) => r.field === colName);
                let isUnique = false;
                if (mysql) {
                    isUnique = indexes.some((idx) => idx.unique && idx.column === colName);
                }
                else {
                    isUnique = indexes.some((idx) => idx.unique && idx.columns.includes(colName));
                }
                return {
                    name: colName,
                    type: info.type || 'TEXT',
                    nullable: info.nullable,
                    default_value: info.defaultValue,
                    is_primary_key: info.type === 'integer' && colName === 'id' || info.type === 'int' && colName === 'id',
                    is_unique: isUnique,
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
                label: meta?.label || tableName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                icon: meta?.icon || (isSystem ? 'settings' : 'database'),
                description: meta?.description || null,
                is_system: isSystem,
                hidden: meta?.hidden || false,
                fields,
                field_count: fields.length,
            };
        }
        res.json({ collections });
    }
    catch (error) {
        console.error('[SCHEMA]', error);
        res.status(500).json({ error: error.message });
    }
}
// GET /api/schema/:collection — introspect single table
async function getCollectionSchema(req, res) {
    try {
        const { collection } = req.params;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const mysql = (0, db_1.isMySQL)();
        const columnsInfo = await (0, database_1.db)(collection).columnInfo();
        let foreignKeys = [];
        if (mysql) {
            const [fkRows] = await database_1.db.raw(`
                SELECT COLUMN_NAME as \`from\`, REFERENCED_TABLE_NAME as \`table\`, REFERENCED_COLUMN_NAME as \`to\`
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
            `, [database_1.db.client.connectionSettings.database, collection]);
            foreignKeys = fkRows;
        }
        else {
            foreignKeys = await database_1.db.raw(`PRAGMA foreign_key_list('${collection}')`);
        }
        const meta = await (0, database_1.db)('neurofy_collections_meta').where('collection', collection).first().catch(() => null);
        const relations = await (0, database_1.db)('neurofy_relations').where('collection', collection).catch(() => []);
        const fields = Object.entries(columnsInfo).map(([colName, info]) => {
            const fk = foreignKeys.find((fk) => fk.from === colName);
            const rel = relations.find((r) => r.field === colName);
            return {
                name: colName,
                type: info.type || 'TEXT',
                nullable: info.nullable,
                default_value: info.defaultValue,
                is_primary_key: info.type === 'integer' && colName === 'id' || info.type === 'int' && colName === 'id',
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/schema/:collection — create new table
async function createCollection(req, res) {
    try {
        const { collection } = req.params;
        const { label, icon, description, fields } = req.body;
        if (!collection || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(collection)) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }
        const exists = await database_1.db.schema.hasTable(collection);
        if (exists)
            return res.status(409).json({ error: 'Collection already exists' });
        const relationFields = [];
        await database_1.db.schema.createTable(collection, (t) => {
            t.increments('id').primary();
            const RESERVED_COLS = ['id', 'date_created', 'date_updated'];
            if (fields && Array.isArray(fields)) {
                for (const field of fields) {
                    if (RESERVED_COLS.includes(field.name))
                        continue;
                    if (field.type === 'relation' && field.relation) {
                        const col = t.integer(field.name).unsigned();
                        if (field.nullable === false || field.relation.required)
                            col.notNullable();
                        else
                            col.nullable();
                        relationFields.push({ name: field.name, ...field.relation });
                        continue;
                    }
                    let col;
                    switch ((field.type || 'string').toLowerCase()) {
                        case 'integer':
                        case 'int':
                            col = t.integer(field.name);
                            break;
                        case 'float':
                        case 'decimal':
                        case 'real':
                            col = t.float(field.name);
                            break;
                        case 'boolean':
                        case 'bool':
                            col = t.boolean(field.name);
                            break;
                        case 'text':
                            col = t.text(field.name);
                            break;
                        case 'date':
                            col = t.date(field.name);
                            break;
                        case 'datetime':
                        case 'timestamp':
                            col = t.timestamp(field.name);
                            break;
                        case 'json':
                            col = t.text(field.name);
                            break;
                        default:
                            col = t.string(field.name);
                            break;
                    }
                    if (field.nullable === false)
                        col.notNullable();
                    if (field.default_value !== undefined)
                        col.defaultTo(field.default_value);
                    if (field.unique)
                        col.unique();
                }
            }
            t.timestamp('date_created').defaultTo(database_1.db.fn.now());
            t.timestamp('date_updated').defaultTo(database_1.db.fn.now());
        });
        for (const rel of relationFields) {
            await (0, database_1.db)('neurofy_relations').insert({
                collection,
                field: rel.name,
                related_collection: rel.related_collection,
                related_field: rel.related_field || 'id',
                display_field: rel.display_field || 'id',
                on_delete: rel.on_delete || 'SET NULL',
                required: rel.required ? 1 : 0,
            });
        }
        await (0, database_1.db)('neurofy_collections_meta').insert({
            collection,
            label: label || collection,
            icon: icon || 'database',
            description: description || null,
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: collection,
            meta_json: JSON.stringify({ label, fields: fields?.length || 0 }),
        });
        res.json({ success: true, collection });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// PATCH /api/schema/:collection — add or remove columns
async function updateCollectionSchema(req, res) {
    try {
        const { collection } = req.params;
        const body = req.body;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        if (body.action === 'add_field' && body.field) {
            const { name, type, nullable, default_value, unique, relation } = body.field;
            const RESERVED = ['id', 'date_created', 'date_updated'];
            if (RESERVED.includes(name))
                return res.status(400).json({ error: 'Cannot add reserved column name' });
            if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))
                return res.status(400).json({ error: 'Invalid field name' });
            if (type === 'relation' && relation) {
                const relatedExists = await database_1.db.schema.hasTable(relation.related_collection);
                if (!relatedExists)
                    return res.status(400).json({ error: `Related collection "${relation.related_collection}" does not exist` });
                const columnExists = await database_1.db.schema.hasColumn(collection, name);
                if (!columnExists) {
                    await database_1.db.schema.alterTable(collection, (t) => {
                        const col = t.integer(name).unsigned();
                        if (nullable === false || relation.required)
                            col.notNullable().defaultTo(0);
                        else
                            col.nullable();
                    });
                }
                const existingRel = await (0, database_1.db)('neurofy_relations').where({ collection, field: name }).first();
                if (existingRel) {
                    await (0, database_1.db)('neurofy_relations').where({ collection, field: name }).update({
                        related_collection: relation.related_collection,
                        related_field: relation.related_field || 'id',
                        display_field: relation.display_field || 'id',
                        on_delete: relation.on_delete || 'SET NULL',
                        required: relation.required ? 1 : 0,
                    });
                }
                else {
                    await (0, database_1.db)('neurofy_relations').insert({
                        collection,
                        field: name,
                        related_collection: relation.related_collection,
                        related_field: relation.related_field || 'id',
                        display_field: relation.display_field || 'id',
                        on_delete: relation.on_delete || 'SET NULL',
                        required: relation.required ? 1 : 0,
                    });
                }
                await (0, database_1.db)('neurofy_activity').insert({
                    action: 'create', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                    collection: 'neurofy_fields', item: `${collection}.${name}`,
                    meta_json: JSON.stringify({ field: name, type: 'relation', relation }),
                });
                return res.json({ success: true, message: `Relation field "${name}" added` });
            }
            const columnExists = await database_1.db.schema.hasColumn(collection, name);
            if (columnExists) {
                return res.status(409).json({ error: `Column "${name}" already exists` });
            }
            await database_1.db.schema.alterTable(collection, (t) => {
                let col;
                switch ((type || 'string').toLowerCase()) {
                    case 'integer':
                    case 'int':
                        col = t.integer(name);
                        break;
                    case 'float':
                    case 'decimal':
                    case 'real':
                        col = t.float(name);
                        break;
                    case 'boolean':
                    case 'bool':
                        col = t.boolean(name);
                        break;
                    case 'text':
                        col = t.text(name);
                        break;
                    case 'date':
                        col = t.date(name);
                        break;
                    case 'datetime':
                    case 'timestamp':
                        col = t.timestamp(name);
                        break;
                    default:
                        col = t.string(name);
                        break;
                }
                if (nullable === false)
                    col.notNullable().defaultTo(default_value ?? '');
                else
                    col.nullable();
                if (default_value !== undefined && nullable !== false)
                    col.defaultTo(default_value);
                if (unique)
                    col.unique();
            });
            await (0, database_1.db)('neurofy_activity').insert({
                action: 'create', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                collection: 'neurofy_fields', item: `${collection}.${name}`,
                meta_json: JSON.stringify({ field: name, type }),
            });
            return res.json({ success: true, message: `Field "${name}" added` });
        }
        if (body.action === 'drop_field' && body.field_name) {
            const PROTECTED = ['id', 'date_created', 'date_updated'];
            if (PROTECTED.includes(body.field_name))
                return res.status(400).json({ error: 'Cannot remove protected column' });
            await database_1.db.schema.alterTable(collection, (t) => {
                t.dropColumn(body.field_name);
            });
            await (0, database_1.db)('neurofy_relations').where({ collection, field: body.field_name }).delete().catch(() => { });
            await (0, database_1.db)('neurofy_activity').insert({
                action: 'delete', user: req.auth?.email || 'system', user_id: req.auth?.userId,
                collection: 'neurofy_fields', item: `${collection}.${body.field_name}`,
            });
            return res.json({ success: true, message: `Field "${body.field_name}" removed` });
        }
        res.status(400).json({ error: 'Invalid action. Use "add_field" or "drop_field"' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// DELETE /api/schema/:collection — drop table
async function deleteCollection(req, res) {
    try {
        const { collection } = req.params;
        if (SYSTEM_TABLES.includes(collection)) {
            return res.status(403).json({ error: 'Cannot delete system collections' });
        }
        await database_1.db.schema.dropTableIfExists(collection);
        await (0, database_1.db)('neurofy_collections_meta').where('collection', collection).delete();
        await (0, database_1.db)('neurofy_relations')
            .where('collection', collection)
            .orWhere('related_collection', collection)
            .delete().catch(() => { });
        await (0, database_1.db)('neurofy_activity').where('collection', collection).delete().catch(() => { });
        await (0, database_1.db)('neurofy_translations').where('collection', collection).delete().catch(() => { });
        const roles = await (0, database_1.db)('neurofy_roles').select('id', 'permissions_json');
        for (const role of roles) {
            try {
                const perms = JSON.parse(role.permissions_json || '{}');
                if (perms[collection]) {
                    delete perms[collection];
                    await (0, database_1.db)('neurofy_roles').where('id', role.id)
                        .update({ permissions_json: JSON.stringify(perms) });
                }
            }
            catch { }
        }
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: collection,
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=schema.controller.js.map