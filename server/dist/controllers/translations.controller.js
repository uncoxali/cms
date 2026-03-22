"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslations = getTranslations;
exports.createOrUpdateTranslation = createOrUpdateTranslation;
exports.deleteTranslation = deleteTranslation;
const database_1 = require("../config/database");
const date_1 = require("../utils/date");
// GET /api/translations
async function getTranslations(req, res) {
    try {
        const collection = req.query.collection;
        const itemId = req.query.item_id;
        const locale = req.query.locale;
        if (!collection || !itemId) {
            return res.status(400).json({ error: 'collection and item_id are required' });
        }
        let query = (0, database_1.db)('neurofy_translations').where({ collection, item_id: itemId });
        if (locale)
            query = query.where({ locale });
        const rows = await query.orderBy('field');
        res.json({ data: rows });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// POST /api/translations
async function createOrUpdateTranslation(req, res) {
    try {
        const { collection, item_id, field, locale, value } = req.body;
        if (!collection || !item_id || !field || !locale) {
            return res.status(400).json({ error: 'collection, item_id, field, and locale are required' });
        }
        const existing = await (0, database_1.db)('neurofy_translations')
            .where({ collection, item_id, field, locale }).first();
        if (existing) {
            await (0, database_1.db)('neurofy_translations')
                .where({ id: existing.id })
                .update({ value, updated_at: (0, date_1.toDbDate)() });
            return res.json({ data: { ...existing, value } });
        }
        const [id] = await (0, database_1.db)('neurofy_translations').insert({
            collection, item_id, field, locale, value,
            created_at: (0, date_1.toDbDate)(),
            updated_at: (0, date_1.toDbDate)(),
        });
        res.status(201).json({ data: { id, collection, item_id, field, locale, value } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// DELETE /api/translations
async function deleteTranslation(req, res) {
    try {
        const id = req.query.id;
        if (!id)
            return res.status(400).json({ error: 'id is required' });
        await (0, database_1.db)('neurofy_translations').where({ id }).delete();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=translations.controller.js.map