"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollections = getCollections;
exports.getCollection = getCollection;
exports.createCollection = createCollection;
exports.updateCollection = updateCollection;
exports.deleteCollection = deleteCollection;
const database_1 = require("../config/database");
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
const db_1 = require("../utils/db");
async function getCollections(req, res) {
    try {
        const tables = await (0, db_1.getTables)();
        const result = [];
        for (const t of tables) {
            const tableName = t.name;
            const columnsInfo = await (0, database_1.db)(tableName).columnInfo();
            const meta = await (0, database_1.db)('neurofy_collections_meta')
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
                fields: Object.entries(columnsInfo).map(([name, info]) => ({
                    name,
                    type: info.type || 'TEXT',
                    nullable: info.nullable,
                    default_value: info.defaultValue,
                    is_primary_key: info.type === 'integer' && name === 'id' || info.type === 'int' && name === 'id', // Heuristic for PK if not explicitly provided
                })),
            });
        }
        res.json({ data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getCollection(req, res) {
    try {
        const { name } = req.params;
        const exists = await database_1.db.schema.hasTable(name);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const columnsInfo = await (0, database_1.db)(name).columnInfo();
        const meta = await (0, database_1.db)('neurofy_collections_meta')
            .where('collection', name)
            .first()
            .catch(() => null);
        res.json({
            data: {
                collection: name,
                label: meta?.label || name,
                icon: meta?.icon || 'database',
                description: meta?.description || null,
                is_system: SYSTEM_TABLES.includes(name),
                hidden: meta?.hidden || false,
                fields: Object.entries(columnsInfo).map(([colName, info]) => ({
                    name: colName,
                    type: info.type || 'TEXT',
                    nullable: info.nullable,
                    default_value: info.defaultValue,
                    is_primary_key: info.type === 'integer' && colName === 'id' || info.type === 'int' && colName === 'id',
                })),
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createCollection(req, res) {
    try {
        const { name, label, icon, fields } = req.body;
        if (!name || !VALID_NAME_REGEX.test(name)) {
            return res.status(400).json({ error: 'Invalid collection name' });
        }
        const exists = await database_1.db.schema.hasTable(name);
        if (exists)
            return res.status(409).json({ error: 'Collection already exists' });
        await database_1.db.schema.createTable(name, (t) => {
            t.increments('id').primary();
            const RESERVED_COLS = ['id', 'date_created', 'date_updated'];
            if (Array.isArray(fields)) {
                for (const f of fields) {
                    const fieldName = (f?.name || f?.field || '').toString();
                    if (RESERVED_COLS.includes(fieldName))
                        continue;
                    if (!VALID_NAME_REGEX.test(fieldName))
                        throw new Error(`Invalid field name: ${fieldName}`);
                    const fieldType = (f?.type || 'string').toString().toLowerCase();
                    let col;
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
                    if (f?.required === true || f?.nullable === false)
                        col.notNullable();
                    if (f?.unique === true)
                        col.unique();
                    if (f?.default_value !== undefined)
                        col.defaultTo(f.default_value);
                }
            }
            t.timestamp('date_created').defaultTo(database_1.db.fn.now());
            t.timestamp('date_updated').defaultTo(database_1.db.fn.now());
        });
        await (0, database_1.db)('neurofy_collections_meta').insert({
            collection: name,
            label: label || name,
            icon: icon || 'database',
            description: null,
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: name,
            meta_json: JSON.stringify({ label: label || name, fields: Array.isArray(fields) ? fields.length : 0 }),
        });
        res.json({ success: true, collection: name });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateCollection(req, res) {
    try {
        const { name } = req.params;
        const body = req.body;
        const updateData = {};
        if (body.label !== undefined)
            updateData.label = body.label;
        if (body.icon !== undefined)
            updateData.icon = body.icon;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.hidden !== undefined)
            updateData.hidden = body.hidden;
        await (0, database_1.db)('neurofy_collections_meta').where('collection', name).update(updateData);
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: name,
            meta_json: JSON.stringify(body),
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteCollection(req, res) {
    try {
        const { name } = req.params;
        if (SYSTEM_TABLES.includes(name)) {
            return res.status(400).json({ error: 'Cannot delete system collection' });
        }
        await database_1.db.schema.dropTable(name);
        await (0, database_1.db)('neurofy_collections_meta').where('collection', name).delete();
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection: 'neurofy_collections',
            item: name,
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=collections.controller.js.map