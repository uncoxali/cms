"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevisions = getRevisions;
exports.createRevision = createRevision;
exports.getRevision = getRevision;
exports.deleteRevision = deleteRevision;
const database_1 = require("../config/database");
const date_1 = require("../utils/date");
async function getRevisions(req, res) {
    try {
        const revisions = await (0, database_1.db)('item_revisions').select('*').orderBy('date_created', 'desc').limit(100);
        return res.json({
            data: revisions.map((r) => ({
                id: r.id,
                collection: r.collection,
                itemId: r.item_id,
                itemName: r.item_name,
                version: r.version,
                changes: r.changes ? JSON.parse(r.changes) : [],
                user: {
                    id: r.user_id,
                    name: r.user_name,
                },
                status: r.status || 'published',
                dateCreated: r.date_created,
            })),
        });
    }
    catch (error) {
        if (error.message?.includes('no such table')) {
            return res.json({ data: [] });
        }
        res.status(500).json({ error: error.message });
    }
}
async function createRevision(req, res) {
    try {
        const body = req.body;
        const { collection, itemId, itemName, changes, status } = body;
        if (!collection || !itemId) {
            return res.status(400).json({ error: 'Collection and itemId are required' });
        }
        const existingRevisions = await (0, database_1.db)('item_revisions')
            .where({ collection, item_id: itemId })
            .orderBy('version', 'desc')
            .limit(1);
        const nextVersion = existingRevisions.length > 0
            ? (existingRevisions[0].version || 0) + 1
            : 1;
        const id = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await (0, database_1.db)('item_revisions').insert({
            id,
            collection,
            item_id: itemId,
            item_name: itemName || '',
            version: nextVersion,
            changes: JSON.stringify(changes || []),
            user_id: req.auth?.userId || 'system',
            user_name: req.auth?.email || 'Unknown',
            status: status || 'draft',
            date_created: (0, date_1.toDbDate)(),
        });
        return res.json({
            data: {
                id,
                collection,
                itemId,
                itemName,
                version: nextVersion,
                changes,
                user: {
                    id: req.auth?.userId || 'system',
                    name: req.auth?.email || 'Unknown',
                },
                status: status || 'draft',
                dateCreated: (0, date_1.toDbDate)(),
            },
        });
    }
    catch (error) {
        if (error.message?.includes('no such table')) {
            try {
                await database_1.db.schema.createTable('item_revisions', (table) => {
                    table.string('id').primary();
                    table.string('collection').notNullable();
                    table.string('item_id').notNullable();
                    table.string('item_name');
                    table.integer('version').defaultTo(1);
                    table.text('changes');
                    table.string('user_id');
                    table.string('user_name');
                    table.string('status').defaultTo('published');
                    table.string('date_created');
                    table.string('date_updated');
                });
                const body = req.body;
                const id = `rev_${Date.now()}`;
                await (0, database_1.db)('item_revisions').insert({
                    id,
                    collection: body.collection,
                    item_id: body.itemId,
                    item_name: body.itemName || '',
                    version: 1,
                    changes: JSON.stringify(body.changes || []),
                    user_id: req.auth?.userId || 'system',
                    user_name: req.auth?.email || 'Unknown',
                    status: body.status || 'draft',
                    date_created: (0, date_1.toDbDate)(),
                });
                return res.json({ data: { id, ...body } });
            }
            catch (createError) {
                return res.status(500).json({ error: createError.message });
            }
        }
        res.status(500).json({ error: error.message });
    }
}
async function getRevision(req, res) {
    try {
        const { id } = req.params;
        const revision = await (0, database_1.db)('item_revisions').where('id', id).first();
        if (!revision) {
            return res.status(404).json({ error: 'Revision not found' });
        }
        return res.json({
            data: {
                id: revision.id,
                collection: revision.collection,
                itemId: revision.item_id,
                itemName: revision.item_name,
                version: revision.version,
                changes: revision.changes ? JSON.parse(revision.changes) : [],
                user: {
                    id: revision.user_id,
                    name: revision.user_name,
                },
                status: revision.status || 'published',
                dateCreated: revision.date_created,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
async function deleteRevision(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('item_revisions').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=revisions.controller.js.map