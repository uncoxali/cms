"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplates = getTemplates;
exports.createTemplate = createTemplate;
exports.updateTemplate = updateTemplate;
exports.deleteTemplate = deleteTemplate;
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
// GET /api/templates
async function getTemplates(req, res) {
    try {
        const collection = req.query.collection;
        const hasTable = await database_1.db.schema.hasTable('neurofy_templates');
        if (!hasTable) {
            return res.json({ data: [] });
        }
        let query = (0, database_1.db)('neurofy_templates').select('*');
        if (collection)
            query = query.where('collection', collection);
        const templates = await query.orderBy('created_at', 'desc');
        const data = templates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            collection: t.collection,
            data: t.data_json ? JSON.parse(t.data_json) : {},
            category: t.category || 'general',
            createdAt: t.created_at,
            updatedAt: t.updated_at,
        }));
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/templates
async function createTemplate(req, res) {
    try {
        const body = req.body;
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await (0, database_1.db)('neurofy_templates').insert({
            id,
            name: body.name,
            description: body.description || '',
            collection: body.collection,
            data_json: JSON.stringify(body.data || {}),
            category: body.category || 'general',
            created_by: req.auth?.email || 'system',
            created_at: now,
            updated_at: now,
        });
        res.status(201).json({ data: { id } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// PATCH /api/templates/:id
async function updateTemplate(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        const updateData = { updated_at: new Date().toISOString() };
        if (body.name !== undefined)
            updateData.name = body.name;
        if (body.description !== undefined)
            updateData.description = body.description;
        if (body.data !== undefined)
            updateData.data_json = JSON.stringify(body.data);
        if (body.category !== undefined)
            updateData.category = body.category;
        await (0, database_1.db)('neurofy_templates').where('id', id).update(updateData);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// DELETE /api/templates/:id
async function deleteTemplate(req, res) {
    try {
        const { id } = req.params;
        await (0, database_1.db)('neurofy_templates').where('id', id).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=templates.controller.js.map