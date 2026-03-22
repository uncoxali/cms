"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItems = getItems;
exports.getItem = getItem;
exports.createItem = createItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
const database_1 = require("../config/database");
const date_1 = require("../utils/date");
const ws_1 = require("../utils/ws");
async function getItems(req, res) {
    try {
        const { collection } = req.params;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const sort = req.query.sort || 'id';
        const order = req.query.order || 'asc';
        const search = req.query.search || '';
        const fields = req.query.fields;
        const filter = req.query.filter;
        let query = (0, database_1.db)(collection);
        if (fields) {
            query = query.select(fields.split(',').map(f => f.trim()));
        }
        else {
            query = query.select('*');
        }
        if (search) {
            const columnsInfo = await (0, database_1.db)(collection).columnInfo();
            const textCols = Object.entries(columnsInfo)
                .filter(([_, info]) => ['text', 'varchar', 'char', 'string'].includes((info.type || '').toLowerCase()))
                .map(([name, _]) => name);
            if (textCols.length > 0) {
                query = query.where(function () {
                    for (const col of textCols) {
                        this.orWhere(col, 'like', `%${search}%`);
                    }
                });
            }
        }
        if (filter) {
            try {
                const parsed = JSON.parse(filter);
                for (const [field, condition] of Object.entries(parsed)) {
                    const cond = condition;
                    if (cond._eq !== undefined)
                        query = query.where(field, '=', cond._eq);
                    if (cond._neq !== undefined)
                        query = query.where(field, '!=', cond._neq);
                    if (cond._gt !== undefined)
                        query = query.where(field, '>', cond._gt);
                    if (cond._gte !== undefined)
                        query = query.where(field, '>=', cond._gte);
                    if (cond._lt !== undefined)
                        query = query.where(field, '<', cond._lt);
                    if (cond._lte !== undefined)
                        query = query.where(field, '<=', cond._lte);
                    if (cond._contains !== undefined)
                        query = query.where(field, 'like', `%${cond._contains}%`);
                    if (cond._null !== undefined)
                        cond._null ? query.whereNull(field) : query.whereNotNull(field);
                    if (cond._in !== undefined)
                        query = query.whereIn(field, cond._in);
                }
            }
            catch { /* ignore invalid filter */ }
        }
        const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
        const total = (await countQuery)?.total || 0;
        const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'desc' : order;
        query = query.orderBy(sortField, sortOrder);
        const offset = (page - 1) * limit;
        query = query.limit(limit).offset(offset);
        let items = await query;
        const populate = req.query.populate;
        if (populate && items.length > 0) {
            const relations = await (0, database_1.db)('neurofy_relations').where('collection', collection).catch(() => []);
            const fieldsToPopulate = populate === '*'
                ? relations.map((r) => r.field)
                : populate.split(',').map((f) => f.trim());
            for (const rel of relations) {
                if (!fieldsToPopulate.includes(rel.field))
                    continue;
                const relatedIds = [...new Set(items.map((item) => item[rel.field]).filter(Boolean))];
                if (relatedIds.length === 0)
                    continue;
                const relatedItems = await (0, database_1.db)(rel.related_collection)
                    .whereIn(rel.related_field || 'id', relatedIds)
                    .select('*');
                const relatedMap = new Map(relatedItems.map((ri) => [ri[rel.related_field || 'id'], ri]));
                items = items.map((item) => ({
                    ...item,
                    [`${rel.field}_data`]: relatedMap.get(item[rel.field]) || null,
                }));
            }
        }
        const locale = req.query.locale;
        if (locale && items.length > 0) {
            const itemIds = items.map((item) => String(item.id));
            const translations = await (0, database_1.db)('neurofy_translations')
                .where({ collection, locale })
                .whereIn('item_id', itemIds);
            if (translations.length > 0) {
                const transMap = new Map();
                for (const tr of translations) {
                    if (!transMap.has(tr.item_id))
                        transMap.set(tr.item_id, new Map());
                    transMap.get(tr.item_id).set(tr.field, tr.value);
                }
                items = items.map((item) => {
                    const fieldMap = transMap.get(String(item.id));
                    if (!fieldMap)
                        return item;
                    const translated = { ...item };
                    for (const [field, value] of fieldMap) {
                        translated[field] = value;
                    }
                    return translated;
                });
            }
        }
        res.json({
            data: items,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function getItem(req, res) {
    try {
        const { collection, id } = req.params;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const item = await (0, database_1.db)(collection).where('id', id).first();
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        const populate = req.query.populate;
        if (populate) {
            const relations = await (0, database_1.db)('neurofy_relations').where('collection', collection).catch(() => []);
            const fieldsToPopulate = populate === '*'
                ? relations.map((r) => r.field)
                : populate.split(',').map((f) => f.trim());
            for (const rel of relations) {
                if (!fieldsToPopulate.includes(rel.field))
                    continue;
                const value = item[rel.field];
                if (value) {
                    const relatedItem = await (0, database_1.db)(rel.related_collection)
                        .where(rel.related_field || 'id', value)
                        .first();
                    if (relatedItem) {
                        item[`${rel.field}_data`] = relatedItem;
                    }
                }
            }
        }
        res.json({ data: item });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function createItem(req, res) {
    try {
        const { collection } = req.params;
        const body = req.body;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const columnsInfo = await (0, database_1.db)(collection).columnInfo();
        const colNames = Object.keys(columnsInfo);
        if (colNames.includes('date_created'))
            body.date_created = (0, date_1.toDbDate)();
        if (colNames.includes('date_updated'))
            body.date_updated = (0, date_1.toDbDate)();
        const relations = await (0, database_1.db)('neurofy_relations').where('collection', collection).catch(() => []);
        for (const rel of relations) {
            const value = body[rel.field];
            if (rel.required && (value === undefined || value === null || value === '')) {
                return res.status(400).json({
                    error: `Field "${rel.field}" is required — you must select a ${rel.related_collection} item`
                });
            }
            if (value !== undefined && value !== null && value !== '') {
                const exists = await (0, database_1.db)(rel.related_collection)
                    .where(rel.related_field || 'id', value).first();
                if (!exists) {
                    return res.status(400).json({
                        error: `Invalid reference: ${rel.related_collection} with ${rel.related_field || 'id'} = ${value} does not exist`
                    });
                }
            }
        }
        const [id] = await (0, database_1.db)(collection).insert(body);
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'create',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection,
            item: String(id),
            meta_json: JSON.stringify(body),
        });
        const item = await (0, database_1.db)(collection).where('id', id).first();
        // Broadcast event
        ws_1.wsManager.broadcast({
            event: 'item:created',
            data: { collection, id, item },
            timestamp: new Date().toISOString()
        });
        res.json({ data: item });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function updateItem(req, res) {
    try {
        const { collection, id } = req.params;
        const body = req.body;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const existing = await (0, database_1.db)(collection).where('id', id).first();
        if (!existing)
            return res.status(404).json({ error: 'Item not found' });
        const columnsInfo = await (0, database_1.db)(collection).columnInfo();
        const colNames = Object.keys(columnsInfo);
        if (colNames.includes('date_updated'))
            body.date_updated = (0, date_1.toDbDate)();
        await (0, database_1.db)(collection).where('id', id).update(body);
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'update',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection,
            item: id,
            meta_json: JSON.stringify(body),
        });
        const item = await (0, database_1.db)(collection).where('id', id).first();
        // Broadcast event
        ws_1.wsManager.broadcast({
            event: 'item:updated',
            data: { collection, id, item },
            timestamp: new Date().toISOString()
        });
        res.json({ data: item });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteItem(req, res) {
    try {
        const { collection, id } = req.params;
        const exists = await database_1.db.schema.hasTable(collection);
        if (!exists)
            return res.status(404).json({ error: 'Collection not found' });
        const item = await (0, database_1.db)(collection).where('id', id).first();
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        const hasTrashTable = await database_1.db.schema.hasTable('neurofy_trash');
        if (!hasTrashTable) {
            await database_1.db.schema.createTable('neurofy_trash', (table) => {
                table.increments('trash_id').primary();
                table.string('item_id').notNullable();
                table.string('collection').notNullable();
                table.text('data_json').notNullable();
                table.string('deleted_by');
                table.timestamp('deleted_at').defaultTo(database_1.db.fn.now());
                table.timestamp('expires_at');
            });
            await database_1.db.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_trash_item ON neurofy_trash(item_id, collection)');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await (0, database_1.db)('neurofy_trash').insert({
            item_id: id,
            collection,
            data_json: JSON.stringify({
                ...item,
                _collection_label: collection,
            }),
            deleted_by: req.auth?.email || 'system',
            deleted_at: (0, date_1.toDbDate)(),
            expires_at: (0, date_1.toDbDate)(expiresAt),
        });
        await (0, database_1.db)(collection).where('id', id).delete();
        // Broadcast event
        ws_1.wsManager.broadcast({
            event: 'item:deleted',
            data: { collection, id },
            timestamp: new Date().toISOString()
        });
        await (0, database_1.db)('neurofy_activity').insert({
            action: 'delete',
            user: req.auth?.email || 'system',
            user_id: req.auth?.userId,
            collection,
            item: id,
            meta_json: JSON.stringify({ _action: 'moved_to_trash' }),
        });
        res.json({ success: true, movedToTrash: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=items.controller.js.map